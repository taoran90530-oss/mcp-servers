# Content Tools MCP Server

SEO analysis, content optimization, and headline scoring engine for content creators.

## Installation

```bash
npm install
```

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "content-tools": {
      "command": "node",
      "args": ["path/to/content-tools-mcp/index.js"]
    }
  }
}
```

## Tools

| Tool | Description |
|------|-------------|
| `analyze_seo` | Analyze text for SEO: keyword density, readability score, word count, sentence length. Provides specific optimization suggestions. |
| `generate_content_brief` | Generate complete content briefs with recommended structure, hook ideas, title templates, and keyword clusters. Supports blog, landing page, email, social, and ad formats. |
| `rewrite_content` | Rewrite content in 5 tones: professional, casual, persuasive, urgent, empathetic. With style guidelines for each. |
| `extract_content_ideas` | Generate multiple content angles from a single topic. Each angle includes title suggestion and recommended format. |
| `optimize_headline` | Score headlines 0-100 based on length, power words, emotional triggers, and structure. Returns specific improvement tips. |

## Use Cases

**SEO Optimization**
> Analyze this blog post for "AI automation" keyword. How well is it optimized?

**Content Planning**
> Give me 10 content angles about remote work productivity.

**Social Media**
> Rewrite this product announcement in casual tone for Instagram.

**Headline Testing**
> Score these 5 headlines and tell me the top 3 with specific improvements.

## Requirements

- Node.js 18+
- Claude Desktop or any MCP-compatible client

## License

Apache 2.0 - use freely in commercial projects.

## Buy

[Available on Gumroad for $24](https://taoran2.gumroad.com/l/smomqb)
