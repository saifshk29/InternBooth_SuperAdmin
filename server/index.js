// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
var MemStorage = class {
  usersData;
  facultyData;
  studentsData;
  internshipsData;
  applicationsData;
  testsData;
  testsAssignedData;
  analyticsData;
  currentUserId;
  currentFacultyId;
  currentStudentId;
  currentInternshipId;
  currentApplicationId;
  currentTestId;
  currentTestAssignedId;
  currentAnalyticsId;
  constructor() {
    this.usersData = /* @__PURE__ */ new Map();
    this.facultyData = /* @__PURE__ */ new Map();
    this.studentsData = /* @__PURE__ */ new Map();
    this.internshipsData = /* @__PURE__ */ new Map();
    this.applicationsData = /* @__PURE__ */ new Map();
    this.testsData = /* @__PURE__ */ new Map();
    this.testsAssignedData = /* @__PURE__ */ new Map();
    this.analyticsData = /* @__PURE__ */ new Map();
    this.currentUserId = 1;
    this.currentFacultyId = 1;
    this.currentStudentId = 1;
    this.currentInternshipId = 1;
    this.currentApplicationId = 1;
    this.currentTestId = 1;
    this.currentTestAssignedId = 1;
    this.currentAnalyticsId = 1;
    this.createUser({
      username: "admin",
      password: "admin123",
      role: "superadmin",
      email: "admin@campus.edu",
      status: "active"
    });
  }
  // User Methods
  async getUser(id) {
    return this.usersData.get(id);
  }
  async getUserByUsername(username) {
    return Array.from(this.usersData.values()).find(
      (user) => user.username === username
    );
  }
  async createUser(insertUser) {
    const id = this.currentUserId++;
    const now = /* @__PURE__ */ new Date();
    const user = {
      ...insertUser,
      id,
      createdAt: now
    };
    this.usersData.set(id, user);
    return user;
  }
  async authenticateUser(username, password) {
    const user = await this.getUserByUsername(username);
    if (user && user.password === password) {
      return user;
    }
    return null;
  }
  // Faculty Methods
  async getAllFaculty() {
    return Array.from(this.facultyData.values());
  }
  async getFaculty(id) {
    return this.facultyData.get(id);
  }
  async createFaculty(insertFaculty) {
    const id = this.currentFacultyId++;
    const now = /* @__PURE__ */ new Date();
    const faculty2 = {
      ...insertFaculty,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.facultyData.set(id, faculty2);
    return faculty2;
  }
  async updateFaculty(id, data) {
    const faculty2 = this.facultyData.get(id);
    if (!faculty2) {
      throw new Error(`Faculty with ID ${id} not found`);
    }
    const updatedFaculty = {
      ...faculty2,
      ...data,
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.facultyData.set(id, updatedFaculty);
    return updatedFaculty;
  }
  async deleteFaculty(id) {
    if (!this.facultyData.has(id)) {
      throw new Error(`Faculty with ID ${id} not found`);
    }
    this.facultyData.delete(id);
  }
  // Student Methods
  async getAllStudents() {
    return Array.from(this.studentsData.values());
  }
  async getStudent(id) {
    return this.studentsData.get(id);
  }
  async updateStudent(id, data) {
    const student = this.studentsData.get(id);
    if (!student) {
      throw new Error(`Student with ID ${id} not found`);
    }
    const updatedStudent = {
      ...student,
      ...data,
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.studentsData.set(id, updatedStudent);
    return updatedStudent;
  }
  async deleteStudent(id) {
    if (!this.studentsData.has(id)) {
      throw new Error(`Student with ID ${id} not found`);
    }
    this.studentsData.delete(id);
  }
  // Internship Methods
  async getAllInternships() {
    return Array.from(this.internshipsData.values());
  }
  async getInternship(id) {
    return this.internshipsData.get(id);
  }
  async updateInternship(id, data) {
    const internship = this.internshipsData.get(id);
    if (!internship) {
      throw new Error(`Internship with ID ${id} not found`);
    }
    const updatedInternship = {
      ...internship,
      ...data,
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.internshipsData.set(id, updatedInternship);
    return updatedInternship;
  }
  async deleteInternship(id) {
    if (!this.internshipsData.has(id)) {
      throw new Error(`Internship with ID ${id} not found`);
    }
    this.internshipsData.delete(id);
  }
  // Application Methods
  async getAllApplications() {
    return Array.from(this.applicationsData.values());
  }
  async getApplication(id) {
    return this.applicationsData.get(id);
  }
  // Test Methods
  async getAllTests() {
    return Array.from(this.testsData.values());
  }
  async getTest(id) {
    return this.testsData.get(id);
  }
  async createTest(insertTest) {
    const id = this.currentTestId++;
    const now = /* @__PURE__ */ new Date();
    const test = {
      ...insertTest,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.testsData.set(id, test);
    return test;
  }
  async updateTest(id, data) {
    const test = this.testsData.get(id);
    if (!test) {
      throw new Error(`Test with ID ${id} not found`);
    }
    const updatedTest = {
      ...test,
      ...data,
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.testsData.set(id, updatedTest);
    return updatedTest;
  }
  async deleteTest(id) {
    if (!this.testsData.has(id)) {
      throw new Error(`Test with ID ${id} not found`);
    }
    this.testsData.delete(id);
  }
  // Test Assignment Methods
  async getAllTestAssignments() {
    return Array.from(this.testsAssignedData.values());
  }
  async assignTest(insertAssignment) {
    const id = this.currentTestAssignedId++;
    const now = /* @__PURE__ */ new Date();
    const assignment = {
      ...insertAssignment,
      id,
      createdAt: now,
      updatedAt: now,
      completedAt: null
    };
    this.testsAssignedData.set(id, assignment);
    if (insertAssignment.applicationId) {
      const application = this.applicationsData.get(insertAssignment.applicationId);
      if (application) {
        this.applicationsData.set(application.id, {
          ...application,
          status: "test_assigned",
          updatedAt: now
        });
      }
    }
    return assignment;
  }
  // Analytics Methods
  async getAnalyticsSummary() {
    const students2 = Array.from(this.studentsData.values());
    const faculty2 = Array.from(this.facultyData.values());
    const internships2 = Array.from(this.internshipsData.values());
    const applications2 = Array.from(this.applicationsData.values());
    const testAssignments = Array.from(this.testsAssignedData.values());
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    const activeStudents = students2.filter(
      (student) => student.lastActive && new Date(student.lastActive) >= today
    ).length;
    return {
      totalStudents: students2.length,
      totalFaculty: faculty2.length,
      activeUsers: activeStudents,
      totalInternships: internships2.length,
      totalApplications: applications2.length,
      totalTestsAssigned: testAssignments.length,
      studentsTrend: 12,
      // Mocked trend data
      facultyTrend: 5,
      activeUsersTrend: -3,
      internshipsTrend: 18
    };
  }
  async getActiveUsersData(period) {
    if (period === "week") {
      return [
        { name: "Mon", value: 145 },
        { name: "Tue", value: 213 },
        { name: "Wed", value: 278 },
        { name: "Thu", value: 259 },
        { name: "Fri", value: 305 },
        { name: "Sat", value: 187 },
        { name: "Sun", value: 152 }
      ];
    } else if (period === "month") {
      return [
        { name: "Week 1", value: 1250 },
        { name: "Week 2", value: 1450 },
        { name: "Week 3", value: 1320 },
        { name: "Week 4", value: 1490 }
      ];
    } else {
      return [
        { name: "Jan", value: 4200 },
        { name: "Feb", value: 3800 },
        { name: "Mar", value: 5100 }
      ];
    }
  }
  async getApplicationsData(period) {
    if (period === "week") {
      return [
        { name: "Mon", value: 12 },
        { name: "Tue", value: 18 },
        { name: "Wed", value: 25 },
        { name: "Thu", value: 15 },
        { name: "Fri", value: 22 },
        { name: "Sat", value: 8 },
        { name: "Sun", value: 5 }
      ];
    } else if (period === "month") {
      return [
        { name: "Week 1", value: 78 },
        { name: "Week 2", value: 92 },
        { name: "Week 3", value: 85 },
        { name: "Week 4", value: 110 }
      ];
    } else {
      return [
        { name: "Jan", value: 320 },
        { name: "Feb", value: 290 },
        { name: "Mar", value: 385 }
      ];
    }
  }
  async getInternshipDistribution(groupBy) {
    const internships2 = Array.from(this.internshipsData.values());
    if (groupBy === "department") {
      return [
        { name: "Computer Science", value: 35 },
        { name: "Electronics", value: 20 },
        { name: "Mechanical", value: 15 },
        { name: "Civil", value: 10 },
        { name: "Business", value: 20 }
      ];
    } else {
      return [
        { name: "Faculty Posted", value: 65 },
        { name: "Student Startup", value: 35 }
      ];
    }
  }
  async getTestPerformance(testId) {
    if (testId) {
      return {
        testName: "Web Development Test",
        totalAssigned: 45,
        completed: 40,
        averageScore: 78,
        scoreDistribution: [
          { score: "90-100", count: 8 },
          { score: "80-90", count: 12 },
          { score: "70-80", count: 11 },
          { score: "60-70", count: 6 },
          { score: "Below 60", count: 3 }
        ]
      };
    } else {
      return [
        {
          id: "1",
          name: "Web Development Test",
          completedCount: 45,
          averageScore: 78
        },
        {
          id: "2",
          name: "UX Design Fundamentals",
          completedCount: 32,
          averageScore: 82
        },
        {
          id: "3",
          name: "Data Science Basics",
          completedCount: 28,
          averageScore: 65
        }
      ];
    }
  }
};
var storage = new MemStorage();

// server/routes.ts
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

// shared/schema.ts
import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("student"),
  email: text("email").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow()
});
var faculty = pgTable("faculty", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  department: text("department").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
});
var students = pgTable("students", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  course: text("course").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
  lastActive: timestamp("last_active")
});
var internships = pgTable("internships", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  companyName: text("company_name").notNull(),
  description: text("description").notNull(),
  postedBy: text("posted_by").notNull(),
  // "faculty" or "student"
  postedById: integer("posted_by_id").notNull(),
  status: text("status").notNull().default("open"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
});
var applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => students.id),
  internshipId: integer("internship_id").references(() => internships.id),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
});
var tests = pgTable("tests", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  questions: text("questions").notNull(),
  // JSON string
  duration: integer("duration").notNull(),
  // in minutes
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
});
var testsAssigned = pgTable("tests_assigned", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => students.id),
  internshipId: integer("internship_id").references(() => internships.id),
  testId: integer("test_id").references(() => tests.id),
  applicationId: integer("application_id").references(() => applications.id),
  status: text("status").notNull().default("assigned"),
  // assigned, completed, evaluated
  score: integer("score"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
  completedAt: timestamp("completed_at")
});
var analytics = pgTable("analytics", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull().defaultNow(),
  activeStudents: integer("active_students").notNull().default(0),
  activeFaculty: integer("active_faculty").notNull().default(0),
  newApplications: integer("new_applications").notNull().default(0),
  testsAssigned: integer("tests_assigned").notNull().default(0),
  testsCompleted: integer("tests_completed").notNull().default(0)
});
var insertUserSchema = createInsertSchema(users).omit({ id: true });
var insertFacultySchema = createInsertSchema(faculty).omit({ id: true, updatedAt: true });
var insertStudentSchema = createInsertSchema(students).omit({ id: true, updatedAt: true, lastActive: true });
var insertInternshipSchema = createInsertSchema(internships).omit({ id: true, updatedAt: true });
var insertApplicationSchema = createInsertSchema(applications).omit({ id: true, updatedAt: true });
var insertTestSchema = createInsertSchema(tests).omit({ id: true, updatedAt: true });
var insertTestAssignedSchema = createInsertSchema(testsAssigned).omit({ id: true, updatedAt: true, completedAt: true });
var insertAnalyticsSchema = createInsertSchema(analytics).omit({ id: true });

// server/routes.ts
async function registerRoutes(app2) {
  app2.get("/api/faculty", async (req, res, next) => {
    try {
      const facultyList = await storage.getAllFaculty();
      res.json(facultyList);
    } catch (error) {
      next(error);
    }
  });
  app2.post("/api/faculty", async (req, res, next) => {
    try {
      const facultyData = insertFacultySchema.parse(req.body);
      const faculty2 = await storage.createFaculty(facultyData);
      res.status(201).json(faculty2);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: fromZodError(error).message });
        return;
      }
      next(error);
    }
  });
  app2.put("/api/faculty/:id", async (req, res, next) => {
    try {
      const { id } = req.params;
      const facultyData = req.body;
      const faculty2 = await storage.updateFaculty(parseInt(id), facultyData);
      res.json(faculty2);
    } catch (error) {
      next(error);
    }
  });
  app2.delete("/api/faculty/:id", async (req, res, next) => {
    try {
      const { id } = req.params;
      await storage.deleteFaculty(parseInt(id));
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });
  app2.get("/api/students", async (req, res, next) => {
    try {
      const studentList = await storage.getAllStudents();
      res.json(studentList);
    } catch (error) {
      next(error);
    }
  });
  app2.put("/api/students/:id", async (req, res, next) => {
    try {
      const { id } = req.params;
      const studentData = req.body;
      const student = await storage.updateStudent(parseInt(id), studentData);
      res.json(student);
    } catch (error) {
      next(error);
    }
  });
  app2.delete("/api/students/:id", async (req, res, next) => {
    try {
      const { id } = req.params;
      await storage.deleteStudent(parseInt(id));
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });
  app2.get("/api/internships", async (req, res, next) => {
    try {
      const internshipList = await storage.getAllInternships();
      res.json(internshipList);
    } catch (error) {
      next(error);
    }
  });
  app2.put("/api/internships/:id", async (req, res, next) => {
    try {
      const { id } = req.params;
      const internshipData = req.body;
      const internship = await storage.updateInternship(parseInt(id), internshipData);
      res.json(internship);
    } catch (error) {
      next(error);
    }
  });
  app2.delete("/api/internships/:id", async (req, res, next) => {
    try {
      const { id } = req.params;
      await storage.deleteInternship(parseInt(id));
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });
  app2.get("/api/tests", async (req, res, next) => {
    try {
      const testsList = await storage.getAllTests();
      res.json(testsList);
    } catch (error) {
      next(error);
    }
  });
  app2.post("/api/tests", async (req, res, next) => {
    try {
      const testData = insertTestSchema.parse(req.body);
      const test = await storage.createTest(testData);
      res.status(201).json(test);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: fromZodError(error).message });
        return;
      }
      next(error);
    }
  });
  app2.put("/api/tests/:id", async (req, res, next) => {
    try {
      const { id } = req.params;
      const testData = req.body;
      const test = await storage.updateTest(parseInt(id), testData);
      res.json(test);
    } catch (error) {
      next(error);
    }
  });
  app2.delete("/api/tests/:id", async (req, res, next) => {
    try {
      const { id } = req.params;
      await storage.deleteTest(parseInt(id));
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });
  app2.get("/api/applications", async (req, res, next) => {
    try {
      const applicationsList = await storage.getAllApplications();
      res.json(applicationsList);
    } catch (error) {
      next(error);
    }
  });
  app2.post("/api/test-assignments", async (req, res, next) => {
    try {
      const assignmentData = insertTestAssignedSchema.parse(req.body);
      const assignment = await storage.assignTest(assignmentData);
      res.status(201).json(assignment);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: fromZodError(error).message });
        return;
      }
      next(error);
    }
  });
  app2.get("/api/test-assignments", async (req, res, next) => {
    try {
      const assignmentsList = await storage.getAllTestAssignments();
      res.json(assignmentsList);
    } catch (error) {
      next(error);
    }
  });
  app2.get("/api/analytics/summary", async (req, res, next) => {
    try {
      const summary = await storage.getAnalyticsSummary();
      res.json(summary);
    } catch (error) {
      next(error);
    }
  });
  app2.get("/api/analytics/active-users", async (req, res, next) => {
    try {
      const { period } = req.query;
      const activeUsers = await storage.getActiveUsersData(period);
      res.json(activeUsers);
    } catch (error) {
      next(error);
    }
  });
  app2.get("/api/analytics/applications", async (req, res, next) => {
    try {
      const { period } = req.query;
      const applications2 = await storage.getApplicationsData(period);
      res.json(applications2);
    } catch (error) {
      next(error);
    }
  });
  app2.get("/api/analytics/internship-distribution", async (req, res, next) => {
    try {
      const { groupBy } = req.query;
      const distribution = await storage.getInternshipDistribution(groupBy);
      res.json(distribution);
    } catch (error) {
      next(error);
    }
  });
  app2.get("/api/analytics/test-performance", async (req, res, next) => {
    try {
      const { testId } = req.query;
      const performance = await storage.getTestPerformance(testId);
      res.json(performance);
    } catch (error) {
      next(error);
    }
  });
  app2.post("/api/auth/login", async (req, res, next) => {
    try {
      const { username, password } = req.body;
      const user = await storage.authenticateUser(username, password);
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      if (user.role !== "superadmin") {
        return res.status(403).json({ message: "Access denied. Not a super admin." });
      }
      res.json({
        id: user.id,
        username: user.username,
        role: user.role,
        email: user.email
      });
    } catch (error) {
      next(error);
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
