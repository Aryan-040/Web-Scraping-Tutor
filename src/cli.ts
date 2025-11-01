import * as readlineSync from "readline-sync";
import { UI } from "./ui";

/**
 * Interactive CLI for user-friendly project and issue selection
 */

const AVAILABLE_PROJECTS = [
  "SPARK",
  "KAFKA",
  "HADOOP",
  "HIVE",
  "FLINK",
  "STORM",
  "LUCENE",
  "SOLR",
  "CASSANDRA",
  "ZOOKEEPER"
];

export interface ScrapeConfig {
  projects: string[];
  maxIssuesPerProject: number | null; // null = all issues, or use perProjectLimits
  perProjectLimits?: Record<string, number>; // Per-project limits override maxIssuesPerProject
}

export function getScrapeConfig(): ScrapeConfig {
  UI.header("Apache Jira Scraper - Interactive Configuration", 70);

  // Step 1: Project Selection
  UI.subheader("Available Apache Projects", 70);
  AVAILABLE_PROJECTS.forEach((project, index) => {
    UI.listItem(index + 1, project, false);
  });
  UI.listItem(AVAILABLE_PROJECTS.length + 1, "All projects", true);
  UI.listItem(AVAILABLE_PROJECTS.length + 2, "Custom (enter comma-separated)", false);

  const projectChoice = readlineSync.question(
    `\nSelect projects (1-${AVAILABLE_PROJECTS.length + 2}): `
  );

  let selectedProjects: string[];

  const choiceNum = parseInt(projectChoice, 10);
  if (choiceNum === AVAILABLE_PROJECTS.length + 1) {
    // All projects
    selectedProjects = AVAILABLE_PROJECTS;
  } else if (choiceNum === AVAILABLE_PROJECTS.length + 2) {
    // Custom input
    const customInput = readlineSync.question(
      "Enter project keys (comma-separated, e.g., SPARK,KAFKA): "
    );
    selectedProjects = customInput
      .split(",")
      .map(p => p.trim().toUpperCase())
      .filter(p => p.length > 0);
    
    if (selectedProjects.length === 0) {
      UI.error("No valid projects entered. Using default: SPARK, KAFKA, HADOOP");
      selectedProjects = ["SPARK", "KAFKA", "HADOOP"];
    }
  } else if (choiceNum >= 1 && choiceNum <= AVAILABLE_PROJECTS.length) {
    // Ask for multiple selection
    const multiSelect = readlineSync.keyInYNStrict(
      "Select multiple projects? (y/n): "
    );
    
    if (multiSelect) {
      UI.info("\nSelect projects (enter numbers separated by commas, e.g., 1,2,3):");
      const multiInput = readlineSync.question("Project numbers: ");
      const numbers = multiInput.split(",").map(n => parseInt(n.trim(), 10)).filter(n => !isNaN(n));
      
      if (numbers.length > 0) {
        selectedProjects = numbers
          .filter(n => n >= 1 && n <= AVAILABLE_PROJECTS.length)
          .map(n => AVAILABLE_PROJECTS[n - 1])
          .filter((p): p is string => p !== undefined)
          .filter((p, i, arr) => arr.indexOf(p) === i); // Remove duplicates
        
        if (selectedProjects.length === 0) {
          const defaultProject = AVAILABLE_PROJECTS[choiceNum - 1];
          selectedProjects = defaultProject ? [defaultProject] : ["SPARK"];
        }
      } else {
        const defaultProject = AVAILABLE_PROJECTS[choiceNum - 1];
        selectedProjects = defaultProject ? [defaultProject] : ["SPARK"];
      }
    } else {
      const defaultProject = AVAILABLE_PROJECTS[choiceNum - 1];
      selectedProjects = defaultProject ? [defaultProject] : ["SPARK"];
    }
  } else {
    UI.error("Invalid choice. Using default: SPARK, KAFKA, HADOOP");
    selectedProjects = ["SPARK", "KAFKA", "HADOOP"];
  }

  // Step 2: Issue Limit
  UI.subheader(`Selected Projects: ${selectedProjects.join(", ")}`, 70);
  
  const limitChoice = readlineSync.keyInYNStrict(
    "Limit the number of issues per project? (y/n): "
  );

  let maxIssuesPerProject: number | null = null;
  const perProjectLimits: Record<string, number> = {};

  if (limitChoice) {
    // If multiple projects, ask if they want different limits per project
    if (selectedProjects.length > 1) {
      const differentLimits = readlineSync.keyInYNStrict(
        "Set different limits for each project? (y/n): "
      );

      if (differentLimits) {
        UI.info("\nEnter issue limit for each project (or press Enter for 'All'):");
        for (const project of selectedProjects) {
          const limitInput = readlineSync.question(
            `  ${project} (default: All): `
          );
          
          if (limitInput.trim() === "") {
            // No limit for this project (collect all)
            continue;
          }
          
          const limitNum = parseInt(limitInput, 10);
          if (!isNaN(limitNum) && limitNum > 0) {
            perProjectLimits[project] = limitNum;
            UI.success(`    Set to ${limitNum} issues`);
          } else {
            UI.warning(`    Invalid number, using 'All'`);
          }
        }
      } else {
        // Same limit for all projects
        const limitInput = readlineSync.question(
          "How many issues per project? (enter number): "
        );
        const limitNum = parseInt(limitInput, 10);
        
        if (isNaN(limitNum) || limitNum <= 0) {
          console.log("Invalid number. Collecting all issues.");
          maxIssuesPerProject = null;
        } else {
          maxIssuesPerProject = limitNum;
          UI.success(`Will collect up to ${maxIssuesPerProject} issues per project.`);
        }
      }
    } else {
      // Single project - simple input
      const limitInput = readlineSync.question(
        `How many issues for ${selectedProjects[0]}? (enter number): `
      );
      const limitNum = parseInt(limitInput, 10);
      
      if (isNaN(limitNum) || limitNum <= 0) {
        UI.warning("Invalid number. Collecting all issues.");
        maxIssuesPerProject = null;
      } else {
        maxIssuesPerProject = limitNum;
        UI.success(`Will collect up to ${maxIssuesPerProject} issues.`);
      }
    }
  } else {
    UI.info("Will collect all available issues.");
  }

  // Summary
  UI.header("Configuration Summary", 70);
  UI.keyValue("Projects", selectedProjects.join(", "));
  
  if (Object.keys(perProjectLimits).length > 0) {
    console.log();
    UI.subheader("Issues per Project", 70);
    for (const project of selectedProjects) {
      const limit = perProjectLimits[project] || "All";
      UI.keyValue(`  ${project}`, limit);
    }
  } else {
    UI.keyValue("Issues per project", maxIssuesPerProject ? maxIssuesPerProject : "All");
  }
  
  console.log();

  const confirm = readlineSync.keyInYNStrict("Proceed with scraping? (y/n): ");
  
  if (!confirm) {
    UI.warning("Operation cancelled by user.");
    process.exit(0);
  }

  const config: ScrapeConfig = {
    projects: selectedProjects,
    maxIssuesPerProject,
  };
  
  if (Object.keys(perProjectLimits).length > 0) {
    config.perProjectLimits = perProjectLimits;
  }
  
  return config;
}

