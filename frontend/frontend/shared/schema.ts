import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const developers = pgTable("developers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  username: text("username").notNull(),
  location: text("location").notNull(),
  skills: jsonb("skills").$type<string[]>().notNull(),
  experience: text("experience").notNull(),
  projects: integer("projects").notNull(),
  rating: text("rating").notNull(),
  summary: text("summary").notNull(),
  detailedSummary: text("detailed_summary"),
  githubUrl: text("github_url"),
  linkedinUrl: text("linkedin_url"),
  hourlyRate: text("hourly_rate"),
  projectDate: text("project_date"),
  matchScore: integer("match_score"),
  projectHighlights: jsonb("project_highlights").$type<Array<{
    title: string;
    description: string;
    technologies: string[];
  }>>(),
});

export const searchQueries = pgTable("search_queries", {
  id: serial("id").primaryKey(),
  prompt: text("prompt").notNull(),
  skills: jsonb("skills").$type<string[]>(),
  location: text("location"),
  experience: text("experience"),
  projectDate: text("project_date"),
  createdAt: text("created_at").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertDeveloperSchema = createInsertSchema(developers).omit({
  id: true,
});

export const insertSearchQuerySchema = createInsertSchema(searchQueries).omit({
  id: true,
  createdAt: true,
});

export const searchFormSchema = z.object({
  prompt: z.string().min(1, "Please describe your project or requirements"),
  skills: z.array(z.string()).optional(),
  location: z.string().optional(),
  experience: z.string().optional(),
  projectDate: z.string().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Developer = typeof developers.$inferSelect;
export type InsertDeveloper = z.infer<typeof insertDeveloperSchema>;
export type SearchQuery = typeof searchQueries.$inferSelect;
export type InsertSearchQuery = z.infer<typeof insertSearchQuerySchema>;
export type SearchForm = z.infer<typeof searchFormSchema>;
