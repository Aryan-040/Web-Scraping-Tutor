/**
 * UI Utilities
 * Enhanced terminal output with colors, formatting, and visual design
 */

// ANSI color codes
export const Colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  
  // Text colors
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  // Background colors
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m',
};

// Status indicators
export const Status = {
  success: `${Colors.green}[SUCCESS]${Colors.reset}`,
  error: `${Colors.red}[ERROR]${Colors.reset}`,
  warning: `${Colors.yellow}[WARNING]${Colors.reset}`,
  info: `${Colors.blue}[INFO]${Colors.reset}`,
  processing: `${Colors.cyan}[PROCESSING]${Colors.reset}`,
  done: `${Colors.green}[DONE]${Colors.reset}`,
  skip: `${Colors.dim}[SKIP]${Colors.reset}`,
};

// UI Helper functions
export const UI = {
  // Draw a horizontal line
  separator: (char: string = '=', length: number = 60): string => {
    return Colors.dim + char.repeat(length) + Colors.reset;
  },

  // Print a header section
  header: (title: string, width: number = 60): void => {
    const padding = Math.max(0, Math.floor((width - title.length - 2) / 2));
    const line = '='.repeat(width);
    console.log(Colors.cyan + Colors.bright + line + Colors.reset);
    console.log(
      Colors.cyan + Colors.bright +
      ' '.repeat(padding) + title + ' '.repeat(width - title.length - padding) +
      Colors.reset
    );
    console.log(Colors.cyan + Colors.bright + line + Colors.reset);
  },

  // Print a subheader
  subheader: (title: string, width: number = 60): void => {
    const line = '-'.repeat(width);
    console.log('\n' + Colors.blue + line + Colors.reset);
    console.log(Colors.blue + Colors.bright + title + Colors.reset);
    console.log(Colors.blue + line + Colors.reset);
  },

  // Success message
  success: (message: string): void => {
    console.log(Status.success + ' ' + Colors.green + message + Colors.reset);
  },

  // Error message
  error: (message: string): void => {
    console.error(Status.error + ' ' + Colors.red + message + Colors.reset);
  },

  // Warning message
  warning: (message: string): void => {
    console.log(Status.warning + ' ' + Colors.yellow + message + Colors.reset);
  },

  // Info message
  info: (message: string): void => {
    console.log(Status.info + ' ' + Colors.blue + message + Colors.reset);
  },

  // Processing message
  processing: (message: string): void => {
    console.log(Status.processing + ' ' + Colors.cyan + message + Colors.reset);
  },

  // Section title
  section: (title: string): void => {
    console.log('\n' + Colors.magenta + Colors.bright + `> ${title}` + Colors.reset);
  },

  // Key-value pair display
  keyValue: (key: string, value: string | number, indent: number = 2): void => {
    const indentStr = ' '.repeat(indent);
    const formattedKey = Colors.bright + Colors.cyan + key.padEnd(25) + Colors.reset;
    const formattedValue = Colors.white + String(value) + Colors.reset;
    console.log(`${indentStr}${formattedKey} ${formattedValue}`);
  },

  // List item
  listItem: (index: number, text: string, highlight: boolean = false): void => {
    const num = Colors.dim + `${index}. ` + Colors.reset;
    const content = highlight 
      ? Colors.bright + Colors.white + text + Colors.reset
      : Colors.white + text + Colors.reset;
    console.log(`  ${num}${content}`);
  },

  // Boxed text
  box: (lines: string[], title?: string): void => {
    const maxLen = Math.max(...lines.map(l => l.length), title ? title.length : 0);
    const width = maxLen + 4;
    const horizontal = Colors.cyan + '+' + '-'.repeat(width - 2) + '+' + Colors.reset;
    
    console.log('\n' + horizontal);
    if (title) {
      const titlePadding = Math.floor((width - title.length - 2) / 2);
      console.log(
        Colors.cyan + '|' + Colors.reset +
        ' '.repeat(titlePadding) + Colors.bright + Colors.white + title + Colors.reset +
        ' '.repeat(width - title.length - titlePadding - 2) +
        Colors.cyan + '|' + Colors.reset
      );
      console.log(Colors.cyan + '|' + '-'.repeat(width - 2) + '|' + Colors.reset);
    }
    for (const line of lines) {
      const padding = width - line.length - 3;
      console.log(
        Colors.cyan + '|' + Colors.reset + ' ' +
        Colors.white + line + Colors.reset +
        ' '.repeat(padding) + Colors.cyan + '|' + Colors.reset
      );
    }
    console.log(horizontal + '\n');
  },

  // Progress information
  progress: (current: number, total: number, label: string = ''): void => {
    const percentage = ((current / total) * 100).toFixed(1);
    const barWidth = 30;
    const filled = Math.floor((current / total) * barWidth);
    const empty = barWidth - filled;
    const bar = Colors.green + '█'.repeat(filled) + Colors.dim + '░'.repeat(empty) + Colors.reset;
    
    const labelText = label ? `${label}: ` : '';
    const percentageText = Colors.bright + Colors.cyan + `${percentage}%` + Colors.reset;
    const countText = Colors.dim + `(${current}/${total})` + Colors.reset;
    
    process.stdout.write(`\r${labelText}${bar} ${percentageText} ${countText}`);
    if (current === total) {
      console.log(); // New line when complete
    }
  },

  // Table row
  tableRow: (columns: string[], widths: number[]): void => {
    const row = columns
      .map((col, i) => {
        const width = widths[i] || 15;
        return (Colors.white + col + Colors.reset).padEnd(width);
      })
      .join(' | ');
    console.log('  ' + row);
  },

  // Table header
  tableHeader: (columns: string[], widths: number[]): void => {
    const header = columns
      .map((col, i) => {
        const width = widths[i] || 15;
        return (Colors.bright + Colors.cyan + col + Colors.reset).padEnd(width);
      })
      .join(' | ');
    const separator = widths.map(w => '-'.repeat(w || 15)).join('-+-');
    console.log('  ' + header);
    console.log('  ' + Colors.dim + separator + Colors.reset);
  },
};

// Check if colors should be enabled (for environments that don't support them)
export function enableColors(): boolean {
  return process.stdout.isTTY && !process.env.NO_COLOR;
}

// Disable colors if needed
if (!enableColors()) {
  // Reset all color codes if colors are disabled
  Object.keys(Colors).forEach(key => {
    (Colors as any)[key] = '';
  });
  Object.keys(Status).forEach(key => {
    (Status as any)[key] = `[${key.toUpperCase()}]`;
  });
}

