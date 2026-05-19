#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  { name: "data-analysis-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "analyze_csv",
      description: "Parse CSV data and return column stats, types, null counts, and basic distributions. Input raw CSV text.",
      inputSchema: {
        type: "object",
        properties: {
          csv_text: { type: "string", description: "Raw CSV content as string" },
          max_rows: { type: "number", description: "Max rows to analyze (default 10000)" }
        },
        required: ["csv_text"]
      }
    },
    {
      name: "analyze_json",
      description: "Parse JSON array/object and return schema, stats, and sample values for each field.",
      inputSchema: {
        type: "object",
        properties: {
          json_text: { type: "string", description: "Raw JSON string" }
        },
        required: ["json_text"]
      }
    },
    {
      name: "calculate_metrics",
      description: "Calculate business metrics from structured data: growth rates, averages, sums, trends, ratios.",
      inputSchema: {
        type: "object",
        properties: {
          data: { type: "string", description: "JSON array of objects with numeric fields" },
          metrics: { type: "array", items: { type: "string", enum: ["sum", "avg", "min", "max", "count", "growth_rate", "median", "stddev"] }, description: "Metrics to calculate" },
          field: { type: "string", description: "Field name to calculate metrics on" },
          group_by: { type: "string", description: "Optional field to group by" }
        },
        required: ["data", "metrics", "field"]
      }
    },
    {
      name: "detect_anomalies",
      description: "Detect statistical anomalies and outliers in numerical data using IQR method.",
      inputSchema: {
        type: "object",
        properties: {
          data: { type: "string", description: "JSON array of objects with numeric fields" },
          field: { type: "string", description: "Field to check for anomalies" }
        },
        required: ["data", "field"]
      }
    },
    {
      name: "generate_report",
      description: "Generate a structured data quality and summary report from analyzed data.",
      inputSchema: {
        type: "object",
        properties: {
          analysis_results: { type: "string", description: "JSON results from analyze_csv or analyze_json" },
          report_type: { type: "string", enum: ["summary", "quality", "trends"], description: "Type of report" }
        },
        required: ["analysis_results"]
      }
    }
  ]
}));

function parseCSV(csvText, maxRows = 10000) {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return { error: "CSV must have header and at least one data row" };

  const parseLine = (line) => {
    const result = [];
    let current = "";
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes; }
      else if (char === "," && !inQuotes) { result.push(current.trim()); current = ""; }
      else { current += char; }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows = [];
  const limit = Math.min(lines.length - 1, maxRows);
  for (let i = 1; i <= limit; i++) {
    const cells = parseLine(lines[i]);
    const row = {};
    headers.forEach((h, idx) => { row[h] = cells[idx] || ""; });
    rows.push(row);
  }

  const columnStats = {};
  headers.forEach(h => {
    const values = rows.map(r => r[h]).filter(v => v !== "" && v !== undefined);
    const numericValues = values.map(v => parseFloat(v)).filter(v => !isNaN(v));
    const isNumeric = numericValues.length > values.length * 0.7;
    columnStats[h] = {
      type: isNumeric ? "numeric" : "text",
      total: rows.length,
      non_null: values.length,
      null_count: rows.length - values.length,
      unique: new Set(values).size,
      ...(isNumeric ? {
        min: Math.min(...numericValues),
        max: Math.max(...numericValues),
        avg: (numericValues.reduce((a, b) => a + b, 0) / numericValues.length).toFixed(2),
        sum: numericValues.reduce((a, b) => a + b, 0)
      } : {
        top_values: [...new Set(values)].slice(0, 10)
      })
    };
  });

  return { headers, total_rows: rows.length, column_count: headers.length, column_stats: columnStats, sample_rows: rows.slice(0, 5) };
}

function analyzeJSON(jsonText) {
  let data;
  try { data = JSON.parse(jsonText); } catch (e) { return { error: "Invalid JSON: " + e.message }; }

  const items = Array.isArray(data) ? data : [data];
  if (items.length === 0) return { error: "Empty data" };

  const fields = {};
  items.forEach(item => {
    if (typeof item === "object" && item !== null) {
      Object.keys(item).forEach(key => {
        if (!fields[key]) fields[key] = { types: new Set(), nulls: 0, samples: [] };
        const val = item[key];
        if (val === null || val === undefined) { fields[key].nulls++; }
        else {
          fields[key].types.add(typeof val);
          if (fields[key].samples.length < 3) fields[key].samples.push(val);
        }
      });
    }
  });

  const schema = {};
  Object.entries(fields).forEach(([key, info]) => {
    schema[key] = {
      types: [...info.types],
      null_count: info.nulls,
      null_percentage: ((info.nulls / items.length) * 100).toFixed(1) + "%",
      samples: info.samples
    };
  });

  return { total_items: items.length, fields_count: Object.keys(fields).length, schema, sample_items: items.slice(0, 3) };
}

function calculateMetrics(dataStr, metrics, field, groupBy) {
  let items;
  try { items = JSON.parse(dataStr); } catch (e) { return { error: "Invalid JSON data" }; }
  if (!Array.isArray(items)) items = [items];

  const groups = {};
  if (groupBy) {
    items.forEach(item => {
      const key = String(item[groupBy] || "undefined");
      if (!groups[key]) groups[key] = [];
      const val = parseFloat(item[field]);
      if (!isNaN(val)) groups[key].push(val);
    });
  } else {
    groups["all"] = items.map(item => parseFloat(item[field])).filter(v => !isNaN(v));
  }

  const results = {};
  Object.entries(groups).forEach(([group, values]) => {
    if (values.length === 0) { results[group] = { count: 0 }; return; }
    const sorted = [...values].sort((a, b) => a - b);
    const result = { count: values.length };
    metrics.forEach(m => {
      switch (m) {
        case "sum": result.sum = values.reduce((a, b) => a + b, 0); break;
        case "avg": result.avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2); break;
        case "min": result.min = sorted[0]; break;
        case "max": result.max = sorted[sorted.length - 1]; break;
        case "median": {
          const mid = Math.floor(sorted.length / 2);
          result.median = sorted.length % 2 ? sorted[mid] : ((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2);
          break;
        }
        case "stddev": {
          const mean = values.reduce((a, b) => a + b, 0) / values.length;
          result.stddev = Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length).toFixed(2);
          break;
        }
        case "growth_rate": {
          if (values.length >= 2) {
            const growths = [];
            for (let i = 1; i < values.length; i++) {
              growths.push(values[i - 1] !== 0 ? ((values[i] - values[i - 1]) / values[i - 1]) * 100 : 0);
            }
            result.growth_rate = (growths.reduce((a, b) => a + b, 0) / growths.length).toFixed(2) + "%";
          }
          break;
        }
      }
    });
    results[group] = result;
  });

  return { field, metrics, group_by: groupBy || "none", results };
}

function detectAnomalies(dataStr, field) {
  let items;
  try { items = JSON.parse(dataStr); } catch (e) { return { error: "Invalid JSON" }; }
  if (!Array.isArray(items)) items = [items];

  const values = items.map((item, idx) => ({ value: parseFloat(item[field]), index: idx, original: item }))
    .filter(v => !isNaN(v.value));

  const sorted = values.map(v => v.value).sort((a, b) => a - b);
  const q1Idx = Math.floor(sorted.length * 0.25);
  const q3Idx = Math.floor(sorted.length * 0.75);
  const q1 = sorted[q1Idx];
  const q3 = sorted[q3Idx];
  const iqr = q3 - q1;
  const lower = q1 - 1.5 * iqr;
  const upper = q3 + 1.5 * iqr;

  const anomalies = values.filter(v => v.value < lower || v.value > upper);
  return {
    field, total: values.length, stats: { q1, q3, iqr: iqr.toFixed(2), lower_bound: lower.toFixed(2), upper_bound: upper.toFixed(2) },
    anomaly_count: anomalies.length, anomaly_percentage: ((anomalies.length / values.length) * 100).toFixed(1) + "%",
    anomalies: anomalies.slice(0, 20).map(a => ({ value: a.value, index: a.index }))
  };
}

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  let result;

  try {
    switch (name) {
      case "analyze_csv": result = parseCSV(args.csv_text, args.max_rows || 10000); break;
      case "analyze_json": result = analyzeJSON(args.json_text); break;
      case "calculate_metrics": result = calculateMetrics(args.data, args.metrics, args.field, args.group_by); break;
      case "detect_anomalies": result = detectAnomalies(args.data, args.field); break;
      case "generate_report": {
        let analysis;
        try { analysis = JSON.parse(args.analysis_results); } catch (e) { analysis = args.analysis_results; }
        result = { report_type: args.report_type || "summary", generated_at: new Date().toISOString(), analysis };
        break;
      }
      default: return { content: [{ type: "text", text: `Unknown tool: ${name}` }], isError: true };
    }
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  } catch (e) {
    return { content: [{ type: "text", text: JSON.stringify({ error: e.message }) }], isError: true };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
