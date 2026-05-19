# MCP Server Setup Guide

## Prerequisites
- Node.js 18+ installed
- Claude Desktop app OR Claude Code CLI

## Quick Start (All 3 Servers)

### 1. Install Dependencies

```bash
# In each server directory:
cd web-tools-mcp && npm install
cd ../data-analysis-mcp && npm install
cd ../content-tools-mcp && npm install
```

### 2. Configure Claude Desktop

Add to your `claude_desktop_config.json` (Windows: `%APPDATA%\Claude\`, Mac: `~/Library/Application Support/Claude/`):

```json
{
  "mcpServers": {
    "web-tools": {
      "command": "node",
      "args": ["D:/中转站/products/mcp-servers/web-tools-mcp/index.js"]
    },
    "data-analysis": {
      "command": "node",
      "args": ["D:/中转站/products/mcp-servers/data-analysis-mcp/index.js"]
    },
    "content-tools": {
      "command": "node",
      "args": ["D:/中转站/products/mcp-servers/content-tools-mcp/index.js"]
    }
  }
}
```

### 3. Restart Claude

Close and reopen Claude Desktop. You'll see a hammer icon indicating MCP tools are available.

### 4. Test It Works

Ask Claude:
- "Use web-tools to fetch the content from example.com"
- "Use data-analysis to analyze this CSV: [paste your data]"
- "Use content-tools to score this headline: [your headline]"

## Troubleshooting

**Server not showing up**: Check the path in claude_desktop_config.json is correct
**Tools not responding**: Run `node index.js` manually to see error output
**Timeout errors**: Increase timeout in web-tools fetch_webpage (currently 15s)
