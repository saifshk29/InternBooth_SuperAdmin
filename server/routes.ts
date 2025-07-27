import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { 
  insertUserSchema, 
  insertFacultySchema, 
  insertStudentSchema,
  insertInternshipSchema,
  insertApplicationSchema,
  insertTestSchema,
  insertTestAssignedSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // API Routes for Super Admin Dashboard
  
  // Faculty Management
  app.get("/api/faculty", async (req, res, next) => {
    try {
      const facultyList = await storage.getAllFaculty();
      res.json(facultyList);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/faculty", async (req, res, next) => {
    try {
      const facultyData = insertFacultySchema.parse(req.body);
      const faculty = await storage.createFaculty(facultyData);
      res.status(201).json(faculty);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: fromZodError(error).message });
        return;
      }
      next(error);
    }
  });
  
  app.put("/api/faculty/:id", async (req, res, next) => {
    try {
      const { id } = req.params;
      const facultyData = req.body;
      const faculty = await storage.updateFaculty(parseInt(id), facultyData);
      res.json(faculty);
    } catch (error) {
      next(error);
    }
  });
  
  app.delete("/api/faculty/:id", async (req, res, next) => {
    try {
      const { id } = req.params;
      await storage.deleteFaculty(parseInt(id));
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });
  
  // Student Management
  app.get("/api/students", async (req, res, next) => {
    try {
      const studentList = await storage.getAllStudents();
      res.json(studentList);
    } catch (error) {
      next(error);
    }
  });
  
  app.put("/api/students/:id", async (req, res, next) => {
    try {
      const { id } = req.params;
      const studentData = req.body;
      const student = await storage.updateStudent(parseInt(id), studentData);
      res.json(student);
    } catch (error) {
      next(error);
    }
  });
  
  app.delete("/api/students/:id", async (req, res, next) => {
    try {
      const { id } = req.params;
      await storage.deleteStudent(parseInt(id));
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });
  
  // Internship Management
  app.get("/api/internships", async (req, res, next) => {
    try {
      const internshipList = await storage.getAllInternships();
      res.json(internshipList);
    } catch (error) {
      next(error);
    }
  });
  
  app.put("/api/internships/:id", async (req, res, next) => {
    try {
      const { id } = req.params;
      const internshipData = req.body;
      const internship = await storage.updateInternship(parseInt(id), internshipData);
      res.json(internship);
    } catch (error) {
      next(error);
    }
  });
  
  app.delete("/api/internships/:id", async (req, res, next) => {
    try {
      const { id } = req.params;
      await storage.deleteInternship(parseInt(id));
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });
  
  // Test Management
  app.get("/api/tests", async (req, res, next) => {
    try {
      const testsList = await storage.getAllTests();
      res.json(testsList);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/tests", async (req, res, next) => {
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
  
  app.put("/api/tests/:id", async (req, res, next) => {
    try {
      const { id } = req.params;
      const testData = req.body;
      const test = await storage.updateTest(parseInt(id), testData);
      res.json(test);
    } catch (error) {
      next(error);
    }
  });
  
  app.delete("/api/tests/:id", async (req, res, next) => {
    try {
      const { id } = req.params;
      await storage.deleteTest(parseInt(id));
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });
  
  // Application Management
  app.get("/api/applications", async (req, res, next) => {
    try {
      const applicationsList = await storage.getAllApplications();
      res.json(applicationsList);
    } catch (error) {
      next(error);
    }
  });
  
  // Assign Tests to Applications
  app.post("/api/test-assignments", async (req, res, next) => {
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
  
  app.get("/api/test-assignments", async (req, res, next) => {
    try {
      const assignmentsList = await storage.getAllTestAssignments();
      res.json(assignmentsList);
    } catch (error) {
      next(error);
    }
  });
  
  // Analytics
  app.get("/api/analytics/summary", async (req, res, next) => {
    try {
      const summary = await storage.getAnalyticsSummary();
      res.json(summary);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/analytics/active-users", async (req, res, next) => {
    try {
      const { period } = req.query;
      const activeUsers = await storage.getActiveUsersData(period as string);
      res.json(activeUsers);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/analytics/applications", async (req, res, next) => {
    try {
      const { period } = req.query;
      const applications = await storage.getApplicationsData(period as string);
      res.json(applications);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/analytics/internship-distribution", async (req, res, next) => {
    try {
      const { groupBy } = req.query;
      const distribution = await storage.getInternshipDistribution(groupBy as string);
      res.json(distribution);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/analytics/test-performance", async (req, res, next) => {
    try {
      const { testId } = req.query;
      const performance = await storage.getTestPerformance(testId as string);
      res.json(performance);
    } catch (error) {
      next(error);
    }
  });
  
  // Authentication (For Super Admin)
  app.post("/api/auth/login", async (req, res, next) => {
    try {
      const { username, password } = req.body;
      const user = await storage.authenticateUser(username, password);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Check if user is a super admin
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

  const httpServer = createServer(app);
  return httpServer;
}
