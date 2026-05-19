# MCP Server Toolkit - 3 Production MCP Servers

Three production-ready Model Context Protocol (MCP) servers that give Claude and other AI assistants real-world capabilities.

## Servers Included

### 1. Web Tools MCP
Give AI the ability to browse the web, extract structured data, and discover content.
- `fetch_webpage` - Extract clean text from any URL
- `extract_structured_data` - Pull tables, prices, emails, dates from HTML
- `generate_sitemap_urls` - Discover sitemaps and RSS feeds
- `parse_markdown_table` - Convert markdown tables to JSON
- `summarize_text` - Extract key points and entities

### 2. Data Analysis MCP
Turn AI into a data analyst that can process CSV, JSON, and structured data.
- `analyze_csv` - Parse CSV with column stats and distributions
- `analyze_json` - Extract schema, null percentages, samples
- `calculate_metrics` - Sum, avg, growth rate, median, stddev
- `detect_anomalies` - IQR-based outlier detection
- `generate_report` - Structured data quality reports

### 3. Content Tools MCP
Give AI the ability to analyze and optimize content quality.
- `analyze_seo` - Keyword density, readability, suggestions
- `generate_content_brief` - Full content briefs with hooks
- `rewrite_content` - 5-tone rewriting
- `extract_content_ideas` - 10 content angles from any topic
- `optimize_headline` - Score headlines 0-100

## Quick Start

```bash
cd web-tools-mcp && npm install && node index.js
```

Then add to your Claude Desktop config. See SETUP_GUIDE.md for details.

## Pricing

Each server is available individually on Gumroad for $24, or get all 3 + 4 n8n templates + agency resources in the complete Starter Kit for $109.

[Get Web Tools MCP on Gumroad](https://taoran2.gumroad.com/l/qxfqt)
[Get the Complete Starter Kit](https://taoran2.gumroad.com/l/pktldg)

## License

Apache 2.0 - Use freely in commercial projects.
