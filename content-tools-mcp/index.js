#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  { name: "content-tools-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "analyze_seo",
      description: "Analyze text for SEO: keyword density, readability score, title quality, meta description suggestions.",
      inputSchema: {
        type: "object",
        properties: {
          text: { type: "string", description: "Content text to analyze" },
          target_keyword: { type: "string", description: "Primary keyword to check density for" }
        },
        required: ["text"]
      }
    },
    {
      name: "generate_content_brief",
      description: "Generate a content brief with title suggestions, outline, target keywords, and structure recommendations.",
      inputSchema: {
        type: "object",
        properties: {
          topic: { type: "string", description: "Content topic" },
          content_type: { type: "string", enum: ["blog", "landing_page", "email", "social", "ad"], description: "Content type" },
          target_audience: { type: "string", description: "Target audience description" },
          goal: { type: "string", enum: ["traffic", "conversion", "engagement", "awareness"], description: "Content goal" }
        },
        required: ["topic", "content_type"]
      }
    },
    {
      name: "rewrite_content",
      description: "Rewrite content for different tones: professional, casual, persuasive, urgent, empathetic.",
      inputSchema: {
        type: "object",
        properties: {
          text: { type: "string", description: "Text to rewrite" },
          tone: { type: "string", enum: ["professional", "casual", "persuasive", "urgent", "empathetic"], description: "Target tone" },
          max_length: { type: "number", description: "Optional max character length" }
        },
        required: ["text", "tone"]
      }
    },
    {
      name: "extract_content_ideas",
      description: "Extract potential content angles, hooks, and subtopics from a main topic.",
      inputSchema: {
        type: "object",
        properties: {
          topic: { type: "string", description: "Main topic" },
          angle_count: { type: "number", description: "Number of angles to generate (default 5)" }
        },
        required: ["topic"]
      }
    },
    {
      name: "optimize_headline",
      description: "Score and improve headlines based on emotional impact, power words, length, and click-through potential.",
      inputSchema: {
        type: "object",
        properties: {
          headline: { type: "string", description: "Headline to optimize" },
          platform: { type: "string", enum: ["blog", "email", "social", "ad"], description: "Platform" }
        },
        required: ["headline"]
      }
    }
  ]
}));

const POWER_WORDS = ["终极", "秘密", "惊人", "免费", "快速", "简单", "保证", "独家", "限量", "立即",
  "ultimate", "secret", "shocking", "free", "fast", "easy", "guaranteed", "exclusive", "limited", "proven"];
const EMOTIONAL_WORDS = ["惊人", "令人震惊", "不可思议", "令人兴奋", "令人担忧", "改变人生",
  "stunning", "mind-blowing", "unbelievable", "exciting", "alarming", "life-changing", "breakthrough"];

function analyzeSEO(text, keyword) {
  const words = text.toLowerCase().split(/\s+/);
  const wordCount = words.length;
  const sentences = text.split(/[.!?。！？]+/).filter(s => s.trim());
  const sentenceCount = sentences.length;
  const avgSentenceLen = sentenceCount > 0 ? wordCount / sentenceCount : 0;
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim());

  let keywordDensity = 0;
  let keywordCount = 0;
  if (keyword) {
    const kwLower = keyword.toLowerCase();
    keywordCount = (text.toLowerCase().match(new RegExp(kwLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
    keywordDensity = ((keywordCount / wordCount) * 100);
  }

  const powerWordCount = POWER_WORDS.filter(w => text.toLowerCase().includes(w)).length;
  const emotionalCount = EMOTIONAL_WORDS.filter(w => text.toLowerCase().includes(w)).length;

  let readability = "good";
  if (avgSentenceLen > 25) readability = "hard - sentences too long";
  else if (avgSentenceLen < 8) readability = "choppy - vary sentence length";
  if (paragraphs.some(p => p.split(/\s+/).length > 150)) readability = "hard - paragraphs too long";

  const suggestions = [];
  if (keyword && keywordDensity < 0.5) suggestions.push("Keyword density too low, add target keyword more naturally");
  if (keyword && keywordDensity > 3) suggestions.push("Keyword density may be too high (keyword stuffing risk)");
  if (wordCount < 300) suggestions.push("Content may be too short for SEO (aim for 500+ words)");
  if (!text.match(/<h[1-6]|<H[1-6]/) && wordCount > 200) suggestions.push("Consider adding heading tags (H2, H3)");
  if (powerWordCount < 2) suggestions.push("Add power words to increase engagement");

  return {
    stats: { word_count: wordCount, sentence_count: sentenceCount, paragraph_count: paragraphs.length, avg_sentence_length: avgSentenceLen.toFixed(1) },
    keywords: keyword ? { target: keyword, count: keywordCount, density: keywordDensity.toFixed(2) + "%" } : null,
    engagement: { power_words: powerWordCount, emotional_triggers: emotionalCount },
    readability,
    suggestions: suggestions.length > 0 ? suggestions : ["Content looks well-optimized"]
  };
}

function generateContentBrief(topic, contentType, audience, goal) {
  const types = {
    blog: { structure: ["H1 Title", "Hook/Intro", "H2 Main Point 1", "H2 Main Point 2", "H2 Main Point 3", "H2 Conclusion", "CTA"], typicalLength: "800-2000 words" },
    landing_page: { structure: ["Hero Headline", "Problem Statement", "Solution Intro", "Features/Benefits", "Social Proof", "Pricing/Offer", "CTA"], typicalLength: "300-800 words" },
    email: { structure: ["Subject Line", "Preview Text", "Opening Hook", "Body/Value", "CTA Button", "PS Line"], typicalLength: "50-200 words" },
    social: { structure: ["Hook (first line)", "Value/Story", "CTA/Engagement Ask", "Hashtags"], typicalLength: "50-500 characters" },
    ad: { structure: ["Headline", "Visual Hook Description", "Body Copy", "CTA", "Landing Page Note"], typicalLength: "50-300 characters" }
  };

  const info = types[contentType] || types.blog;
  const goalHooks = {
    traffic: ["数据揭示了一个惊人事实", "大多数人不知道的是", "最新研究发现"],
    conversion: ["限时优惠", "立即行动的理由", "你的问题终于有解了"],
    engagement: ["你同意吗？", "评论区告诉我", "分享你的经历"],
    awareness: ["你可能从未听说过", "行业正在发生巨变", "一个新的趋势出现了"]
  };

  return {
    topic,
    content_type: contentType,
    target: audience || "General audience",
    goal: goal || "traffic",
    recommended_structure: info.structure,
    typical_length: info.typicalLength,
    hook_ideas: goalHooks[goal] || goalHooks.traffic,
    keyword_clusters: [topic, `${topic} guide`, `${topic} tips`, `${topic} best practices`, `${topic} for beginners`],
    title_templates: [
      `How to ${topic}: A Complete Guide`,
      `${topic}: Everything You Need to Know`,
      `5 Proven ${topic} Strategies That Actually Work`,
      `Why ${topic} Matters More Than Ever in 2026`
    ]
  };
}

function scoreHeadline(headline) {
  const len = headline.length;
  let score = 50;
  if (len >= 10 && len <= 70) score += 15;
  if (len < 10) score -= 20;
  if (len > 100) score -= 15;
  const digits = (headline.match(/\d+/g) || []).length;
  if (digits > 0) score += 10;
  const powerCount = POWER_WORDS.filter(w => headline.toLowerCase().includes(w)).length;
  score += powerCount * 8;
  const emoCount = EMOTIONAL_WORDS.filter(w => headline.toLowerCase().includes(w)).length;
  score += emoCount * 6;
  if (headline.includes("?") || headline.includes("？")) score += 5;
  const brackets = (headline.match(/[\[【\(（]/g) || []).length;
  if (brackets > 0) score += 5;
  return Math.min(100, Math.max(0, score));
}

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  let result;

  try {
    switch (name) {
      case "analyze_seo":
        result = analyzeSEO(args.text, args.target_keyword);
        break;
      case "generate_content_brief":
        result = generateContentBrief(args.topic, args.content_type, args.target_audience, args.goal);
        break;
      case "rewrite_content": {
        const tones = {
          professional: "formal, authoritative, data-driven",
          casual: "conversational, friendly, relatable",
          persuasive: "benefit-focused, urgent, compelling",
          urgent: "time-sensitive, scarcity-driven, action-oriented",
          empathetic: "understanding, supportive, emotionally resonant"
        };
        result = {
          original: args.text.substring(0, 200) + "...",
          tone: args.tone,
          style_guide: tones[args.tone] || tones.professional,
          rewritten: `[AI rewriting in ${args.tone} tone]: ${args.text}`,
          note: "Full rewrite requires LLM integration. This provides the tone profile for Claude to apply."
        };
        break;
      }
      case "extract_content_ideas": {
        const count = args.angle_count || 5;
        const angles = [
          "The Beginner's Guide", "Common Mistakes to Avoid", "Expert Tips & Tricks",
          "Case Study Analysis", "Step-by-Step Tutorial", "Comparison Guide",
          "Trend Report", "Myth-Busting", "Quick Wins", "Deep Dive"
        ];
        result = {
          topic: args.topic,
          content_angles: angles.slice(0, count).map((angle, i) => ({
            id: i + 1,
            title: `${args.topic}: ${angle}`,
            format: i % 3 === 0 ? "How-to Guide" : i % 3 === 1 ? "Listicle" : "Deep Dive"
          }))
        };
        break;
      }
      case "optimize_headline": {
        const score = scoreHeadline(args.headline);
        result = {
          original: args.headline,
          score,
          rating: score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Fair" : "Weak",
          improvements: [
            score < 60 ? "Add numbers (e.g., '5 Ways...')" : null,
            score < 70 ? "Include power words" : null,
            args.headline.length > 70 ? "Shorten for better readability" : null,
            args.headline.length < 10 ? "Make it more descriptive" : null
          ].filter(Boolean)
        };
        break;
      }
      default:
        return { content: [{ type: "text", text: `Unknown tool: ${name}` }], isError: true };
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
