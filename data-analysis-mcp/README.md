# Data Analysis MCP Server

AI-powered business intelligence. Analyze CSV, JSON, and structured data without writing formulas.

## Installation

```bash
npm install
```

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "data-analysis": {
      "command": "node",
      "args": ["path/to/data-analysis-mcp/index.js"]
    }
  }
}
```

## Tools

| Tool | Description |
|------|-------------|
| `analyze_csv` | Parse CSV data with automatic column type detection, null counts, unique values, and distribution stats. Handles up to 10,000 rows by default. |
| `analyze_json` | Extract schema, field types, null percentages, and sample values from JSON arrays or objects. |
| `calculate_metrics` | Calculate business metrics: sum, average, min, max, median, standard deviation, growth rate. Supports group-by for segmented analysis. |
| `detect_anomalies` | Statistical outlier detection using IQR method. Returns anomaly count, percentage, and flagged data points. |
| `generate_report` | Generate structured data quality reports from analysis results. Supports summary, quality, and trends report types. |

## Use Cases

**E-commerce Analytics**
> Analyze this month's orders CSV. Show top products, revenue trends, and flag unusual refund rates.

**Financial Metrics**
> Calculate revenue growth rate by quarter from this JSON data. Group by region.

**Survey Analysis**
> Parse this survey JSON. Show response distributions and detect anomalous submissions.

**Inventory Monitoring**
> Check this inventory CSV for stockout patterns and overstock warnings.

## Requirements

- Node.js 18+
- Claude Desktop or any MCP-compatible client

## License

Apache 2.0 - use freely in commercial projects.

## Buy

[Available on Gumroad for $24](https://taoran2.gumroad.com/l/sowbwl)
