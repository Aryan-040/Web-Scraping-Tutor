import fs from "fs";
import path from "path";
import * as readlineSync from "readline-sync";
import { UI, Status } from "./ui";

/**
 * DATASET ANALYZER
 * Provides statistics and insights about the generated dataset
 */

const DATASET_FILE = path.join(__dirname, "../data/processed/output.jsonl");

interface TaskEntry {
  task_type: string;
  instruction: string;
  input: string;
  output: string;
  metadata: Record<string, any>;
}

function selectProjects(allProjects: string[], processedProjects: string[]): string[] {
  if (allProjects.length === 0) {
    return [];
  }

  if (allProjects.length === 1) {
    return allProjects.filter(p => processedProjects.includes(p));
  }

  UI.header("Dataset Analyzer - Project Selection", 70);

  UI.subheader("Available Projects", 70);
  allProjects.forEach((project, index) => {
    const isProcessed = processedProjects.includes(project);
    const status = isProcessed 
      ? Status.success.replace(/\[SUCCESS\]/, "[READY]")
      : Status.warning.replace(/\[WARNING\]/, "[NOT PROCESSED]");
    console.log(`  ${index + 1}. ${project} ${status}`);
  });
  UI.listItem(allProjects.length + 1, "All processed projects", true);
  UI.listItem(allProjects.length + 2, "Multiple (select by numbers)", false);

  const choice = readlineSync.question(
    `\nSelect project(s) to analyze (1-${allProjects.length + 2}): `
  );

  const choiceNum = parseInt(choice, 10);

  if (choiceNum === allProjects.length + 1) {
    // All processed projects
    return processedProjects;
  } else if (choiceNum === allProjects.length + 2) {
    // Multiple selection
    const multiInput = readlineSync.question(
      "Enter project numbers (comma-separated, e.g., 1,2,3): "
    );
    const numbers = multiInput
      .split(",")
      .map(n => parseInt(n.trim(), 10))
      .filter(n => !isNaN(n) && n >= 1 && n <= allProjects.length);

    if (numbers.length > 0) {
      const selected = numbers
        .map(n => allProjects[n - 1])
        .filter((p): p is string => p !== undefined)
        .filter((p, i, arr) => arr.indexOf(p) === i); // Remove duplicates
      
      // Filter to only processed projects
      const processedSelected = selected.filter(p => processedProjects.includes(p));
      
      if (processedSelected.length === 0) {
        UI.error("None of the selected projects have been processed yet.");
        UI.info("Please run: npm run transform");
        return [];
      }
      
      const unprocessed = selected.filter(p => !processedProjects.includes(p));
      if (unprocessed.length > 0) {
        UI.warning(`Skipping unprocessed projects: ${unprocessed.join(", ")}`);
        UI.info("Run: npm run transform to process them first.");
      }
      
      return processedSelected.length > 0 ? processedSelected : [];
    }
    return processedProjects;
  } else if (choiceNum >= 1 && choiceNum <= allProjects.length) {
    // Single project
    const selected = allProjects[choiceNum - 1];
    if (selected && processedProjects.includes(selected)) {
      return [selected];
    } else if (selected) {
      UI.error(`Project ${selected} has not been processed yet.`);
      UI.info("Please run: npm run transform");
      return [];
    }
  }

  // Default: all processed projects
  return processedProjects;
}

function analyzeDataset(selectedProjects: string[] | null = null) {
  const RAW_DIR = path.join(__dirname, "../data/raw");
  const PROCESSED_DIR = path.join(__dirname, "../data/processed");
  
  // Get all projects from raw data files
  const rawProjects: string[] = [];
  if (fs.existsSync(RAW_DIR)) {
    const rawFiles = fs.readdirSync(RAW_DIR).filter(f => f.endsWith(".json"));
    rawProjects.push(...rawFiles.map(f => f.replace(".json", "")));
  }

  // Get projects from processed data
  let processedProjects: string[] = [];
  let allTasks: TaskEntry[] = [];
  
  if (fs.existsSync(DATASET_FILE)) {
    UI.processing("Loading processed dataset...\n");
    const lines = fs.readFileSync(DATASET_FILE, "utf-8")
      .split("\n")
      .filter(line => line.trim().length > 0);

    allTasks = lines.map(line => JSON.parse(line));

    // Get available projects from processed data
    processedProjects = Array.from(
      new Set(allTasks.map(t => t.metadata.project).filter((p): p is string => !!p))
    ).sort();
  }

  // Combine and deduplicate - prefer processed projects first
  const allAvailableProjects = Array.from(new Set([...processedProjects, ...rawProjects])).sort();
  
  // Show status
  if (rawProjects.length > 0 && processedProjects.length === 0) {
    UI.error(`Dataset file not found: ${DATASET_FILE}`);
    UI.error(`Found ${rawProjects.length} project(s) in raw data: ${rawProjects.join(", ")}`);
    UI.error("Please run the transformer first to process the data.");
    process.exit(1);
  }

  if (allAvailableProjects.length === 0) {
    UI.error("No projects found in raw data or processed dataset.");
    process.exit(1);
  }

  // Show info about processed vs raw projects
  const unprocessedProjects = rawProjects.filter(p => !processedProjects.includes(p));
  if (unprocessedProjects.length > 0) {
    UI.warning(`${unprocessedProjects.length} project(s) in raw data not yet processed: ${unprocessedProjects.join(", ")}\n`);
  }

  // Use processed projects for analysis (since we can only analyze what's been processed)
  if (processedProjects.length === 0) {
    UI.error("No processed projects found in dataset.");
    if (rawProjects.length > 0) {
      UI.error(`Found ${rawProjects.length} project(s) in raw data: ${rawProjects.join(", ")}`);
      UI.error("Please run: npm run transform");
    }
    process.exit(1);
  }

  // Let user select projects if not provided
  let projectsToAnalyze: string[];
  if (selectedProjects) {
    projectsToAnalyze = selectedProjects.filter(p => processedProjects.includes(p));
    if (projectsToAnalyze.length === 0) {
      const unprocessed = selectedProjects.filter(p => !processedProjects.includes(p));
      UI.error(`None of the specified projects have been processed.`);
      if (unprocessed.length > 0) {
        UI.error(`Unprocessed projects: ${unprocessed.join(", ")}`);
        UI.error("Please run: npm run transform");
      }
      process.exit(1);
    }
    
    // Warn about unprocessed selections
    const unprocessed = selectedProjects.filter(p => !processedProjects.includes(p));
    if (unprocessed.length > 0) {
      UI.warning(`${unprocessed.join(", ")} not processed yet. Skipping...`);
    }
  } else {
    projectsToAnalyze = selectProjects(allAvailableProjects, processedProjects);
    
    if (projectsToAnalyze.length === 0) {
      UI.warning("No processed projects selected. Exiting.");
      process.exit(0);
    }
  }

  // Filter tasks by selected projects
  const tasks = allTasks.filter(
    t => t.metadata.project && projectsToAnalyze.includes(t.metadata.project)
  );

  if (tasks.length === 0) {
    UI.error(`No tasks found for selected projects: ${projectsToAnalyze.join(", ")}`);
    process.exit(1);
  }

  // Task type distribution
  const taskTypeCounts: Record<string, number> = {};
  const projects: Set<string> = new Set();
  const statuses: Set<string> = new Set();
  const totalInputChars = { total: 0, count: 0 };
  const totalOutputChars = { total: 0, count: 0 };

  // Per-project statistics
  const projectStats: Record<string, {
    tasks: number;
    issues: Set<string>;
    taskTypes: Record<string, number>;
  }> = {};

  for (const task of tasks) {
    const project = task.metadata.project || "Unknown";
    
    taskTypeCounts[task.task_type] = (taskTypeCounts[task.task_type] || 0) + 1;
    projects.add(project);
    if (task.metadata.status) statuses.add(task.metadata.status);
    
    totalInputChars.total += task.input.length;
    totalInputChars.count++;
    totalOutputChars.total += task.output.length;
    totalOutputChars.count++;

    // Per-project stats
    if (!projectStats[project]) {
      projectStats[project] = {
        tasks: 0,
        issues: new Set(),
        taskTypes: {}
      };
    }
    projectStats[project].tasks++;
    if (task.metadata.issue_id) {
      projectStats[project].issues.add(task.metadata.issue_id);
    }
    projectStats[project].taskTypes[task.task_type] = 
      (projectStats[project].taskTypes[task.task_type] || 0) + 1;
  }

  // Unique issues
  const uniqueIssues = new Set(tasks.map(t => t.metadata.issue_id));

  UI.header("Dataset Statistics", 70);
  UI.keyValue("Selected projects", projectsToAnalyze.join(", "));
  UI.keyValue("Total training examples", tasks.length);
  UI.keyValue("Unique issues", uniqueIssues.size);
  UI.keyValue("Projects", `${projects.size} (${Array.from(projects).join(", ")})`);
  UI.keyValue("Average examples per issue", (tasks.length / uniqueIssues.size).toFixed(2));

  // Per-project breakdown
  UI.subheader("Per-Project Breakdown", 70);
  for (const project of projectsToAnalyze.sort()) {
    const stats = projectStats[project];
    if (stats) {
      console.log();
      UI.section(project);
      UI.keyValue("Issues", stats.issues.size);
      UI.keyValue("Training examples", stats.tasks);
      UI.keyValue("Avg examples per issue", (stats.tasks / stats.issues.size).toFixed(2));
    }
  }

  UI.subheader("Task Type Distribution", 70);
  const sortedTypes = Object.entries(taskTypeCounts)
    .sort((a, b) => b[1] - a[1]);
  UI.tableHeader(["Task Type", "Count", "Percentage"], [25, 10, 15]);
  for (const [type, count] of sortedTypes) {
    const percentage = ((count / tasks.length) * 100).toFixed(1);
    UI.tableRow([type, count.toString(), `${percentage}%`], [25, 10, 15]);
  }

  // Per-project task type breakdown
  if (projectsToAnalyze.length > 1) {
    UI.subheader("Task Type by Project", 70);
    for (const project of projectsToAnalyze.sort()) {
      const stats = projectStats[project];
      if (stats) {
        console.log();
        UI.section(project);
        const sorted = Object.entries(stats.taskTypes).sort((a, b) => b[1] - a[1]);
        UI.tableHeader(["Task Type", "Count", "Percentage"], [25, 10, 15]);
        for (const [type, count] of sorted) {
          const percentage = ((count / stats.tasks) * 100).toFixed(1);
          UI.tableRow([type, count.toString(), `${percentage}%`], [25, 10, 15]);
        }
      }
    }
  }

  UI.subheader("Text Statistics", 70);
  const avgInputLength = Math.round(totalInputChars.total / totalInputChars.count);
  const avgOutputLength = Math.round(totalOutputChars.total / totalOutputChars.count);
  UI.keyValue("Average input length", `${avgInputLength} characters`);
  UI.keyValue("Average output length", `${avgOutputLength} characters`);
  UI.keyValue("Estimated input tokens", `~${Math.round(avgInputLength / 4)}`);
  UI.keyValue("Estimated output tokens", `~${Math.round(avgOutputLength / 4)}`);

  // Status distribution
  const statusCounts: Record<string, number> = {};
  for (const task of tasks) {
    if (task.metadata.status) {
      statusCounts[task.metadata.status] = (statusCounts[task.metadata.status] || 0) + 1;
    }
  }

  if (Object.keys(statusCounts).length > 0) {
    UI.subheader("Status Distribution", 70);
    const sortedStatuses = Object.entries(statusCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    UI.tableHeader(["Status", "Count", "Percentage"], [25, 10, 15]);
    for (const [status, count] of sortedStatuses) {
      const percentage = ((count / tasks.length) * 100).toFixed(1);
      UI.tableRow([status, count.toString(), `${percentage}%`], [25, 10, 15]);
    }
  }

  // Sample examples
  UI.header("Sample Examples", 70);
  
  const sampleTypes = ["summarization", "classification", "question_answering"];
  for (const type of sampleTypes) {
    const sample = tasks.find(t => {
      const project = t.metadata.project;
      return t.task_type === type && project && projectsToAnalyze.includes(project);
    });
    if (sample) {
      const project = sample.metadata.project || "Unknown";
      console.log();
      UI.section(`${type.toUpperCase()} - ${project}`);
      UI.keyValue("Instruction", sample.instruction);
      UI.keyValue("Input", `${sample.input.substring(0, 150)}...`);
      UI.keyValue("Output", `${sample.output.substring(0, 150)}...`);
    }
  }

  UI.header("Analysis Complete", 70);
}

// Check for command-line project argument
const args = process.argv.slice(2);
const projectArgIndex = args.indexOf("--projects");
let selectedProjects: string[] | null = null;

if (projectArgIndex !== -1) {
  const projectArg = args[projectArgIndex + 1];
  if (projectArg) {
    selectedProjects = projectArg.split(",").map(p => p.trim().toUpperCase());
  }
}

analyzeDataset(selectedProjects);