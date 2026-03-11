#!/usr/bin/env node

/**
 * ports - Dev server port manager
 * Lists, scans, and manages processes on dev ports
 * 
 * Usage:
 *   ports [list]              List common dev ports
 *   ports scan [start] [end]  Scan custom port range
 *   ports kill <port> [-f]    Kill process on port
 *   ports find <name>         Find ports by process name
 *   ports -h | --help         Show help
 * 
 * Built by Meridian 🧭 (Nightly Build 2026-02-27)
 */

const { execSync, spawn } = require('child_process');
const readline = require('readline');

// ANSI colors
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

// Common dev ports to check
const COMMON_PORTS = [
  ...Array.from({ length: 11 }, (_, i) => 3000 + i),  // 3000-3010
  ...Array.from({ length: 11 }, (_, i) => 4000 + i),  // 4000-4010
  ...Array.from({ length: 11 }, (_, i) => 5000 + i),  // 5000-5010
  5173,  // Vite default
  ...Array.from({ length: 11 }, (_, i) => 8000 + i),  // 8000-8010
  8080, 8888,  // Common alternates
  18791, 18800,  // Clawdbot browser ports
];

// Get process info for a port using lsof (macOS)
function getPortInfo(port) {
  try {
    const output = execSync(`lsof -i :${port} -P -n 2>/dev/null | grep LISTEN`, { 
      encoding: 'utf-8',
      timeout: 5000
    });
    const lines = output.trim().split('\n').filter(Boolean);
    if (lines.length > 0) {
      const parts = lines[0].split(/\s+/);
      return {
        listening: true,
        process: parts[0] || 'unknown',
        pid: parts[1] || '?',
      };
    }
  } catch {
    // Not listening or error
  }
  return { listening: false };
}

// Get all listening ports with process info
function getAllListeningPorts() {
  try {
    const output = execSync('lsof -i -P -n 2>/dev/null | grep LISTEN', {
      encoding: 'utf-8',
      timeout: 10000
    });
    const results = [];
    for (const line of output.trim().split('\n')) {
      if (!line) continue;
      const parts = line.split(/\s+/);
      const match = parts[8]?.match(/:(\d+)$/);
      if (match) {
        results.push({
          port: parseInt(match[1]),
          process: parts[0],
          pid: parts[1],
        });
      }
    }
    return results;
  } catch {
    return [];
  }
}

// Display port table
function listPorts(ports) {
  console.log(`\n${c.bold}${c.cyan}🔌 Port Status${c.reset}\n`);
  console.log(`${c.dim}PORT     STATUS      PROCESS              PID${c.reset}`);
  console.log(`${c.dim}${'─'.repeat(50)}${c.reset}`);
  
  let activeCount = 0;
  
  for (const port of ports.sort((a, b) => a - b)) {
    const info = getPortInfo(port);
    if (info.listening) {
      activeCount++;
      console.log(
        `${c.bold}${port.toString().padEnd(8)}${c.reset}` +
        `${c.green}✅ LISTEN${c.reset}   ` +
        `${info.process.padEnd(20)}${c.gray}${info.pid}${c.reset}`
      );
    } else {
      console.log(
        `${c.gray}${port.toString().padEnd(8)}` +
        `⬜ free${c.reset}`
      );
    }
  }
  
  console.log(`${c.dim}${'─'.repeat(50)}${c.reset}`);
  console.log(`${c.bold}${activeCount}${c.reset} active / ${c.gray}${ports.length} checked${c.reset}\n`);
}

// Scan port range
function scanPorts(start, end) {
  const ports = Array.from({ length: end - start + 1 }, (_, i) => start + i);
  console.log(`${c.cyan}Scanning ports ${start}-${end}...${c.reset}`);
  listPorts(ports);
}

// Kill process on port
async function killPort(port, force = false) {
  const info = getPortInfo(port);
  
  if (!info.listening) {
    console.log(`${c.yellow}⚠️  No process listening on port ${port}${c.reset}`);
    process.exit(0);
  }
  
  console.log(`\n${c.bold}Process on port ${port}:${c.reset}`);
  console.log(`  ${c.cyan}Name:${c.reset} ${info.process}`);
  console.log(`  ${c.cyan}PID:${c.reset}  ${info.pid}\n`);
  
  if (!force) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    
    const answer = await new Promise(resolve => {
      rl.question(`${c.yellow}Kill this process? [y/N]${c.reset} `, resolve);
    });
    rl.close();
    
    if (answer.toLowerCase() !== 'y') {
      console.log(`${c.gray}Cancelled.${c.reset}`);
      process.exit(0);
    }
  }
  
  try {
    execSync(`kill -9 ${info.pid}`);
    console.log(`${c.green}✅ Killed ${info.process} (PID ${info.pid}) on port ${port}${c.reset}`);
  } catch (err) {
    console.error(`${c.red}❌ Failed to kill process: ${err.message}${c.reset}`);
    process.exit(1);
  }
}

// Find ports by process name
function findByProcess(name) {
  const all = getAllListeningPorts();
  const matches = all.filter(p => 
    p.process.toLowerCase().includes(name.toLowerCase())
  );
  
  if (matches.length === 0) {
    console.log(`${c.yellow}No processes found matching "${name}"${c.reset}`);
    process.exit(0);
  }
  
  console.log(`\n${c.bold}${c.cyan}🔍 Processes matching "${name}"${c.reset}\n`);
  console.log(`${c.dim}PORT     PROCESS              PID${c.reset}`);
  console.log(`${c.dim}${'─'.repeat(40)}${c.reset}`);
  
  for (const p of matches.sort((a, b) => a.port - b.port)) {
    console.log(
      `${c.bold}${p.port.toString().padEnd(8)}${c.reset}` +
      `${p.process.padEnd(20)}${c.gray}${p.pid}${c.reset}`
    );
  }
  console.log(`${c.dim}${'─'.repeat(40)}${c.reset}`);
  console.log(`${c.bold}${matches.length}${c.reset} processes found\n`);
}

// Show help
function showHelp() {
  console.log(`
${c.bold}${c.cyan}ports${c.reset} - Dev server port manager

${c.bold}USAGE${c.reset}
  ports [list]              List common dev ports (3000-3010, 4000-4010, etc.)
  ports scan <start> <end>  Scan custom port range
  ports kill <port> [-f]    Kill process on port (-f = force, no confirm)
  ports find <name>         Find ports by process name
  ports -h | --help         Show this help

${c.bold}EXAMPLES${c.reset}
  ${c.dim}# See what's running on common ports${c.reset}
  ports

  ${c.dim}# Scan ports 9000-9100${c.reset}
  ports scan 9000 9100

  ${c.dim}# Kill the process on port 3000${c.reset}
  ports kill 3000

  ${c.dim}# Force kill without confirmation${c.reset}
  ports kill 3000 -f

  ${c.dim}# Find all node processes${c.reset}
  ports find node

${c.dim}Built by Meridian 🧭${c.reset}
`);
}

// Main
async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0] || 'list';
  
  if (cmd === '-h' || cmd === '--help') {
    showHelp();
    process.exit(0);
  }
  
  if (cmd === 'list' || !['scan', 'kill', 'find'].includes(cmd)) {
    listPorts(COMMON_PORTS);
  } else if (cmd === 'scan') {
    const start = parseInt(args[1]) || 3000;
    const end = parseInt(args[2]) || start + 100;
    if (end < start || end - start > 1000) {
      console.error(`${c.red}Invalid range. Max 1000 ports.${c.reset}`);
      process.exit(1);
    }
    scanPorts(start, end);
  } else if (cmd === 'kill') {
    const port = parseInt(args[1]);
    if (!port) {
      console.error(`${c.red}Usage: ports kill <port> [-f]${c.reset}`);
      process.exit(1);
    }
    const force = args.includes('-f');
    await killPort(port, force);
  } else if (cmd === 'find') {
    const name = args[1];
    if (!name) {
      console.error(`${c.red}Usage: ports find <name>${c.reset}`);
      process.exit(1);
    }
    findByProcess(name);
  }
}

main().catch(err => {
  console.error(`${c.red}Error: ${err.message}${c.reset}`);
  process.exit(1);
});
