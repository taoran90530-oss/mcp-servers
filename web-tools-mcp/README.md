# Web Tools MCP Server

Give Claude the ability to browse the web, extract structured data, and discover content.

## Installation

```bash
npm install
```

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "web-tools": {
      "command": "node",
      "args": ["path/to/web-tools-mcp/index.js"]
    }
  }
}
```

## Tools

| Tool | Description |
|------|-------------|
| `fetch_webpage` | Fetch and extract clean text from any URL. Returns content with HTML stripped. Supports optional CSS selector for targeted extraction. |
| `extract_structured_data` | Extract tables, prices, emails, dates, links, and headings from HTML content. Returns structured JSON. |
| `generate_sitemap_urls` | Generate common sitemap and RSS feed URLs for a domain. Helps discover content programmatically. |
| `parse_markdown_table` | Convert markdown tables to structured JSON. Handles multi-column tables with headers. |
| `summarize_text` | Extract key points, entities (emails, URLs), and summary statistics from long text. |

## Use Cases

**Competitor Research**
> Claude, fetch competitor.com/pricing and extract all price points

**Lead Generation**
> Extract all emails and links from this industry directory page

**Content Research**
> Get content from these 10 articles and summarize key findings

**Data Collection**
> Parse this markdown table into JSON for analysis

## Requirements

- Node.js 18+
- Claude Desktop or any MCP-compatible client

## License

Apache 2.0 - use freely in commercial projects.

## Buy

[Available on Gumroad for $24](https://taoran2.gumroad.com/l/qxfqt)
