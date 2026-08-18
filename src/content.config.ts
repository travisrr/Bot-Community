import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    week: z.number().int().min(1).max(12),
    pillar: z.enum(["Run Breakdowns", "Agentic Architecture", "State of Grok"]),
    description: z.string(),
    published: z.coerce.date(),
    updated: z.coerce.date().optional(),
    primaryQuery: z.string(),
    secondaryQueries: z.array(z.string()),
    faqs: z.array(z.object({ q: z.string(), a: z.string() })).min(3).max(5),
    sensitiveKind: z.enum(["legal", "medical", "financial"]).optional(),
  }),
});

export const collections = { blog };
