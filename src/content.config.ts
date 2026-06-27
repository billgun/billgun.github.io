import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    heroImage: z.string().optional(),
    tags: z.array(z.string()).optional(),
    draft: z.boolean().optional().default(false),
  }),
});

const games = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/games" }),
  schema: z.object({
    title: z.string(),
    rawgSlug: z.string(),
    status: z.enum(["playing", "finished", "dropped"]),
    rating: z.number().min(1).max(10).optional(),
    startedDate: z.coerce.date().optional(),
    finishedDate: z.coerce.date().optional(),
    blogSlug: z.string().optional(),
  }),
});

export const collections = { blog, games };
