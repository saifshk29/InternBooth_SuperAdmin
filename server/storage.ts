import { 
  users, faculty, students, internships, applications, tests, testsAssigned, analytics,
  type User, type Faculty, type Student, type Internship, type Application, type Test, 
  type TestAssigned, type Analytics, type InsertUser, type InsertFaculty, type InsertStudent,
  type InsertInternship, type InsertApplication, type InsertTest, type InsertTestAssigned,
  type InsertAnalytics
} from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  authenticateUser(username: string, password: string): Promise<User | null>;
  
  // Faculty operations
  getAllFaculty(): Promise<Faculty[]>;
  getFaculty(id: number): Promise<Faculty | undefined>;
  createFaculty(faculty: InsertFaculty): Promise<Faculty>;
  updateFaculty(id: number, data: Partial<Faculty>): Promise<Faculty>;
  deleteFaculty(id: number): Promise<void>;
  
  // Student operations
  getAllStudents(): Promise<Student[]>;
  getStudent(id: number): Promise<Student | undefined>;
  updateStudent(id: number, data: Partial<Student>): Promise<Student>;
  deleteStudent(id: number): Promise<void>;
  
  // Internship operations
  getAllInternships(): Promise<Internship[]>;
  getInternship(id: number): Promise<Internship | undefined>;
  updateInternship(id: number, data: Partial<Internship>): Promise<Internship>;
  deleteInternship(id: number): Promise<void>;
  
  // Application operations
  getAllApplications(): Promise<Application[]>;
  getApplication(id: number): Promise<Application | undefined>;
  
  // Test operations
  getAllTests(): Promise<Test[]>;
  getTest(id: number): Promise<Test | undefined>;
  createTest(test: InsertTest): Promise<Test>;
  updateTest(id: number, data: Partial<Test>): Promise<Test>;
  deleteTest(id: number): Promise<void>;
  
  // Test Assignment operations
  getAllTestAssignments(): Promise<TestAssigned[]>;
  assignTest(assignment: InsertTestAssigned): Promise<TestAssigned>;
  
  // Analytics operations
  getAnalyticsSummary(): Promise<any>;
  getActiveUsersData(period: string): Promise<any>;
  getApplicationsData(period: string): Promise<any>;
  getInternshipDistribution(groupBy: string): Promise<any>;
  getTestPerformance(testId: string): Promise<any>;
}

export class MemStorage implements IStorage {
  private usersData: Map<number, User>;
  private facultyData: Map<number, Faculty>;
  private studentsData: Map<number, Student>;
  private internshipsData: Map<number, Internship>;
  private applicationsData: Map<number, Application>;
  private testsData: Map<number, Test>;
  private testsAssignedData: Map<number, TestAssigned>;
  private analyticsData: Map<number, Analytics>;
  
  private currentUserId: number;
  private currentFacultyId: number;
  private currentStudentId: number;
  private currentInternshipId: number;
  private currentApplicationId: number;
  private currentTestId: number;
  private currentTestAssignedId: number;
  private currentAnalyticsId: number;
  
  constructor() {
    this.usersData = new Map();
    this.facultyData = new Map();
    this.studentsData = new Map();
    this.internshipsData = new Map();
    this.applicationsData = new Map();
    this.testsData = new Map();
    this.testsAssignedData = new Map();
    this.analyticsData = new Map();
    
    this.currentUserId = 1;
    this.currentFacultyId = 1;
    this.currentStudentId = 1;
    this.currentInternshipId = 1;
    this.currentApplicationId = 1;
    this.currentTestId = 1;
    this.currentTestAssignedId = 1;
    this.currentAnalyticsId = 1;
    
    // Initialize with a super admin user
    this.createUser({
      username: "admin",
      password: "admin123",
      role: "superadmin",
      email: "admin@campus.edu",
      status: "active",
    });
  }
  
  // User Methods
  async getUser(id: number): Promise<User | undefined> {
    return this.usersData.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersData.values()).find(
      (user) => user.username === username
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: now
    };
    this.usersData.set(id, user);
    return user;
  }
  
  async authenticateUser(username: string, password: string): Promise<User | null> {
    const user = await this.getUserByUsername(username);
    if (user && user.password === password) {
      return user;
    }
    return null;
  }
  
  // Faculty Methods
  async getAllFaculty(): Promise<Faculty[]> {
    return Array.from(this.facultyData.values());
  }
  
  async getFaculty(id: number): Promise<Faculty | undefined> {
    return this.facultyData.get(id);
  }
  
  async createFaculty(insertFaculty: InsertFaculty): Promise<Faculty> {
    const id = this.currentFacultyId++;
    const now = new Date();
    const faculty: Faculty = {
      ...insertFaculty,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.facultyData.set(id, faculty);
    return faculty;
  }
  
  async updateFaculty(id: number, data: Partial<Faculty>): Promise<Faculty> {
    const faculty = this.facultyData.get(id);
    if (!faculty) {
      throw new Error(`Faculty with ID ${id} not found`);
    }
    
    const updatedFaculty: Faculty = {
      ...faculty,
      ...data,
      updatedAt: new Date()
    };
    
    this.facultyData.set(id, updatedFaculty);
    return updatedFaculty;
  }
  
  async deleteFaculty(id: number): Promise<void> {
    if (!this.facultyData.has(id)) {
      throw new Error(`Faculty with ID ${id} not found`);
    }
    this.facultyData.delete(id);
  }
  
  // Student Methods
  async getAllStudents(): Promise<Student[]> {
    return Array.from(this.studentsData.values());
  }
  
  async getStudent(id: number): Promise<Student | undefined> {
    return this.studentsData.get(id);
  }
  
  async updateStudent(id: number, data: Partial<Student>): Promise<Student> {
    const student = this.studentsData.get(id);
    if (!student) {
      throw new Error(`Student with ID ${id} not found`);
    }
    
    const updatedStudent: Student = {
      ...student,
      ...data,
      updatedAt: new Date()
    };
    
    this.studentsData.set(id, updatedStudent);
    return updatedStudent;
  }
  
  async deleteStudent(id: number): Promise<void> {
    if (!this.studentsData.has(id)) {
      throw new Error(`Student with ID ${id} not found`);
    }
    this.studentsData.delete(id);
  }
  
  // Internship Methods
  async getAllInternships(): Promise<Internship[]> {
    return Array.from(this.internshipsData.values());
  }
  
  async getInternship(id: number): Promise<Internship | undefined> {
    return this.internshipsData.get(id);
  }
  
  async updateInternship(id: number, data: Partial<Internship>): Promise<Internship> {
    const internship = this.internshipsData.get(id);
    if (!internship) {
      throw new Error(`Internship with ID ${id} not found`);
    }
    
    const updatedInternship: Internship = {
      ...internship,
      ...data,
      updatedAt: new Date()
    };
    
    this.internshipsData.set(id, updatedInternship);
    return updatedInternship;
  }
  
  async deleteInternship(id: number): Promise<void> {
    if (!this.internshipsData.has(id)) {
      throw new Error(`Internship with ID ${id} not found`);
    }
    this.internshipsData.delete(id);
  }
  
  // Application Methods
  async getAllApplications(): Promise<Application[]> {
    return Array.from(this.applicationsData.values());
  }
  
  async getApplication(id: number): Promise<Application | undefined> {
    return this.applicationsData.get(id);
  }
  
  // Test Methods
  async getAllTests(): Promise<Test[]> {
    return Array.from(this.testsData.values());
  }
  
  async getTest(id: number): Promise<Test | undefined> {
    return this.testsData.get(id);
  }
  
  async createTest(insertTest: InsertTest): Promise<Test> {
    const id = this.currentTestId++;
    const now = new Date();
    const test: Test = {
      ...insertTest,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.testsData.set(id, test);
    return test;
  }
  
  async updateTest(id: number, data: Partial<Test>): Promise<Test> {
    const test = this.testsData.get(id);
    if (!test) {
      throw new Error(`Test with ID ${id} not found`);
    }
    
    const updatedTest: Test = {
      ...test,
      ...data,
      updatedAt: new Date()
    };
    
    this.testsData.set(id, updatedTest);
    return updatedTest;
  }
  
  async deleteTest(id: number): Promise<void> {
    if (!this.testsData.has(id)) {
      throw new Error(`Test with ID ${id} not found`);
    }
    this.testsData.delete(id);
  }
  
  // Test Assignment Methods
  async getAllTestAssignments(): Promise<TestAssigned[]> {
    return Array.from(this.testsAssignedData.values());
  }
  
  async assignTest(insertAssignment: InsertTestAssigned): Promise<TestAssigned> {
    const id = this.currentTestAssignedId++;
    const now = new Date();
    const assignment: TestAssigned = {
      ...insertAssignment,
      id,
      createdAt: now,
      updatedAt: now,
      completedAt: null
    };
    this.testsAssignedData.set(id, assignment);
    
    // Update the application status
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
  async getAnalyticsSummary(): Promise<any> {
    const students = Array.from(this.studentsData.values());
    const faculty = Array.from(this.facultyData.values());
    const internships = Array.from(this.internshipsData.values());
    const applications = Array.from(this.applicationsData.values());
    const testAssignments = Array.from(this.testsAssignedData.values());
    
    // Calculate active users for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const activeStudents = students.filter(student => 
      student.lastActive && new Date(student.lastActive) >= today
    ).length;
    
    return {
      totalStudents: students.length,
      totalFaculty: faculty.length,
      activeUsers: activeStudents,
      totalInternships: internships.length,
      totalApplications: applications.length,
      totalTestsAssigned: testAssignments.length,
      studentsTrend: 12, // Mocked trend data
      facultyTrend: 5,
      activeUsersTrend: -3,
      internshipsTrend: 18
    };
  }
  
  async getActiveUsersData(period: string): Promise<any> {
    // This would typically be calculated based on real data
    // For the demo, we'll return some mock data based on the period
    
    if (period === "week") {
      return [
        { name: "Mon", value: 145 },
        { name: "Tue", value: 213 },
        { name: "Wed", value: 278 },
        { name: "Thu", value: 259 },
        { name: "Fri", value: 305 },
        { name: "Sat", value: 187 },
        { name: "Sun", value: 152 },
      ];
    } else if (period === "month") {
      return [
        { name: "Week 1", value: 1250 },
        { name: "Week 2", value: 1450 },
        { name: "Week 3", value: 1320 },
        { name: "Week 4", value: 1490 },
      ];
    } else {
      return [
        { name: "Jan", value: 4200 },
        { name: "Feb", value: 3800 },
        { name: "Mar", value: 5100 },
      ];
    }
  }
  
  async getApplicationsData(period: string): Promise<any> {
    // Similar to active users, providing mock data based on period
    
    if (period === "week") {
      return [
        { name: "Mon", value: 12 },
        { name: "Tue", value: 18 },
        { name: "Wed", value: 25 },
        { name: "Thu", value: 15 },
        { name: "Fri", value: 22 },
        { name: "Sat", value: 8 },
        { name: "Sun", value: 5 },
      ];
    } else if (period === "month") {
      return [
        { name: "Week 1", value: 78 },
        { name: "Week 2", value: 92 },
        { name: "Week 3", value: 85 },
        { name: "Week 4", value: 110 },
      ];
    } else {
      return [
        { name: "Jan", value: 320 },
        { name: "Feb", value: 290 },
        { name: "Mar", value: 385 },
      ];
    }
  }
  
  async getInternshipDistribution(groupBy: string): Promise<any> {
    const internships = Array.from(this.internshipsData.values());
    
    if (groupBy === "department") {
      // Group internships by department (based on posted faculty)
      return [
        { name: "Computer Science", value: 35 },
        { name: "Electronics", value: 20 },
        { name: "Mechanical", value: 15 },
        { name: "Civil", value: 10 },
        { name: "Business", value: 20 },
      ];
    } else {
      // Group by type (faculty vs student startup)
      return [
        { name: "Faculty Posted", value: 65 },
        { name: "Student Startup", value: 35 },
      ];
    }
  }
  
  async getTestPerformance(testId: string): Promise<any> {
    // If testId is provided, get specific test performance
    // Otherwise return general test performance data
    
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
          { score: "Below 60", count: 3 },
        ]
      };
    } else {
      return [
        {
          id: "1",
          name: "Web Development Test",
          completedCount: 45,
          averageScore: 78,
        },
        {
          id: "2",
          name: "UX Design Fundamentals",
          completedCount: 32,
          averageScore: 82,
        },
        {
          id: "3",
          name: "Data Science Basics",
          completedCount: 28,
          averageScore: 65,
        },
      ];
    }
  }
}

export const storage = new MemStorage();
