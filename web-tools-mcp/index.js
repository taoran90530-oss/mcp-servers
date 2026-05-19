#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  { name: "web-tools-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "fetch_webpage",
      description: "Fetch and extract clean text content from any webpage URL. Returns the main content with HTML stripped.",
      inputSchema: {
        type: "object",
        properties: {
          url: { type: "string", description: "The webpage URL to fetch" },
          selector: { type: "string", description: "Optional CSS selector to extract specific element" }
        },
        required: ["url"]
      }
    },
    {
      name: "extract_structured_data",
      description: "Extract structured data (tables, lists, prices, dates) from webpage content. Returns JSON.",
      inputSchema: {
        type: "object",
        properties: {
          html_content: { type: "string", description: "Raw HTML or text content to parse" },
          extract_type: { type: "string", enum: ["tables", "prices", "dates", "emails", "links", "headings"], description: "Type of data to extract" }
        },
        required: ["html_content", "extract_type"]
      }
    },
    {
      name: "generate_sitemap_urls",
      description: "Generate common sitemap URLs and RSS feed URLs for a domain to help discover content.",
      inputSchema: {
        type: "object",
        properties: {
          domain: { type: "string", description: "Domain name (e.g., example.com)" }
        },
        required: ["domain"]
      }
    },
    {
      name: "parse_markdown_table",
      description: "Convert markdown tables to structured JSON. Useful for extracting data from markdown content.",
      inputSchema: {
        type: "object",
        properties: {
          markdown: { type: "string", description: "Markdown text containing tables" }
        },
        required: ["markdown"]
      }
    },
    {
      name: "summarize_text",
      description: "Extract key points, entities, and summary statistics from long text content.",
      inputSchema: {
        type: "object",
        properties: {
          text: { type: "string", description: "Text content to analyze" },
          max_points: { type: "number", description: "Maximum number of key points to return (default 5)" }
        },
        required: ["text"]
      }
    }
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "fetch_webpage": {
      const { url, selector } = args;
      try {
        const response = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; WebToolsMCP/1.0)",
            "Accept": "text/html,application/xhtml+xml,text/plain"
          },
          signal: AbortSignal.timeout(15000)
        });
        const html = await response.text();
        const text = extractText(html, selector);
        const title = (html.match(/<title[^>]*>([^<]+)<\/title>/i) || [,""])[1];
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              url,
              title: title?.trim(),
              status: response.status,
              content_length: text.length,
              text: text.substring(0, 50000)
            }, null, 2)
          }]
        };
      } catch (e) {
        return { content: [{ type: "text", text: JSON.stringify({ error: e.message }) }] };
      }
    }

    case "extract_structured_data": {
      const { html_content, extract_type } = args;
      const result = extractData(html_content, extract_type);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    }

    case "generate_sitemap_urls": {
      const { domain } = args;
      const d = domain.replace(/^https?:\/\//, "").replace(/\/$/, "");
      const urls = [
        `https://${d}/sitemap.xml`,
        `https://${d}/sitemap_index.xml`,
        `https://${d}/sitemap-index.xml`,
        `https://${d}/sitemap/sitemap.xml`,
        `https://${d}/robots.txt`,
        `https://${d}/rss`,
        `https://${d}/feed`,
        `https://${d}/rss.xml`,
        `https://${d}/feed.xml`,
        `https://${d}/atom.xml`,
        `https://${d}/news-sitemap.xml`
      ];
      return {
        content: [{ type: "text", text: JSON.stringify({ domain: d, potential_urls: urls }, null, 2) }]
      };
    }

    case "parse_markdown_table": {
      const { markdown } = args;
      const tables = parseMarkdownTables(markdown);
      return {
        content: [{ type: "text", text: JSON.stringify({ table_count: tables.length, tables }, null, 2) }]
      };
    }

    case "summarize_text": {
      const { text, max_points = 5 } = args;
      const result = summarizeContent(text, max_points);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    }

    default:
      return { content: [{ type: "text", text: `Unknown tool: ${name}` }], isError: true };
  }
});

function extractText(html, selector) {
  let text = html;
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
  text = text.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "");
  text = text.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "");
  text = text.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "");
  text = text.replace(/<[^>]+>/g, " ");
  text = text.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&nbsp;/g, " ");
  text = text.replace(/\s+/g, " ").trim();
  return text;
}

function extractData(html, type) {
  const patterns = {
    emails: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    links: /href=["']([^"']+)["']/gi,
    headings: /<h([1-6])[^>]*>([^<]+)<\/h\1>/gi,
    prices: /(?:¥|￥|USD|EUR|\$)\s*\d+(?:[,.]\d+)*|\d+(?:[,.]\d+)*(?:\s*(?:元|美元|欧元))/g,
    dates: /\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{4}/g,
    tables: null
  };

  if (type === "tables") {
    return { tables: parseMarkdownTables(html) };
  }

  const regex = patterns[type];
  if (!regex) return { error: `Unknown extract type: ${type}` };

  const matches = [...html.matchAll(regex)].map(m => m[0]);
  const unique = [...new Set(matches)];
  return { type, count: unique.length, items: unique.slice(0, 100) };
}

function parseMarkdownTables(md) {
  const tables = [];
  const lines = md.split("\n");
  let i = 0;
  while (i < lines.length) {
    if (lines[i].includes("|") && lines[i + 1]?.match(/^\|[\s\-:|]+\|$/)) {
      const headerLine = lines[i];
      const headers = headerLine.split("|").map(h => h.trim()).filter(Boolean);
      const rows = [];
      let j = i + 2;
      while (j < lines.length && lines[j].includes("|")) {
        const cells = lines[j].split("|").map(c => c.trim()).filter(Boolean);
        if (cells.length > 0) {
          const row = {};
          headers.forEach((h, idx) => { row[h] = cells[idx] || ""; });
          rows.push(row);
        }
        j++;
      }
      if (headers.length > 0 && rows.length > 0) {
        tables.push({ headers, row_count: rows.length, rows });
      }
      i = j;
    } else {
      i++;
    }
  }
  return tables;
}

function summarizeContent(text, maxPoints) {
  const sentences = text.split(/[。！？.!?\n]+/).filter(s => s.trim().length > 10);
  const wordCount = text.split(/\s+/).length;
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 20);

  const keySentences = sentences
    .map(s => ({ text: s.trim(), len: s.length }))
    .sort((a, b) => b.len - a.len)
    .slice(0, maxPoints)
    .map(s => s.text);

  const entities = [];
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
  const urlMatch = text.match(/https?:\/\/[^\s<>"]+/g);
  if (emailMatch) entities.push({ type: "emails", items: [...new Set(emailMatch)] });
  if (urlMatch) entities.push({ type: "urls", items: [...new Set(urlMatch)].slice(0, 10) });

  return {
    stats: { word_count: wordCount, sentence_count: sentences.length, paragraph_count: paragraphs.length },
    key_points: keySentences,
    entities
  };
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
