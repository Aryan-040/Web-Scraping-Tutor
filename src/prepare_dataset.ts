import fs from "fs";
import path from "path";
import { UI } from "./ui";

/**
 * PREPARE DATASET
 * Converts the transformer output into various LLM training formats
 */

const INPUT_FILE = path.join(__dirname, "../data/processed/output.jsonl");
const OUTPUT_DIR = path.join(__dirname, "../data/processed");

interface TaskEntry {
  task_type: string;
  instruction: string;
  input: string;
  output: string;
  metadata: Record<string, any>;
}

// Format for OpenAI fine-tuning
function formatOpenAI(task: TaskEntry) {
  return {
    messages: [
      {
        role: "system",
        content: task.instruction
      },
      {
        role: "user",
        content: task.input
      },
      {
        role: "assistant",
        content: task.output
      }
    ]
  };
}

// Format for instruction-following models (Alpaca format)
function formatAlpaca(task: TaskEntry) {
  return {
    instruction: task.instruction,
    input: task.input,
    output: task.output
  };
}

// Format for completion-style training
function formatCompletion(task: TaskEntry) {
  return {
    prompt: `${task.instruction}\n\n${task.input}\n\n`,
    completion: ` ${task.output}`
  };
}

function prepareDataset() {
  UI.header("Dataset Format Preparation", 60);
  
  if (!fs.existsSync(INPUT_FILE)) {
    UI.error(`Input file not found: ${INPUT_FILE}`);
    UI.error("Please run the transformer first.");
    process.exit(1);
  }

  UI.processing("Preparing dataset in multiple formats...\n");

  const lines = fs.readFileSync(INPUT_FILE, "utf-8")
    .split("\n")
    .filter(line => line.trim().length > 0);

  const tasks: TaskEntry[] = lines.map(line => JSON.parse(line));

  // Prepare different formats
  const openAIFormat = tasks.map(formatOpenAI);
  const alpacaFormat = tasks.map(formatAlpaca);
  const completionFormat = tasks.map(formatCompletion);

  // Write outputs
  const openAIFile = path.join(OUTPUT_DIR, "openai_format.jsonl");
  const alpacaFile = path.join(OUTPUT_DIR, "alpaca_format.jsonl");
  const completionFile = path.join(OUTPUT_DIR, "completion_format.jsonl");

  fs.writeFileSync(
    openAIFile,
    openAIFormat.map(item => JSON.stringify(item)).join("\n")
  );

  fs.writeFileSync(
    alpacaFile,
    alpacaFormat.map(item => JSON.stringify(item)).join("\n")
  );

  fs.writeFileSync(
    completionFile,
    completionFormat.map(item => JSON.stringify(item)).join("\n")
  );

  UI.header("Format Preparation Complete", 60);
  UI.subheader("Generated Formats", 60);
  UI.keyValue("OpenAI format", `${openAIFormat.length} examples`);
  UI.keyValue("  File path", openAIFile);
  UI.keyValue("Alpaca format", `${alpacaFormat.length} examples`);
  UI.keyValue("  File path", alpacaFile);
  UI.keyValue("Completion format", `${completionFormat.length} examples`);
  UI.keyValue("  File path", completionFile);
  console.log();
  UI.success("All formats ready for LLM fine-tuning!");
}

prepareDataset();