import { useState, useEffect, useCallback } from "react";
import { 
  PlusIcon, 
  UserPlusIcon, 
  SearchIcon, 
  FilterIcon, 
  PencilIcon, 
  EyeIcon,
  TrashIcon,
  CheckCircleIcon,
  ClockIcon,
  Loader2 as Loader2Icon
} from "lucide-react";
import { useLocation } from "wouter";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { 
  Form, 
  FormControl, 
  FormDescription,
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import TestReviewDialog from "@/components/tests/TestReviewDialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Textarea } from "@/components/ui/textarea";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  serverTimestamp, 
  query, 
  where, 
  doc, 
  updateDoc,
  getDoc, 
  DocumentSnapshot,
  onSnapshot,
  collectionGroup,
  writeBatch
} from "firebase/firestore";
import { 
  auth, 
  createTest, 
  deleteTest, 
  assignTest, 
  getTestAssignmentDetails, 
  approveTestResult, 
  rejectTestResult, 
  getApplicationsByInternship, 
  deleteTestAssignment,
  getStudentList,
  getInternshipList,
  getApplications,
  getTestsList,
  getTestAssignments,
  onTestsChange,
  onTestAssignmentsChange
} from "@/lib/firebase";
import { getInitials, cn, handleFirebaseError } from "@/lib/utils";
import { 
  Internship, 
  Student, 
  Test, 
  TestAssignment, 
  Application, 
  ApplicationStatus, 
  TestQuestion, 
  QuizSubmission 
} from "../lib/types";

// Test form schema
const testFormSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  questions: z.string().min(10, "Questions must be at least 10 characters"), // This would be a JSON string in real app
  duration: z.string().min(1, "Please specify overall test duration (minutes)"),
});

type TestFormValues = z.infer<typeof testFormSchema>;

// Test assignment schema
const testAssignmentSchema = z.object({
  internshipId: z.string().min(1, "Please select an internship"),
  testId: z.string().min(1, "Please select a test"),
  studentIds: z.array(z.string()).min(1, "Please select at least one student"),
});

type TestAssignmentValues = z.infer<typeof testAssignmentSchema>;

// Helper function to format application status for display
const formatStatusLabel = (status: ApplicationStatus | string | undefined): string => {
  if (!status) return 'Unknown';
  
  switch (status) {
    case 'form_submitted': return 'Form Submitted';
    case 'form_approved': return 'Form Approved';
    case 'test_assigned': return 'Test Assigned';
    case 'quiz_completed': return 'Quiz Completed';
    case 'selected': return 'Selected';
    case 'rejected': return 'Rejected';
    default: return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
};

// Helper function to get badge color based on application status
const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case 'form_submitted':
      return 'bg-blue-100 text-blue-800';
    case 'test_assigned':
      return 'bg-yellow-100 text-yellow-800';
    case 'quiz_submitted':
      return 'bg-purple-100 text-purple-800';
    case 'selected':
      return 'bg-green-100 text-green-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function ManageTests() {
  const { toast } = useToast();
  const [tests, setTests] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [internships, setInternships] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [internshipApplications, setInternshipApplications] = useState<any[]>([]);
  const [testAssignments, setTestAssignments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingApplications, setIsLoadingApplications] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [showTestDetails, setShowTestDetails] = useState(false);
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [_, setLocation] = useLocation();
  
  // State for test review dialog
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [selectedTestAssignment, setSelectedTestAssignment] = useState<string | null>(null);
  
  // State for quiz answers dialog
  const [showQuizAnswersDialog, setShowQuizAnswersDialog] = useState(false);
  const [selectedQuizSubmission, setSelectedQuizSubmission] = useState<any>(null);
  const [isLoadingQuizDetails, setIsLoadingQuizDetails] = useState(false);
  const [testReviewDetails, setTestReviewDetails] = useState<any>(null);
  const [isLoadingReview, setIsLoadingReview] = useState(false);
  
  // Add these new states for quiz answers
  const [quizAnswers, setQuizAnswers] = useState<Record<string, any>[]>([]);
  const [showAnswersDialog, setShowAnswersDialog] = useState(false);
  
  // State for pending quiz submissions
  const [pendingSubmissions, setPendingSubmissions] = useState<QuizSubmission[]>([]);
  const [isLoadingPendingSubmissions, setIsLoadingPendingSubmissions] = useState(false);
  const [selectedSubmissionForReview, setSelectedSubmissionForReview] = useState<QuizSubmission | null>(null);
  
  // State for Pending Evaluations Tab
  const [internshipsForEvaluation, setInternshipsForEvaluation] = useState<(Internship & { hasSubmissions: boolean; })[]>([]);
  const [isLoadingEvaluations, setIsLoadingEvaluations] = useState(false);

  // Add near other state declarations
  const [reviewData, setReviewData] = useState<{
    answers: any[];
    questions: any[];
    submission: any;
    application: any;
  } | null>(null);

  // Debug state
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [submissionViewer, setSubmissionViewer] = useState<{
    show: boolean;
    data: {
      answers: Array<{
        question: string;
        studentAnswer: string;
        correctAnswer: string;
        isCorrect: boolean;
        type: string;
        points: number;
        options?: string[];
        correctAnswerIndex?: number;
        selectedIndex?: number;
      }>;
      metadata: {
        studentName: string;
        testName: string;
        score: string;
        submittedAt: string;
        percentage: number;
      };
      rawData: any;
    } | null;
  }>({ show: false, data: null });

  // Debug logging
  const logDebug = (message: string) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    setDebugLogs(prev => [...prev, logMessage]);
  };

  // Create test form
  const createTestForm = useForm<TestFormValues>({
    resolver: zodResolver(testFormSchema),
    defaultValues: {
      title: "",
      description: "",
      questions: JSON.stringify([
        { 
          id: 1, 
          type: "mcq", 
          question: "What is React?", 
          options: ["A UI library", "A programming language", "A database", "An API"],
          correctAnswer: 0, // Index of correct option (A UI library)
          timeAllowed: 2 // Time allowed in minutes for this question
        },
        { 
          id: 2, 
          type: "text", 
          question: "Explain the concept of state in React.",
          correctAnswer: "State is a JavaScript object that stores component data that may change over time.",
          timeAllowed: 5 // Time allowed in minutes for this question
        }
      ], null, 2),
      duration: "60",
    },
  });
  
  // Assign test form
  const assignTestForm = useForm<TestAssignmentValues>({
    resolver: zodResolver(testAssignmentSchema),
    defaultValues: {
      internshipId: "",
      testId: "",
      studentIds: [],
    },
  });

  // Function to fetch test assignments
  const fetchTestAssignments = async () => {
    try {
      const assignmentsData = await getTestAssignments();
      setTestAssignments(assignmentsData);
    } catch (error) {
      console.error("Error fetching test assignments:", error);
      toast({
        variant: "destructive",
        title: "Error fetching test assignments",
        description: handleFirebaseError(error),
      });
    }
  };

  // Function to fetch pending quiz submissions
  const fetchPendingSubmissions = async () => {
    setIsLoadingPendingSubmissions(true);
    try {
      const db = getFirestore();
      const submissionsRef = collection(db, "quizSubmissions");
      const q = query(submissionsRef, where("status", "==", "pending"));
      const querySnapshot = await getDocs(q);
      const submissions: QuizSubmission[] = [];
      querySnapshot.forEach((doc) => {
        submissions.push({ id: doc.id, ...doc.data() } as QuizSubmission);
      });
      
      // Fetch application details for each submission to ensure we have the correct path
      const submissionsWithApplicationDetails = await Promise.all(
        submissions.map(async (submission) => {
          if (!submission.applicationId || !submission.internshipId) {
            return submission;
          }
          try {
            // Get the application document from the nested collection
            const applicationRef = doc(
              db, 
              "internships", 
              submission.internshipId, 
              "applications", 
              submission.applicationId
            );
            const applicationSnap = await getDoc(applicationRef);
            if (applicationSnap.exists()) {
              const applicationData = applicationSnap.data() as Application;
              return { ...submission, applicationStatus: applicationData.status };
            }
            return submission;
          } catch (error) {
            console.error(`Error fetching application ${submission.applicationId}:`, error);
            return submission;
          }
        })
      );

      // Fetch student details for each submission
      const submissionsWithStudentNames = await Promise.all(
        submissionsWithApplicationDetails.map(async (submission) => {
          if (!submission.studentId) {
            return { ...submission, fetchedStudentFullName: 'Student ID missing' };
          }
          try {
            const studentRef = doc(db, 'students', submission.studentId);
            const studentSnap = await getDoc(studentRef);
            if (studentSnap.exists()) {
              const studentData = studentSnap.data() as Student; // Student type should be imported
              const fName = (studentData as any).firstName;
              const lName = (studentData as any).lastName;
              let fullName = 'Student (Name not found)';
              if (fName || lName) {
                fullName = `${fName || ''} ${lName || ''}`.trim();
              } else if (studentData.name) {
                fullName = studentData.name;
              }
              return { ...submission, fetchedStudentFullName: fullName };
            } else {
              return { ...submission, fetchedStudentFullName: 'Student (Not found)' };
            }
          } catch (error) {
            console.error(`Error fetching student ${submission.studentId}:`, error);
            return { ...submission, fetchedStudentFullName: 'Student (Error loading name)' };
          }
        })
      );

      setPendingSubmissions(submissionsWithStudentNames);
      console.log("Fetched pending submissions with names and application details:", submissionsWithStudentNames);
    } catch (error) {
      console.error("Error fetching pending submissions:", error);
      toast({
        variant: "destructive",
        title: "Error fetching pending submissions",
        description: handleFirebaseError(error),
      });
    }
    finally {
      setIsLoadingPendingSubmissions(false);
    }
  };

  // Fetch all active internships
  const fetchActiveInternships = useCallback(async () => {
    try {
      const db = getFirestore();
      const internshipsQuery = query(
        collection(db, "internships"),
        where("status", "==", "active") // Only get active internships
      );
      const internshipSnapshot = await getDocs(internshipsQuery);
      return internshipSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        hasSubmissions: false // Add a flag to track if internship has submissions
      } as Internship & { hasSubmissions: boolean }));
    } catch (error) {
      console.error("Error fetching active internships:", error);
      // Toast notification for this error can be added if desired, 
      // but the calling function setupInternshipsForEvaluationListener will also show a toast.
      return [];
    }
  }, []); // Assuming getFirestore is stable or add to dependencies if not.

  // New function to set up real-time listener for internships for evaluation
  const setupInternshipsForEvaluationListener = useCallback(() => {
    setIsLoadingEvaluations(true);
    const db = getFirestore();
    let unsubscribeApplications: (() => void) | null = null;

    (async () => {
      try {
        const activeInternships = await fetchActiveInternships();

        if (activeInternships.length === 0) {
          setInternshipsForEvaluation([]);
          setIsLoadingEvaluations(false);
          return;
        }

        // Use collectionGroup to query all 'applications' subcollections
        // After round swap, we need to look for form_submitted status (Round 1)
        const applicationsQuery = query(
          collectionGroup(db, "applications"),
          where("status", "in", ["form_submitted", "form_approved"])
        );

        unsubscribeApplications = onSnapshot(applicationsQuery, (appSnapshot) => {
          const formSubmittedApps = appSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Application));

          console.log("[ManageTests EvalListener] Raw formSubmittedApps:", JSON.stringify(formSubmittedApps, null, 2));

          const internshipIdsWithSubmissions = new Set(
            formSubmittedApps.map(app => app.internshipId)
          );
          console.log("[ManageTests EvalListener] internshipIdsWithSubmissions Set:", Array.from(internshipIdsWithSubmissions));

          const internshipsWithSubmissionStatus = activeInternships.map(internship => ({
            ...internship,
            hasSubmissions: internshipIdsWithSubmissions.has(internship.id || '')
          }));
          console.log("[ManageTests EvalListener] internshipsWithSubmissionStatus:", JSON.stringify(internshipsWithSubmissionStatus, null, 2));

          setInternshipsForEvaluation(internshipsWithSubmissionStatus);
          setIsLoadingEvaluations(false); // Update loading state after data is processed
        }, (error) => {
          console.error("Error in applications listener (evaluation):", error);
          toast({
            variant: "destructive",
            title: "Error Updating Evaluations",
            description: handleFirebaseError(error),
          });
          setInternshipsForEvaluation([]);
          setIsLoadingEvaluations(false);
        });
      } catch (error: any) { // Catches errors from fetchActiveInternships
        console.error("Error setting up evaluation listener:", error);
        toast({
          variant: "destructive",
          title: "Error Initializing Evaluations",
          description: handleFirebaseError(error),
        });
        setInternshipsForEvaluation([]);
        setIsLoadingEvaluations(false);
      }
    })();

    return () => {
      if (unsubscribeApplications) {
        unsubscribeApplications();
      }
    };
  }, [fetchActiveInternships, toast, setIsLoadingEvaluations, setInternshipsForEvaluation]); // Dependencies for useCallback

  // Debug logging effect
  useEffect(() => {
    const logs = [
      `[DEBUG] Current reviewData: ${JSON.stringify(reviewData, null, 2)}`,
      `[DEBUG] Pending submissions: ${pendingSubmissions.length}`
    ];
    console.log(logs.join('\n'));
    setDebugLogs(prev => [...prev, ...logs]);
  }, [reviewData, pendingSubmissions]);

  // Function to verify quiz completion
  const verifyQuizCompletion = async (submissionId: string) => {
    const db = getFirestore();
    const submissionRef = doc(db, 'quizSubmissions', submissionId);
    const submissionSnap = await getDoc(submissionRef);
    
    if (!submissionSnap.exists()) {
      throw new Error('Quiz submission not found');
    }

    const applicationRef = doc(db, 'applications', submissionSnap.data().applicationId);
    const applicationSnap = await getDoc(applicationRef);

    if (applicationSnap.data()?.status !== 'quiz_completed') {
      throw new Error('Application status not updated properly');
    }
    
    return {
      submission: submissionSnap.data(),
      application: applicationSnap.data()
    };
  };

  // Fetch data
  useEffect(() => {
    setIsLoading(true);
    fetchPendingSubmissions(); // Fetch pending submissions on component mount
    
    const fetchData = async () => {
      setIsLoading(true);
      
      try {
        // Fetch all data including students first
        const [testsData, assignmentsData, studentsData, internshipsData] = await Promise.all([
          getTestsList(),
          getTestAssignments(),
          getStudentList(),
          getInternshipList()
        ]);
        
        // Set all the data
        setTests(testsData);
        setTestAssignments(assignmentsData);
        setStudents(studentsData);
        setInternships(internshipsData);
        
        // Fetch applications
        const applicationsData = await getApplications();
        setApplications(applicationsData);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          variant: "destructive",
          title: "Error fetching data",
          description: handleFirebaseError(error),
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [toast]);
  
  const fetchApplicationsForInternship = async (internshipId: string) => {
    if (!internshipId) return;
    
    setIsLoadingApplications(true);
    try {
      // Get applications for the internship
      const applications = await getApplicationsByInternship(internshipId);
      
      // Fetch student details for each application
      const db = getFirestore();
      const applicationsWithStudents = await Promise.all(
        applications.map(async (application) => {
          try {
            const studentRef = doc(db, 'students', application.studentId);
            const studentSnap = await getDoc(studentRef);
            
            if (studentSnap.exists()) {
              const studentData = studentSnap.data();
              // Update the application with student details
              return {
                ...application,
                studentName: studentData.name || `${studentData.firstName || ''} ${studentData.lastName || ''}`.trim() || 'Unknown Student',
                studentEmail: studentData.email,
                studentDetails: studentData // Store full student details
              };
            }
            
            return {
              ...application,
              studentName: 'Unknown Student',
              studentEmail: 'No email found'
            };
          } catch (err) {
            console.error(`Error fetching student ${application.studentId}:`, err);
            return {
              ...application,
              studentName: 'Error loading student',
              studentEmail: 'Error loading email'
            };
          }
        })
      );
      
      setInternshipApplications(applicationsWithStudents);
    } catch (error: any) {
      console.error("Error fetching applications for internship:", error);
      toast({
        variant: "destructive",
        title: "Error fetching applications",
        description: error.message ? error.message : handleFirebaseError(error),
      });
    } finally {
      setIsLoadingApplications(false);
    }
  };

  // Create a new test
  const handleCreateTest = async (data: TestFormValues) => {
    setIsSubmitting(true);
    try {
      const newTest = await createTest({
        title: data.title,
        description: data.description,
        questions: data.questions, // This is a JSON string that will be parsed in the createTest function
        duration: parseInt(data.duration),
      });
      
      // Add new test to the list
      setTests([...tests, { id: newTest.id, ...data }]);
      
      toast({
        title: "Test created",
        description: `${data.title} has been created successfully.`,
      });
      
      // Reset form and close dialog
      createTestForm.reset();
      setShowCreateForm(false);
    } catch (error) {
      console.error("Error creating test:", error);
      toast({
        variant: "destructive",
        title: "Error creating test",
        description: handleFirebaseError(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Assign a test to multiple students
  const handleAssignTest = async (data: TestAssignmentValues) => {
    setIsSubmitting(true);
    try {
      // Track successful and failed assignments
      const results = {
        success: 0,
        failed: 0,
        errors: [] as string[]
      };
      
      // Ensure internshipApplications corresponds to the selected internshipId in the form
      // This should be guaranteed if fetchApplicationsForInternship was called on form's internshipId change
      if (!internships.find(i => i.id === data.internshipId)) {
        toast({
          variant: "destructive",
          title: "Error assigning tests",
          description: "Selected internship is invalid or not loaded.",
        });
        setIsSubmitting(false);
        return;
      }

      // Process each student
      for (const studentId of data.studentIds) {
        try {
          // Find the application that matches the student and internship
          // Use internshipApplications which is already filtered for the selected internship
          const application = internshipApplications.find(app => 
            app.studentId === studentId && app.internshipId === data.internshipId
          );
          
          if (!application) {
            throw new Error(`No application found for student ID ${studentId} in the selected internship.`);
          }
          
          // Check if a test is already assigned to this application
          const existingAssignment = testAssignments.find(assignment => 
            assignment.applicationId === application.id
          );
          
          if (existingAssignment) {
            throw new Error(`A test is already assigned to this student`);
          }
          
          // Assign the test
          const assignment = await assignTest({
            studentId: studentId,
            internshipId: data.internshipId,
            testId: data.testId,
            applicationId: application.id,
          });
          
          // Update application status to test_assigned with fallback and validation
          try {
            const updateData = {
              status: 'test_assigned',
              testId: data.testId,
              updatedAt: serverTimestamp()
            };

            // Try primary path first
            try {
              await updateDoc(doc(getFirestore(), 'applications', application.id), updateData);
              console.log(`Updated application ${application.id} status at applications/${application.id}`);
            } catch (primaryError) {
              console.warn(`Primary update failed, trying fallback path:`, primaryError);
              
              // Fallback to internship subcollection
              await updateDoc(doc(getFirestore(), 'internships', data.internshipId, 'applications', application.id), updateData);
              console.log(`Updated application ${application.id} status at internships/${data.internshipId}/applications/${application.id}`);
            }

            // Validate the update
            const updatedDoc = await getDoc(doc(getFirestore(), 'applications', application.id));
            if (!updatedDoc.exists() || updatedDoc.data()?.status !== 'test_assigned') {
              throw new Error('Status update verification failed');
            }
            
          } catch (updateError) {
            console.error(`Failed to update application status:`, updateError);
            throw new Error(`Test was assigned but status update failed or couldn't be verified`);
          }
          
          // Add the assignment to the list
          setTestAssignments(prev => [...prev, {
            id: assignment.id,
            studentId: studentId,
            internshipId: data.internshipId,
            testId: data.testId,
            applicationId: application.id,
            status: "assigned",
          }]);
          
          results.success++;
        } catch (err: any) {
          results.failed++;
          results.errors.push(`${getStudentName(studentId)}: ${err.message}`); // getStudentName will be updated
        }
      }
      
      // Show toast with results
      if (results.success > 0) {
        toast({
          title: `${results.success} test${results.success > 1 ? 's' : ''} assigned`,
          description: `Successfully assigned test to ${results.success} student${results.success > 1 ? 's' : ''}.${results.failed > 0 ? ` Failed for ${results.failed} student${results.failed > 1 ? 's' : ''}.` : ''}`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Failed to assign tests",
          description: "No tests were assigned. Please check the errors and try again.",
        });
      }
      
      // If there were errors, log them
      if (results.errors.length > 0) {
        console.error("Errors during test assignment:", results.errors);
      }
      
      // Reset form and close dialog if at least one assignment was successful
      if (results.success > 0) {
        assignTestForm.reset();
        setShowAssignForm(false);
      }
    } catch (error: any) {
      console.error("Error assigning tests:", error);
      toast({
        variant: "destructive",
        title: "Error assigning tests",
        description: error.message ? error.message : handleFirebaseError(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // View test details
  const handleViewTest = (test: any) => {
    setSelectedTest(test);
    setShowTestDetails(true);
  };

  // Open test review dialog
  const handleOpenReview = async (assignmentId: string) => {
    setIsLoadingReview(true);
    setSelectedTestAssignment(assignmentId);
    
    try {
      // Fetch detailed information about the test assignment
      const details = await getTestAssignmentDetails(assignmentId);
      setTestReviewDetails(details);
      setShowReviewDialog(true);
    } catch (error: any) {
      console.error("Error fetching test details:", error);
      toast({
        variant: "destructive",
        title: "Error fetching test details",
        description: error.message || handleFirebaseError(error),
      });
    } finally {
      setIsLoadingReview(false);
    }
  };

  // Delete a test
  const handleDeleteTest = async (id: string) => {
    try {
      await deleteTest(id);
      
      // Remove the test from the list
      setTests(tests.filter(test => test.id !== id));
      
      toast({
        title: "Test deleted",
        description: "Test has been deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting test:", error);
      toast({
        variant: "destructive",
        title: "Error deleting test",
        description: handleFirebaseError(error),
      });
    }
  };

  // Delete a test assignment
  const handleDeleteTestAssignment = async (id: string) => {
    try {
      await deleteTestAssignment(id);
      
      // Remove the test assignment from the list
      setTestAssignments(testAssignments.filter(assignment => assignment.id !== id));
      
      toast({
        title: "Test assignment deleted",
        description: "Test assignment has been deleted successfully.",
      });
    } catch (error: any) {
      console.error("Error deleting test assignment:", error);
      toast({
        variant: "destructive",
        title: "Error deleting test assignment",
        description: error.message || handleFirebaseError(error),
      });
    }
  };

  // Filter tests based on active tab
  const getFilteredTests = () => {
    switch (activeTab) {
      case "assigned":
        // Get test IDs that have been assigned
        const assignedTestIds = new Set(testAssignments.map(assignment => assignment.testId));
        return tests.filter(test => assignedTestIds.has(test.id));
        
      case "completed":
        // Get test IDs that have been completed
        const completedTestIds = new Set(
          testAssignments
            .filter(assignment => assignment.status === "completed")
            .map(assignment => assignment.testId)
        );
        return tests.filter(test => completedTestIds.has(test.id));
        
      case "pending":
        // Get test IDs that have been assigned but not completed
        const pendingTestIds = new Set(
          testAssignments
            .filter(assignment => assignment.status === "assigned")
            .map(assignment => assignment.testId)
        );
        return tests.filter(test => pendingTestIds.has(test.id));
        
      default:
        // All tests
        return tests;
    }
  };

  // Robust getStudentName function
  const getStudentName = (studentId: string): string => {
    const student = students.find(s => s.id === studentId);
    if (student) {
      const firstName = student.firstName || '';
      const lastName = student.lastName || '';
      let fullName = `${firstName} ${lastName}`.trim();
      
      if (fullName && fullName !== "undefined undefined") return fullName;
      // Fallback to student.name if it exists and is a non-empty string
      if (student.name && typeof student.name === 'string') {
        const trimmedName = student.name.trim();
        if (trimmedName) return trimmedName;
      }
    }
    return `Student ID ${studentId}`; // Clearer fallback if no name found
  };

  // Get internship title by ID
  const getInternshipTitle = (id: string) => {
    const internship = internships.find(i => i.id === id);
    return internship ? internship.title : "Unknown Internship";
  };

  // Get test title by ID
  const getTestTitle = (id: string) => {
    const test = tests.find(t => t.id === id);
    return test ? test.title : "Unknown Test";
  };

  // Format test questions for display
  const formatQuestions = (questionsJson: string) => {
    try {
      const questions = JSON.parse(questionsJson);
      return (
        <div className="space-y-4">
          {questions.map((q: any, index: number) => (
            <div key={q.id} className="border p-4 rounded-md">
              <div className="flex justify-between items-start mb-2">
                <p className="font-medium">Q{index + 1}: {q.question}</p>
                <div className="flex items-center text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                  <ClockIcon className="h-3.5 w-3.5 mr-1" />
                  {q.timeAllowed} min
                </div>
              </div>
              
              {q.type === "mcq" && (
                <>
                  <ul className="mt-2 space-y-1">
                    {q.options.map((option: string, idx: number) => (
                      <li key={idx} className={`text-sm p-1 rounded-sm ${q.correctAnswer === idx ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-600'}`}>
                        {String.fromCharCode(65 + idx)}. {option} 
                        {q.correctAnswer === idx && <CheckCircleIcon className="h-4 w-4 inline-block ml-1 text-green-600" />}
                      </li>
                    ))}
                  </ul>
                </>
              )}
              
              {q.type === "text" && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600">
                    [Short answer/essay question]
                  </p>
                  {q.correctAnswer && (
                    <div className="mt-2 p-2 bg-green-50 text-green-700 rounded-sm text-sm">
                      <span className="font-medium">Model Answer:</span> {q.correctAnswer}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      );
    } catch (e) {
      return <p className="text-red-500">Error parsing questions</p>;
    }
  };

  // Enhanced answer viewing with better error handling
  const handleViewQuizAnswers = async (submission: any) => {
    try {
      console.log(`[DEBUG] Fetching answers for submission: ${submission.id}`);
      
      if (!submission?.id) {
        throw new Error('Invalid submission data - missing submission ID');
      }

      const db = getFirestore();
      const answersRef = collection(db, 'quizSubmissions', submission.id, 'answers');
      console.log(`[DEBUG] Firestore path: quizSubmissions/${submission.id}/answers`);
      
      const answersSnapshot = await getDocs(answersRef);
      console.log(`[DEBUG] Found ${answersSnapshot.size} answer documents`);
      
      if (answersSnapshot.empty) {
        throw new Error('No answers found in the database');
      }

      const answers = answersSnapshot.docs.map(doc => {
        const data = doc.data();
        if (!data.question || !data.answer) {
          console.warn(`[WARN] Answer ${doc.id} missing question or answer fields`);
        }
        return {
          id: doc.id,
          ...data,
          applicationId: submission.applicationId,
          testId: submission.testId
        };
      });

      setQuizAnswers(answers);
      setShowAnswersDialog(true);
      
      console.log('[DEBUG] Successfully loaded answers:', answers.length);
      
    } catch (error) {
      let displayMessage = "An unknown error occurred while fetching answers.";
      let loggableErrorObject: { message?: string; stack?: string; originalError?: unknown } = {};

      if (error instanceof Error) {
        displayMessage = error.message;
        loggableErrorObject = { message: error.message, stack: error.stack };
      } else if (typeof error === 'string') {
        displayMessage = error;
        loggableErrorObject = { message: error };
      } else if (error && typeof error === 'object' && 'message' in error) {
        displayMessage = String((error as { message: unknown }).message);
        loggableErrorObject = { message: displayMessage, originalError: error };
        if ('stack' in error && (error as { stack?: unknown }).stack) {
            loggableErrorObject.stack = String((error as { stack: unknown }).stack);
        }
      } else {
        // For truly unknown errors, log the error itself if it's not undefined or null
        if (error !== undefined && error !== null) {
            loggableErrorObject = { originalError: error };
        } else {
            loggableErrorObject = { message: "Error object was undefined or null." };
        }
      }

      console.error('[ERROR] Failed to fetch answers:', {
        errorDetails: loggableErrorObject,
        submission: submission
      });
      
      toast({
        variant: 'destructive',
        title: 'Failed to load answers',
        description: displayMessage.includes('No answers') 
          ? 'This quiz submission has no answers recorded.' 
          : `Technical error: ${displayMessage}`,
      });
    }
  };

  // Function to open review dialog (we'll use TestReviewDialog.tsx for this)
  const handleReviewSubmission = (submission: any) => {
    setSelectedSubmissionForReview(submission);
    // We'll need to pass data to TestReviewDialog, for now just logging
    console.log("Reviewing submission:", submission);
    // TODO: Integrate with TestReviewDialog.tsx
    // setShowReviewDialog(true); // This will be handled by the dialog's own state or props
  };

  // New useEffect for managing internshipsForEvaluation listener
  useEffect(() => {
    const unsubscribe = setupInternshipsForEvaluationListener();
    return unsubscribe;
  }, [setupInternshipsForEvaluationListener]);

  const viewSubmission = async (submissionId: string) => {
    try {
      logDebug(`Fetching submission ${submissionId}`);
      const db = getFirestore();
      const docRef = doc(db, 'quizSubmissions', submissionId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) throw new Error('Submission not found');

      const data = docSnap.data();
      logDebug(`Submission data: ${JSON.stringify(data, null, 2)}`);

      if (!data?.questionData) throw new Error('No questionData in submission');

      setSubmissionViewer({
        show: true,
        data: {
          answers: data.questionData.map((q: any) => {
            const base = {
              question: q.question || 'No question text',
              studentAnswer: q.userAnswer || 'No answer provided',
              correctAnswer: q.correctAnswer || 'No correct answer',
              isCorrect: Boolean(q.isCorrect),
              type: q.type || 'unknown',
              points: q.points || 0
            };
            
            // Handle MCQ questions differently
            if (q.type === 'mcq' && Array.isArray(q.options)) {
              return {
                ...base,
                options: q.options,
                correctAnswerIndex: q.correctAnswerIndex,
                selectedIndex: q.options.indexOf(q.userAnswer)
              };
            }
            return base;
          }),
          metadata: {
            studentName: data.studentName || 'Unknown student',
            testName: data.testName || 'Unknown test',
            score: `${data.score || 0}/${data.totalPossiblePoints || 0}`,
            submittedAt: data.submittedAt?.toDate()?.toLocaleString() || 'Unknown time',
            percentage: Math.round(((data.score || 0) / (data.totalPossiblePoints || 1)) * 100)
          },
          rawData: data
        }
      });

    } catch (error: any) {
      const errorMsg = error.message || 'Unknown error';
      logDebug(`Error: ${errorMsg}`);
      toast({
        variant: 'destructive',
        title: 'Failed to load submission',
        description: errorMsg,
        action: (
          <Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(errorMsg)}>
            Copy Error
          </Button>
        )
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-heading font-bold">Manage Tests</h1>
        <div className="flex gap-3">
          <Button 
            className="bg-primary hover:bg-indigo-700"
            onClick={() => setShowCreateForm(true)}
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            <span>Create New Test</span>
          </Button>
          <Button 
            className="bg-secondary hover:bg-violet-700"
            onClick={() => setShowAssignForm(true)}
          >
            <UserPlusIcon className="mr-2 h-4 w-4" />
            <span>Assign Test</span>
          </Button>
        </div>
      </div>
      
      {/* Test Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 border-b"> 
          <TabsTrigger 
            value="all" 
            className="border-b-2 border-transparent data-[state=active]:border-primary rounded-none data-[state=active]:bg-transparent data-[state=active]:text-primary"
          >
            All Tests
          </TabsTrigger>
          <TabsTrigger 
            value="assigned" 
            className="border-b-2 border-transparent data-[state=active]:border-primary rounded-none data-[state=active]:bg-transparent data-[state=active]:text-primary"
          >
            Assigned Tests
          </TabsTrigger>
          <TabsTrigger 
            value="completed" 
            className="border-b-2 border-transparent data-[state=active]:border-primary rounded-none data-[state=active]:bg-transparent data-[state=active]:text-primary"
          >
            Completed Tests
          </TabsTrigger>
          <TabsTrigger 
            value="pending-evaluations" 
            className="border-b-2 border-transparent data-[state=active]:border-primary rounded-none data-[state=active]:bg-transparent data-[state=active]:text-primary"
          >
            Pending Evaluations
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="pt-4">
          {/* Tests Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {isLoading ? (
              <p className="col-span-full text-center py-8">Loading tests...</p>
            ) : getFilteredTests().length === 0 ? (
              <p className="col-span-full text-center py-8">No tests found for this category.</p>
            ) : (
              getFilteredTests().map((test) => (
                <Card key={test.id} className="overflow-hidden border hover:shadow-md transition-shadow">
                  <CardHeader className="border-b p-5">
                    <div className="flex justify-between items-start">
                      <CardTitle className="font-heading font-semibold">{test.title}</CardTitle>
                      <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                        {test.status || "Active"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Created on {new Date(test.createdAt?.toDate() || Date.now()).toLocaleDateString()}
                    </p>
                  </CardHeader>
                  <CardContent className="p-5">
                    <div className="flex items-center text-gray-500 text-sm mb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span>{test.duration} Minutes Duration</span>
                    </div>
                    
                    {/* Number of questions */}
                    <div className="flex items-center text-gray-500 text-sm mb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="17" x2="12" y2="17" />
                      </svg>
                      <span>
                        {(() => {
                          try {
                            const questions = JSON.parse(test.questions);
                            const mcqCount = questions.filter((q: any) => q.type === "mcq").length;
                            const textCount = questions.filter((q: any) => q.type === "text").length;
                            return `${questions.length} Questions (${mcqCount} MCQ, ${textCount} Subjective)`;
                          } catch (e) {
                            return "Questions unavailable";
                          }
                        })()}
                      </span>
                    </div>
                    
                    {/* Assignment status */}
                    <div className="flex items-center text-gray-500 text-sm mb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      <span>
                        {(() => {
                          const assignmentsForTest = testAssignments.filter(a => a.testId === test.id);
                          return `Assigned to ${assignmentsForTest.length} students`;
                        })()}
                      </span>
                    </div>
                    
                    {/* Completion status */}
                    <div className="flex items-center text-gray-500 text-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                      <span>
                        {(() => {
                          const assignmentsForTest = testAssignments.filter(a => a.testId === test.id);
                          const completedCount = assignmentsForTest.filter(a => a.status === "completed").length;
                          const pendingCount = assignmentsForTest.length - completedCount;
                          return `${completedCount} Completed, ${pendingCount} Pending`;
                        })()}
                      </span>
                    </div>
                  </CardContent>
                  <div className="p-5 bg-gray-50 flex justify-between">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-primary hover:text-indigo-700"
                      onClick={() => handleViewTest(test)}
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      <span>View Details</span>
                    </Button>
                    <div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-500 hover:text-gray-700 mr-3"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-danger hover:text-red-700"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Test</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this test? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-600 hover:bg-red-700"
                              onClick={() => handleDeleteTest(test.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
          
          {/* Custom content for Pending Evaluation tab */}
          {activeTab === "pending" && (
            <Card className="mt-6">
              <CardHeader className="border-b px-5 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle className="font-heading font-semibold text-base">Tests Pending Review</CardTitle>
                <div className="w-full sm:w-64">
                  <Label htmlFor="filter-internship">Filter by Internship</Label>
                  <Select 
                    onValueChange={(value) => {
                      // Filter test assignments by internship
                      if (value === "all") {
                        fetchTestAssignments();
                      } else {
                        // Filter the existing assignments by internship ID
                        const filtered = testAssignments.filter(a => a.internshipId === value);
                        setTestAssignments(filtered);
                      }
                    }} 
                    defaultValue={""}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select internship" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Internships</SelectItem>
                      {internships.map((internship) => (
                        <SelectItem key={internship.id} value={internship.id}>
                          {internship.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b">
                        <TableHead>Student</TableHead>
                        <TableHead>Internship</TableHead>
                        <TableHead>Test</TableHead>
                        <TableHead>Completed On</TableHead>
                        <TableHead>Round</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {testAssignments.filter(a => a.status === "completed").length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            No tests pending review.
                          </TableCell>
                        </TableRow>
                      ) : (
                        testAssignments
                          .filter(a => a.status === "completed")
                          .map((assignment) => (
                            <TableRow key={assignment.id} className="hover:bg-gray-50">
                              <TableCell>
                                <div className="flex items-center">
                                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-primary mr-3">
                                    <span>{getInitials(getStudentName(assignment.studentId))}</span>
                                  </div>
                                  <span className="font-medium">{getStudentName(assignment.studentId)}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm">
                                {getInternshipTitle(assignment.internshipId)}
                              </TableCell>
                              <TableCell className="text-sm">
                                {getTestTitle(assignment.testId)}
                              </TableCell>
                              <TableCell className="text-sm text-gray-500">
                                {new Date(assignment.completedAt?.toDate() || Date.now()).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                  Round {assignment.application?.currentRound || 1}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-800">
                                  Pending Review
                                </span>
                              </TableCell>
                              <TableCell className="text-sm">
                                <div className="flex items-center">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-primary hover:text-indigo-800 hover:bg-indigo-50"
                                    onClick={() => handleOpenReview(assignment.id)}
                                    disabled={isLoadingReview && selectedTestAssignment === assignment.id}
                                  >
                                    {isLoadingReview && selectedTestAssignment === assignment.id ? (
                                      "Loading..."
                                    ) : (
                                      <>Review</>  
                                    )}
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Test Assignment Table for other tabs */}
          {activeTab !== "pending" && (
            <Card className="mt-6">
              <CardHeader className="border-b px-5 py-4">
                <CardTitle className="font-heading font-semibold text-base">Recent Test Assignments</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b">
                        <TableHead>Student</TableHead>
                        <TableHead>Internship</TableHead>
                        <TableHead>Test</TableHead>
                        <TableHead>Assigned Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {testAssignments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            No test assignments found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        testAssignments.slice(0, 5).map((assignment) => (
                          <TableRow key={assignment.id} className="hover:bg-gray-50">
                            <TableCell>
                              <div className="flex items-center">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-primary mr-3">
                                  <span>{getInitials(getStudentName(assignment.studentId))}</span>
                                </div>
                                <span className="font-medium">{getStudentName(assignment.studentId)}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">
                              {getInternshipTitle(assignment.internshipId)}
                            </TableCell>
                            <TableCell className="text-sm">
                              {getTestTitle(assignment.testId)}
                            </TableCell>
                            <TableCell className="text-sm text-gray-500">
                              {new Date(assignment.createdAt?.toDate() || Date.now()).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <span className={cn(
                                "px-2 py-1 rounded-full text-xs",
                                assignment.status === "completed" 
                                  ? "bg-green-100 text-green-800" 
                                  : assignment.status === "assigned"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-blue-100 text-blue-800"
                              )}>
                                {assignment.status === "completed" 
                                  ? "Completed" 
                                  : assignment.status === "assigned"
                                  ? "Not Started"
                                  : "In Progress"}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm">
                              <div className="flex items-center">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-primary hover:text-indigo-800 mr-3"
                                >
                                  <EyeIcon className="h-4 w-4" />
                                </Button>
                                {assignment.status === "completed" ? (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-success hover:text-green-700"
                                    onClick={() => handleOpenReview(assignment.id)}
                                  >
                                    <CheckCircleIcon className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-danger hover:text-red-700"
                                    onClick={() => handleDeleteTestAssignment(assignment.id)}
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                <div className="p-4 text-center">
                  <Button variant="link" className="text-primary hover:text-indigo-700">
                    View All Test Assignments
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Pending Reviews Tab */}
          {activeTab === "pendingReviews" && (
            <Card>
              <CardHeader>
                <CardTitle>Quiz Submissions Pending Review</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingPendingSubmissions ? (
                  <p>Loading pending submissions...</p>
                ) : pendingSubmissions.length === 0 ? (
                  <p>No quiz submissions are currently pending review.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Test Name</TableHead>
                        <TableHead>Internship</TableHead>
                        <TableHead>Submitted At</TableHead>
                        <TableHead>Score (%)</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingSubmissions.map((submission) => (
                        <TableRow key={submission.id}>
                          <TableCell>{submission.fetchedStudentFullName}</TableCell>
                          <TableCell>{submission.testName || submission.testId}</TableCell>
                          <TableCell>{submission.internshipTitle || submission.internshipId}</TableCell>
                          <TableCell>
                            {submission.submittedAt?.toDate ? new Date(submission.submittedAt.toDate()).toLocaleString() : 'N/A'}
                          </TableCell>
                          <TableCell>{submission.percentage}%</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => viewSubmission(submission.id)}
                                className="flex items-center gap-2"
                              >
                                <EyeIcon className="h-4 w-4" />
                                <span>View Answers</span>
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleReviewSubmission(submission)}
                              >
                                <CheckCircleIcon className="mr-2 h-4 w-4" /> Review
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
          
          {/* Pending Evaluations Tab */}
          {activeTab === "pending-evaluations" && (
            <Card>
              <CardHeader>
                <CardTitle>Internships for Evaluation</CardTitle>
                <CardDescription>
                  All active internships are shown below. Internships with pending quiz submissions are highlighted.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingEvaluations ? (
                  <p>Loading internships...</p>
                ) : internshipsForEvaluation.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    {internshipsForEvaluation.map((internship: Internship & { hasSubmissions: boolean; }) => (
                      <Card 
                        key={internship.id} 
                        onClick={() => setLocation(`/superadmin/evaluate-internship/${internship.id}`)} 
                        className={`cursor-pointer hover:shadow-lg transition-shadow ${internship.hasSubmissions ? 'border-primary border-2' : ''}`}
                      >
                        <CardHeader className={internship.hasSubmissions ? 'bg-primary/10' : ''}>
                          <div className="flex justify-between items-center">
                            <CardTitle>{internship.title}</CardTitle>
                            {internship.hasSubmissions && (
                              <Badge variant="outline" className="bg-primary text-primary-foreground">
                                Pending Review
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-2">{internship.companyName}</p>
                          {internship.hasSubmissions ? (
                            <p className="text-sm font-medium text-primary">Has quiz submissions awaiting review</p>
                          ) : (
                            <p className="text-sm text-muted-foreground">No pending quiz submissions for this internship</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p>No active internships found.</p>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Test Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Review Test</DialogTitle>
            <DialogDescription>
              Review the test submitted by the student.
            </DialogDescription>
          </DialogHeader>
          {testReviewDetails && (
            <TestReviewDialog 
              testDetails={testReviewDetails}
              onApprove={async (feedback, advanceToNextRound) => {
                if (selectedTestAssignment) {
                  try {
                    const result = await approveTestResult(selectedTestAssignment, feedback, advanceToNextRound);
                    const roundInfo = advanceToNextRound 
                      ? `The student has been advanced to Round ${result.application.currentRound}.`
                      : "The student has been selected for the internship.";
                      
                    toast({
                      title: "Test approved",
                      description: `The test has been approved successfully. ${roundInfo}`
                    });
                    // Refresh the assignments list
                    fetchTestAssignments();
                    setShowReviewDialog(false);
                  } catch (error: any) {
                    toast({
                      variant: "destructive",
                      title: "Error approving test",
                      description: error.message || handleFirebaseError(error)
                    });
                  }
                }
              }}
              onReject={async (feedback) => {
                if (selectedTestAssignment) {
                  try {
                    await rejectTestResult(selectedTestAssignment, feedback);
                    toast({
                      title: "Test rejected",
                      description: "The test has been rejected successfully."
                    });
                    // Refresh the assignments list
                    fetchTestAssignments();
                    setShowReviewDialog(false);
                  } catch (error: any) {
                    toast({
                      variant: "destructive",
                      title: "Error rejecting test",
                      description: error.message || handleFirebaseError(error)
                    });
                  }
                }
              }}
              onClose={() => setShowReviewDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Create Test Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Test</DialogTitle>
            <DialogDescription>
              Create a new test for internship applicants.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...createTestForm}>
            <form onSubmit={createTestForm.handleSubmit(handleCreateTest)} className="space-y-4">
              <FormField
                control={createTestForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Test Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Web Development Test" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createTestForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe what this test will evaluate" 
                        {...field} 
                        className="min-h-[80px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createTestForm.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (minutes)</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createTestForm.control}
                name="questions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Questions (JSON format)</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        className="min-h-[250px] font-mono text-sm"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="mt-6">
                <Button
                  type="submit"
                  className="bg-primary hover:bg-indigo-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creating..." : "Create Test"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Assign Test Dialog */}
      <Dialog open={showAssignForm} onOpenChange={setShowAssignForm}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Assign Test to Applicants</DialogTitle>
            <DialogDescription>
              Assign a test to students who have applied for an internship.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...assignTestForm}>
            <form onSubmit={assignTestForm.handleSubmit(handleAssignTest)} className="space-y-4">
              <FormField
                control={assignTestForm.control}
                name="internshipId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Internship</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Reset student selection when internship changes
                        assignTestForm.setValue("studentIds", []);
                        // Fetch applications for this internship
                        fetchApplicationsForInternship(value);
                      }} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an internship" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {internships.map((internship) => (
                          <SelectItem key={internship.id} value={internship.id}>
                            {internship.title} at {internship.companyName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={assignTestForm.control}
                name="testId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Test</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a test" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tests.map(test => (
                          <SelectItem key={test.id} value={test.id}>
                            {test.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={assignTestForm.control}
                name="studentIds"
                render={({ field }) => {
                  // Get the selected internship
                  const selectedInternshipId = assignTestForm.getValues().internshipId;
                  
                  // Check if a student already has a test assigned for this internship
                  const hasTestAssigned = (studentId: string) => {
                    const application = internshipApplications.find((app) => app.studentId === studentId);
                    if (!application) return false;
                    
                    // Check if test is already assigned or if the application is not in a valid status for test assignment
                    if (application.status !== 'form_submitted' && application.status !== 'form_approved') {
                      return true; // Not eligible for test assignment
                    }
                    
                    return testAssignments.some(assignment => 
                      assignment.applicationId === application.id
                    );
                  };
                  
                  // Get available students (those without tests assigned)
                  const availableApplications = internshipApplications.filter(
                    app => !hasTestAssigned(app.studentId)
                  );
                  
                  // Handle select all checkbox
                  const handleSelectAll = (checked: boolean | 'indeterminate') => {
                    if (checked === true) {
                      // Select all students who don't already have a test assigned
                      const availableStudentIds = availableApplications.map(app => app.studentId);
                      field.onChange(availableStudentIds);
                    } else {
                      // Deselect all
                      field.onChange([]);
                    }
                  };
                  
                  // Handle individual checkbox change
                  const handleCheckboxChange = (studentId: string, checked: boolean) => {
                    const currentValues = [...field.value];
                    if (checked) {
                      if (!currentValues.includes(studentId)) {
                        field.onChange([...currentValues, studentId]);
                      }
                    } else {
                      field.onChange(currentValues.filter(id => id !== studentId));
                    }
                  };
                  
                  // Calculate if all available students are selected
                  const allAvailableSelected = 
                    availableApplications.length > 0 && 
                    availableApplications.every(app => field.value.includes(app.studentId));
                  
                  return (
                    <FormItem>
                      <div className="space-y-2">
                        <FormLabel>Select Students</FormLabel>
                        <FormDescription>
                          Select students who have applied to this internship.
                        </FormDescription>
                        
                        {isLoadingApplications ? (
                          <div className="text-center p-8 border rounded-md">
                            <div className="flex items-center justify-center space-x-2">
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                              <p className="text-sm text-muted-foreground">Loading applications...</p>
                            </div>
                          </div>
                        ) : internshipApplications.length > 0 ? (
                          <div className="border rounded-md p-4 space-y-4">
                            {/* Select All Checkbox */}
                            <div className="flex items-center justify-between pb-2 border-b">
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id="select-all" 
                                  checked={allAvailableSelected}
                                  onCheckedChange={handleSelectAll}
                                />
                                <label 
                                  htmlFor="select-all"
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  Select All Available Students
                                </label>
                              </div>
                              <span className="text-xs text-gray-500">
                                {availableApplications.length} student{availableApplications.length !== 1 ? 's' : ''} available
                              </span>
                            </div>
                            
                            {/* Student Checkboxes */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {internshipApplications.map(application => {
                                const isDisabled = hasTestAssigned(application.studentId);
                                return (
                                  <div key={application.studentId} className="flex items-center space-x-3">
                                    <Checkbox 
                                      id={`student-${application.studentId}`} 
                                      checked={field.value.includes(application.studentId)}
                                      onCheckedChange={(checked: boolean | 'indeterminate') => 
                                        handleCheckboxChange(application.studentId, checked === true)
                                      }
                                      disabled={isDisabled}
                                    />
                                    <div className="flex flex-col">
                                      <div className="flex items-center gap-2">
                                        <label 
                                          htmlFor={`student-${application.studentId}`}
                                          className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed ${isDisabled ? 'opacity-50' : ''}`}
                                        >
                                          {application.studentName || 'Unknown Student'}
                                        </label>
                                        <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusBadgeColor(application.status)}`}>
                                          {formatStatusLabel(application.status)}
                                        </span>
                                      </div>
                                      <span className="text-xs text-gray-500">
                                        {application.studentEmail || 'No email available'}
                                      </span>
                                    </div>
                                    {isDisabled && (
                                      <span className="text-xs text-amber-600">(Test assigned)</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : selectedInternshipId ? (
                          <div className="text-center p-4 border rounded-md text-muted-foreground">
                            No students have applied to this internship yet.
                          </div>
                        ) : (
                          <div className="text-center p-4 border rounded-md text-muted-foreground">
                            Please select an internship first.
                          </div>
                        )}
                        <FormMessage />
                      </div>
                    </FormItem>
                  );
                }}
              />
              
              <DialogFooter className="mt-6">
                <Button
                  type="submit"
                  className="bg-primary hover:bg-indigo-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Assigning..." : "Assign Test"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAssignForm(false)}
                >
                  Cancel
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* View Test Details Dialog */}
      <Dialog open={showTestDetails} onOpenChange={setShowTestDetails}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Test Details</DialogTitle>
          </DialogHeader>
          
          {selectedTest && (
            <div className="space-y-5">
              <div>
                <h3 className="font-semibold text-lg">{selectedTest.title}</h3>
                <div className="flex items-center mt-2 space-x-4">
                  <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                    {selectedTest.status || "Active"}
                  </span>
                  <div className="flex items-center text-sm text-gray-600">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    <span>Total Duration: {selectedTest.duration} minutes</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
                <p className="text-sm">{selectedTest.description}</p>
              </div>
              
              <div>
                <h4 className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  Questions & Answer Key
                  <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                    Correct answers highlighted
                  </span>
                </h4>
                {formatQuestions(selectedTest.questions)}
              </div>
              
              <div className="mt-2 text-xs text-gray-500">
                <p>* Question timing settings will be enforced during test taking.</p>
                <p>* Correct answers are only visible to admins and will not be shown to students.</p>
              </div>
              
              <DialogFooter className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowTestDetails(false)}
                >
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Test Review Dialog for pending submissions */}
      <Dialog open={!!selectedSubmissionForReview} onOpenChange={() => setSelectedSubmissionForReview(null)}>
        <DialogContent className="sm:max-w-[600px]"> 
          <DialogHeader>
            <DialogTitle>Review Quiz Submission</DialogTitle>
            <DialogDescription>
              Review the student's quiz submission and approve or reject it.
            </DialogDescription>
          </DialogHeader>
          {selectedSubmissionForReview && ( 
            <TestReviewDialog
              testDetails={selectedSubmissionForReview}
              onApprove={async (feedback: string, advanceToNextRound: boolean) => {
                if (!selectedSubmissionForReview?.id) return;
                try {
                  const db = getFirestore();
                  
                  // Start a batch to update both documents atomically
                  const batch = writeBatch(db);
                  
                  // Update the quiz submission
                  const submissionRef = doc(db, "quizSubmissions", selectedSubmissionForReview.id);
                  batch.update(submissionRef, {
                    status: "approved",
                    feedback: feedback || "",
                    reviewedAt: serverTimestamp(),
                    reviewedBy: auth.currentUser?.uid || 'unknown'
                  });
                  
                  // Also update the corresponding application document
                  if (selectedSubmissionForReview.applicationId && selectedSubmissionForReview.internshipId) {
                    const applicationRef = doc(
                      db, 
                      "internships", 
                      selectedSubmissionForReview.internshipId, 
                      "applications", 
                      selectedSubmissionForReview.applicationId
                    );
                    
                    // Update application status based on whether to advance to next round
                    batch.update(applicationRef, {
                      status: advanceToNextRound ? "selected" : "form_approved" as ApplicationStatus,
                      updatedAt: serverTimestamp()
                    });
                  }
                  
                  // Commit both updates
                  await batch.commit();
                  
                  toast({ 
                    title: "Submission Approved", 
                    description: advanceToNextRound 
                      ? "The student has been advanced to Round ${result.application.currentRound}."
                      : "The student has been selected for the internship.",
                  });
                  setSelectedSubmissionForReview(null);
                  fetchPendingSubmissions(); // Refresh list
                } catch (error: any) {
                  console.error("Error approving submission:", error);
                  toast({
                    title: "Error Approving Submission",
                    description: handleFirebaseError(error),
                    variant: "destructive",
                  });
                }
              }}
              onReject={async (feedback: string) => {
                if (!selectedSubmissionForReview?.id) return;
                const submissionId = selectedSubmissionForReview.id;
                try {
                  const db = getFirestore();
                  
                  // Start a batch to update both documents atomically
                  const batch = writeBatch(db);
                  
                  // Update the quiz submission
                  const submissionRef = doc(db, "quizSubmissions", submissionId);
                  batch.update(submissionRef, {
                    status: "rejected",
                    feedback: feedback || "", // Store feedback or empty string
                    reviewedAt: serverTimestamp(),
                    reviewedBy: auth.currentUser?.uid || 'unknown'
                  });
                  
                  // Also update the corresponding application document
                  if (selectedSubmissionForReview.applicationId && selectedSubmissionForReview.internshipId) {
                    const applicationRef = doc(
                      db, 
                      "internships", 
                      selectedSubmissionForReview.internshipId, 
                      "applications", 
                      selectedSubmissionForReview.applicationId
                    );
                    
                    // Update application status to rejected
                    batch.update(applicationRef, {
                      status: "rejected" as ApplicationStatus,
                      updatedAt: serverTimestamp()
                    });
                  }
                  
                  // Commit both updates
                  await batch.commit();
                  
                  toast({ 
                    title: "Submission Rejected", 
                    description: "The student's quiz submission has been rejected and their application has been updated.",
                    variant: "default" // Or a specific variant for rejection if you have one
                  });
                  setSelectedSubmissionForReview(null); 
                  fetchPendingSubmissions(); // Refresh list
                } catch (error: any) {
                  console.error("Error rejecting submission:", error);
                  toast({
                    title: "Error Rejecting Submission",
                    description: handleFirebaseError(error),
                    variant: "destructive",
                  });
                }
              }}
              onClose={() => setSelectedSubmissionForReview(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Quiz Answers Dialog */}
      <Dialog open={showQuizAnswersDialog} onOpenChange={setShowQuizAnswersDialog}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Quiz Answers</DialogTitle>
            <DialogDescription>
              Review the student's quiz answers and question correctness.
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingQuizDetails ? (
            <div className="flex justify-center items-center p-8">
              <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading quiz details...</span>
            </div>
          ) : selectedQuizSubmission ? (
            <div className="space-y-6 max-h-[70vh] overflow-y-auto p-4">
              <div className="flex flex-col md:flex-row justify-between gap-4 border-b pb-4">
                <div>
                  <h3 className="font-semibold text-lg">{selectedQuizSubmission.testName || 'Quiz'}</h3>
                  <p className="text-sm text-gray-500">
                    Submitted on {selectedQuizSubmission.submittedAt?.toDate 
                      ? new Date(selectedQuizSubmission.submittedAt.toDate()).toLocaleString() 
                      : 'Unknown date'}
                  </p>
                </div>
                <div className="flex items-center">
                  <div className="text-right">
                    <p className="text-sm font-medium">Score</p>
                    <p className="text-2xl font-bold text-primary">{selectedQuizSubmission.percentage || 0}%</p>
                  </div>
                </div>
              </div>
              
              {/* Questions and Answers */}
              {selectedQuizSubmission.answers && selectedQuizSubmission.answers.map((answer: any, index: number) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-base">Question {index + 1}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs ${answer.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {answer.isCorrect ? 'Correct' : 'Incorrect'}
                    </span>
                  </div>
                  <p className="mb-4">{answer.question}</p>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Student's Answer:</p>
                    <div className="bg-gray-50 p-3 rounded border">
                      {answer.selectedAnswer || 'No answer provided'}
                    </div>
                    
                    {!answer.isCorrect && (
                      <>
                        <p className="text-sm font-medium text-green-700 mt-2">Correct Answer:</p>
                        <div className="bg-green-50 p-3 rounded border border-green-200">
                          {answer.correctAnswer || 'Not available'}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
              
              {(!selectedQuizSubmission.answers || selectedQuizSubmission.answers.length === 0) && (
                <div className="text-center p-8 border rounded-lg">
                  <p className="text-gray-500">No answer data available for this quiz submission.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center p-8">
              <p className="text-gray-500">No quiz submission selected.</p>
            </div>
          )}
          
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowQuizAnswersDialog(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {submissionViewer.show && submissionViewer.data && (
        <Dialog open={submissionViewer.show} onOpenChange={(open) => setSubmissionViewer(prev => ({ ...prev, show: open }))}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Quiz Submission</DialogTitle>
              <DialogDescription>
                {submissionViewer.data.metadata.studentName} - {submissionViewer.data.metadata.testName}
                <br />
                Score: {submissionViewer.data.metadata.score} | Submitted: {submissionViewer.data.metadata.submittedAt}
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="answers">
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="answers">Answers</TabsTrigger>
                <TabsTrigger value="raw">Raw Data</TabsTrigger>
                <TabsTrigger value="logs">Debug Logs</TabsTrigger>
              </TabsList>

              <TabsContent value="answers" className="mt-4">
                <div className="space-y-4">
                  {submissionViewer.data.answers.map((answer, i) => (
                    <Card key={i} className={answer.isCorrect ? 'border-green-200' : 'border-red-200'}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">Q{i + 1}: {answer.question}</CardTitle>
                          <div className="flex gap-2 items-center">
                            <Badge variant={answer.isCorrect ? 'default' : 'destructive'}>
                              {answer.isCorrect ? 'Correct' : 'Incorrect'} ({answer.points}pt)
                            </Badge>
                            <Badge variant="outline">{answer.type.toUpperCase()}</Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-1">
                          <p className="font-medium text-sm">STUDENT ANSWER:</p>
                          <div className="p-3 bg-gray-50 rounded-md">
                            {answer.type === 'mcq' && answer.options ? (
                              <div className="space-y-2">
                                {answer.options.map((opt: string, idx: number) => (
                                  <div 
                                    key={idx}
                                    className={`p-2 rounded ${idx === answer.selectedIndex ? 
                                      (answer.isCorrect ? 'bg-green-100' : 'bg-red-100') : 
                                      (idx === answer.correctAnswerIndex ? 'bg-blue-50' : '')}`}
                                  >
                                    {opt}
                                    {idx === answer.correctAnswerIndex && !answer.isCorrect && (
                                      <span className="ml-2 text-blue-600 text-xs">(Correct Answer)</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p>{answer.studentAnswer}</p>
                            )}
                          </div>
                        </div>
                        
                        {!answer.isCorrect && answer.type !== 'mcq' && (
                          <div className="space-y-1">
                            <p className="font-medium text-sm">CORRECT ANSWER:</p>
                            <div className="p-3 bg-blue-50 rounded-md">
                              <p>{answer.correctAnswer}</p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="raw" className="mt-4">
                <pre className="text-xs p-4 bg-gray-100 rounded-md overflow-auto">
                  {JSON.stringify(submissionViewer.data.rawData, null, 2)}
                </pre>
              </TabsContent>

              <TabsContent value="logs" className="mt-4">
                <div className="text-xs font-mono p-4 bg-black text-green-400 rounded-md h-64 overflow-auto">
                  {debugLogs.map((log, i) => (
                    <p key={i}>{log}</p>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
