// Types for the InternBooth application

// Test related types
export interface TestQuestion {
  id: number;
  type: 'mcq' | 'text';
  question: string;
  options?: string[];
  correctAnswer: string | number;
  timeAllowed: number; // in minutes
}

export interface Test {
  id?: string;
  title: string;
  description: string;
  questions: TestQuestion[] | string;
  duration: number;
  createdAt?: any;
  createdBy?: string;
  updatedAt?: any;
  updatedBy?: string;
  status: 'active' | 'inactive' | 'archived';
}

export interface TestFormValues {
  title: string;
  description: string;
  questions: string; // JSON string of TestQuestion[]
  duration: string;
}

// Application status types
export type ApplicationStatus = 
  | 'pending' 
  | 'under_review' 
  | 'shortlisted' 
  | 'form_pending' // Initial state when student applies
  | 'form_submitted' // After Round 1 form is submitted
  | 'form_approved' // After faculty approves Round 1 form
  | 'test_assigned' // When student is assigned Round 2 quiz
  | 'quiz_completed' // After Round 2 quiz is submitted
  | 'quiz_approved' // After Round 2 quiz is approved
  | 'quiz_rejected' // After Round 2 quiz is rejected
  | 'test_completed' // This might be for when a test *entity* is completed/closed, not a student's attempt
  | 'test_approved' // Legacy status, kept for backward compatibility
  | 'test_rejected' // Legacy status, kept for backward compatibility
  | 'rejected_round1' // Added for students rejected after round 1 form review
  | 'selected' // Final selection for internship
  | 'rejected'; // Final rejection

// Round status types
export type RoundStatus = 'pending' | 'passed' | 'failed';

// Application round interface
export interface ApplicationRound {
  roundNumber: number;
  status: RoundStatus;
  testAssignmentId?: string;
  feedback?: string;
  completedAt?: any;
  evaluatedAt?: any;
  evaluatedBy?: string;
}

export interface Application {
  id?: string;
  studentId: string;
  studentEmail?: string; // Student's email, often denormalized here
  studentName?: string; // Student's full name, denormalized
  internshipId: string;
  status: ApplicationStatus;
  currentRound: number;
  rounds: ApplicationRound[];
  appliedAt?: any;
  updatedAt?: any;
  resume?: string;
  coverLetter?: string;
  quizSubmissionId?: string; // ID of the associated quiz submission
  quizScore?: number;        // Score from the quiz
  quizCompletedAt?: any;     // When the quiz was completed
  quizStatus?: string;       // Status of the quiz (e.g., 'completed')
  round2SubmissionId?: string; // ID of the Round 2 submission, if applicable
  round2FormData?: {         // Embedded Round 2 form data
    projectExperience?: string;
    technicalSkills?: string;
    teamworkExperience?: string;
    challengesSolved?: string;
    careerGoals?: string;
    additionalInfo?: string;
  };
  selectedAt?: any;          // Timestamp when student was selected for internship
}

// Test assignment types
export interface TestAssignment {
  id?: string;
  studentId: string;
  internshipId: string;
  testId: string;
  applicationId: string;
  assignedAt?: any;
  assignedBy?: string;
  startedAt?: any;
  completedAt?: any;
  status: 'assigned' | 'in_progress' | 'completed' | 'approved' | 'rejected';
  score?: number;
  answers?: any[];
  feedback?: string;
}

export interface TestAssignmentValues {
  studentId: string;
  internshipId: string;
  testId: string;
}

// Student types
export interface Student {
  id?: string;
  uid?: string;
  name: string;
  email: string;
  college?: string;
  degree?: string;
  graduationYear?: number;
  skills?: string[];
  createdAt?: any;
  updatedAt?: any;
  firstName?: string; 
  lastName?: string;  
}

// Internship types
export interface Internship {
  id?: string;
  title: string;
  companyName: string;
  description: string;
  location?: string;
  duration?: string;
  stipend?: number;
  domains?: string[];
  skills?: string[];
  deadline?: any;
  postedBy?: string;
  postedAt?: any;
  status: 'active' | 'closed' | 'archived';
}

// Quiz Submission related types
export interface QuizQuestion {
  text: string;
  options?: string[];
  selectedOption?: number;
  correctOption?: number;
  correct?: boolean;
  explanation?: string;
}

export interface QuizSubmission {
  id: string; // Firestore document ID
  applicationId: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  testId: string;
  testName?: string;
  internshipId: string;
  internshipTitle?: string;
  questionData: any[]; // Consider defining a stricter type for QuestionData later
  questions?: QuizQuestion[]; // Added for quiz answers dialog
  score: number;
  totalPossiblePoints: number;
  percentage: number;
  submittedAt: any; // Firestore Timestamp
  status: 'pending' | 'approved' | 'rejected';
  fetchedStudentFullName?: string; // Added for UI purposes after fetching student details
}

// User related types
