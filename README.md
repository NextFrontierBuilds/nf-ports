# nf-ports

[![npm version](https://img.shields.io/npm/v/nf-ports.svg)](https://www.npmjs.com/package/nf-ports)
[![downloads](https://img.shields.io/npm/dm/nf-ports.svg)](https://www.npmjs.com/package/nf-ports)

Dev server port manager for macOS. Stop guessing what's using port 3000.

## Features

- 📋 **List** common dev ports (3000-3010, 5000-5010, 8000-8010)
- 🔍 **Scan** custom port ranges
- 💀 **Kill** processes by port
- 🔎 **Find** all ports by process name

## Install

```bash
npm install -g ports-cli
```

Or run directly:

```bash
npx ports-cli
```

## Usage

```bash
# List common dev ports
ports

# Scan custom range
ports scan 9000 9100

# Kill process on port
ports kill 3000

# Force kill (no confirm)
ports kill 3000 -f

# Find all node processes
ports find node
```

## Example Output

```
🔌 Port Status

PORT     STATUS      PROCESS              PID
──────────────────────────────────────────────────
3000     ✅ LISTEN   node                 12345
3001     ⬜ free
4000     ✅ LISTEN   next-server          12346
5000     ⬜ free
5173     ✅ LISTEN   vite                 12347
8000     ⬜ free
8080     ✅ LISTEN   nginx                12348
──────────────────────────────────────────────────
4 active / 49 checked
```

## Commands

| Command | Description |
|---------|-------------|
| `ports` | List common dev ports |
| `ports scan <start> <end>` | Scan custom range |
| `ports kill <port>` | Kill process on port |
| `ports kill <port> -f` | Force kill (no confirm) |
| `ports find <name>` | Find by process name |

## Common Dev Ports

Pre-configured to check:
- 3000-3010 (React, Next.js)
- 4000-4010 (GraphQL, misc)
- 5000-5010 (Flask, misc)
- 5173 (Vite)
- 8000-8010 (Django, FastAPI)
- 8080, 8888 (Nginx, Jupyter)

## Requirements

- macOS only (uses `lsof`)
- Node.js 14+

## License

MIT

## Author

Built by [Next Frontier](https://github.com/NextFrontierBuilds) 🧭
