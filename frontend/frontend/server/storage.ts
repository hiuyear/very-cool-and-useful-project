import { users, developers, searchQueries, type User, type InsertUser, type Developer, type InsertDeveloper, type SearchQuery, type InsertSearchQuery } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getDeveloper(id: number): Promise<Developer | undefined>;
  searchDevelopers(query: InsertSearchQuery): Promise<Developer[]>;
  createDeveloper(developer: InsertDeveloper): Promise<Developer>;
  
  createSearchQuery(query: InsertSearchQuery): Promise<SearchQuery>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private developers: Map<number, Developer>;
  private searchQueries: Map<number, SearchQuery>;
  private currentUserId: number;
  private currentDeveloperId: number;
  private currentSearchId: number;

  constructor() {
    this.users = new Map();
    this.developers = new Map();
    this.searchQueries = new Map();
    this.currentUserId = 1;
    this.currentDeveloperId = 1;
    this.currentSearchId = 1;
    
    // Initialize with mock developers
    this.initializeMockData();
  }

  private initializeMockData() {
    const mockDevelopers: Developer[] = [
      {
        id: 1,
        name: "Alex Chen",
        username: "alexchen",
        location: "San Francisco, CA",
        skills: ["React", "Node.js", "Python", "Django", "PostgreSQL", "AWS"],
        experience: "3.5y",
        projects: 8,
        rating: "4.9",
        summary: "Built fintech apps with React & Python. Led team in blockchain hackathon, created trading dashboard.",
        detailedSummary: "Alex is an exceptionally talented full-stack developer with a proven track record in fintech applications. His experience building complex financial dashboards and real-time trading systems makes him an ideal candidate for projects requiring both technical excellence and domain expertise in finance.",
        githubUrl: "https://github.com/alexchen",
        linkedinUrl: "https://linkedin.com/in/alexchen",
        hourlyRate: "$85/hr",
        projectDate: "2024-01",
        matchScore: 95,
        projectHighlights: [
          {
            title: "FinanceTracker Pro",
            description: "Built a comprehensive personal finance management application with real-time bank integration and AI-powered spending insights.",
            technologies: ["React", "Python", "ML"]
          },
          {
            title: "Blockchain Trading Dashboard",
            description: "Led a team of 4 developers to create a real-time cryptocurrency trading dashboard with advanced charting and portfolio management.",
            technologies: ["Vue.js", "WebSocket", "Chart.js"]
          }
        ]
      },
      {
        id: 2,
        name: "Sarah Rodriguez",
        username: "sarahrod",
        location: "Austin, TX",
        skills: ["Vue.js", "Django", "PostgreSQL", "Docker", "Kubernetes"],
        experience: "5.2y",
        projects: 12,
        rating: "4.8",
        summary: "Full-stack developer specializing in e-commerce. Won health-tech hackathon with ML recommendation engine.",
        detailedSummary: "Sarah brings extensive experience in building scalable e-commerce platforms and has a strong background in machine learning applications for health technology.",
        githubUrl: "https://github.com/sarahrod",
        linkedinUrl: "https://linkedin.com/in/sarahrod",
        hourlyRate: "$95/hr",
        projectDate: "2023-12",
        matchScore: 92,
        projectHighlights: []
      },
      {
        id: 3,
        name: "Marcus Kim",
        username: "marcusk",
        location: "Seattle, WA",
        skills: ["Angular", "Java", "MongoDB", "Spring Boot", "Microservices", "AWS", "DevOps"],
        experience: "6.1y",
        projects: 15,
        rating: "4.7",
        summary: "Enterprise software architect. Created IoT monitoring system, won smart city hackathon with data visualization.",
        detailedSummary: "Marcus specializes in enterprise-grade software architecture with expertise in IoT systems and data visualization platforms for smart city applications.",
        githubUrl: "https://github.com/marcusk",
        linkedinUrl: "https://linkedin.com/in/marcusk",
        hourlyRate: "$120/hr",
        projectDate: "2023-11",
        matchScore: 88,
        projectHighlights: []
      }
    ];

    mockDevelopers.forEach(dev => {
      this.developers.set(dev.id, dev);
      this.currentDeveloperId = Math.max(this.currentDeveloperId, dev.id + 1);
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getDeveloper(id: number): Promise<Developer | undefined> {
    return this.developers.get(id);
  }

  async searchDevelopers(query: InsertSearchQuery): Promise<Developer[]> {
    // Simple search logic - in a real app this would be more sophisticated
    const allDevelopers = Array.from(this.developers.values());
    
    let filtered = allDevelopers;

    // Filter by skills if provided
    if (query.skills && Array.isArray(query.skills) && query.skills.length > 0) {
      filtered = filtered.filter(dev => 
        (query.skills as string[]).some((skill: string) => 
          (dev.skills as string[]).some((devSkill: string) => 
            devSkill.toLowerCase().includes(skill.toLowerCase())
          )
        )
      );
    }

    // Filter by location if provided
    if (query.location) {
      filtered = filtered.filter(dev => 
        dev.location.toLowerCase().includes(query.location!.toLowerCase())
      );
    }

    // Sort by match score (in a real app this would be calculated based on the prompt)
    filtered.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

    return filtered;
  }

  async createDeveloper(insertDeveloper: InsertDeveloper): Promise<Developer> {
    const id = this.currentDeveloperId++;
    const developer: Developer = { 
      ...insertDeveloper, 
      id,
      skills: insertDeveloper.skills as string[],
      detailedSummary: insertDeveloper.detailedSummary || null,
      githubUrl: insertDeveloper.githubUrl || null,
      linkedinUrl: insertDeveloper.linkedinUrl || null,
      hourlyRate: insertDeveloper.hourlyRate || null,
      projectDate: insertDeveloper.projectDate || null,
      matchScore: insertDeveloper.matchScore || null,
      projectHighlights: insertDeveloper.projectHighlights as Array<{title: string; description: string; technologies: string[]}> || null
    };
    this.developers.set(id, developer);
    return developer;
  }

  async createSearchQuery(insertQuery: InsertSearchQuery): Promise<SearchQuery> {
    const id = this.currentSearchId++;
    const query: SearchQuery = { 
      ...insertQuery, 
      id, 
      createdAt: new Date().toISOString(),
      location: insertQuery.location || null,
      skills: insertQuery.skills as string[] || null,
      experience: insertQuery.experience || null,
      projectDate: insertQuery.projectDate || null
    };
    this.searchQueries.set(id, query);
    return query;
  }
}

export const storage = new MemStorage();
