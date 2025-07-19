import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSearchQuerySchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Search developers endpoint
  app.post("/api/search", async (req, res) => {
    try {
      const validatedQuery = insertSearchQuerySchema.parse(req.body);
      
      // Save the search query
      const searchQuery = await storage.createSearchQuery(validatedQuery);
      
      // Search for developers
      const developers = await storage.searchDevelopers(validatedQuery);
      
      res.json({
        searchId: searchQuery.id,
        results: developers,
        count: developers.length
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid search parameters", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // Get developer by ID
  app.get("/api/developers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid developer ID" });
      }

      const developer = await storage.getDeveloper(id);
      if (!developer) {
        return res.status(404).json({ message: "Developer not found" });
      }

      res.json(developer);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);
  return httpServer;
}
