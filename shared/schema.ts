import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users Table (For Authentication)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("student"),
  email: text("email").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Faculty Table
export const faculty = pgTable("faculty", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  department: text("department").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

// Students Table
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  course: text("course").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
  lastActive: timestamp("last_active"),
});

// Internships Table
export const internships = pgTable("internships", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  companyName: text("company_name").notNull(),
  description: text("description").notNull(),
  postedBy: text("posted_by").notNull(), // "faculty" or "student"
  postedById: integer("posted_by_id").notNull(),
  status: text("status").notNull().default("open"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

// Applications Table
export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => students.id),
  internshipId: integer("internship_id").references(() => internships.id),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

// Tests Table
export const tests = pgTable("tests", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  questions: text("questions").notNull(), // JSON string
  duration: integer("duration").notNull(), // in minutes
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

// Tests Assigned Table
export const testsAssigned = pgTable("tests_assigned", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => students.id),
  internshipId: integer("internship_id").references(() => internships.id),
  testId: integer("test_id").references(() => tests.id),
  applicationId: integer("application_id").references(() => applications.id),
  status: text("status").notNull().default("assigned"), // assigned, completed, evaluated
  score: integer("score"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
  completedAt: timestamp("completed_at"),
});

// Analytics Table
export const analytics = pgTable("analytics", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull().defaultNow(),
  activeStudents: integer("active_students").notNull().default(0),
  activeFaculty: integer("active_faculty").notNull().default(0),
  newApplications: integer("new_applications").notNull().default(0),
  testsAssigned: integer("tests_assigned").notNull().default(0),
  testsCompleted: integer("tests_completed").notNull().default(0),
});

// Create Zod schemas for insertion
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertFacultySchema = createInsertSchema(faculty).omit({ id: true, updatedAt: true });
export const insertStudentSchema = createInsertSchema(students).omit({ id: true, updatedAt: true, lastActive: true });
export const insertInternshipSchema = createInsertSchema(internships).omit({ id: true, updatedAt: true });
export const insertApplicationSchema = createInsertSchema(applications).omit({ id: true, updatedAt: true });
export const insertTestSchema = createInsertSchema(tests).omit({ id: true, updatedAt: true });
export const insertTestAssignedSchema = createInsertSchema(testsAssigned).omit({ id: true, updatedAt: true, completedAt: true });
export const insertAnalyticsSchema = createInsertSchema(analytics).omit({ id: true });

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertFaculty = z.infer<typeof insertFacultySchema>;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type InsertInternship = z.infer<typeof insertInternshipSchema>;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type InsertTest = z.infer<typeof insertTestSchema>;
export type InsertTestAssigned = z.infer<typeof insertTestAssignedSchema>;
export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;

export type User = typeof users.$inferSelect;
export type Faculty = typeof faculty.$inferSelect;
export type Student = typeof students.$inferSelect;
export type Internship = typeof internships.$inferSelect;
export type Application = typeof applications.$inferSelect;
export type Test = typeof tests.$inferSelect;
export type TestAssigned = typeof testsAssigned.$inferSelect;
export type Analytics = typeof analytics.$inferSelect;
