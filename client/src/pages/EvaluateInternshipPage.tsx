import React, { useEffect, useState, useCallback } from 'react';
import { useRoute, Link } from 'wouter'; 
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button'; 
import { Badge } from "@/components/ui/badge";
import { getFirestore, doc, getDoc, updateDoc, collection, query, where, getDocs, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { getApplicationsByInternship, getStudentList } from '@/lib/firebase'; 
import { Internship, Application, Student, ApplicationStatus, ApplicationRound, QuizSubmission, Test, TestQuestion, QuizQuestion as DisplayableQuizQuestion } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import TestReviewDialog from "@/components/tests/TestReviewDialog";
import { Textarea } from "@/components/ui/textarea";

interface RouteParams {
  internshipId?: string;
}

// Define a type for Round 2 submission data (mirroring Round2Form.tsx structure if possible)
interface Round2SubmissionData {
  applicationId: string;
  internshipId: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  internshipTitle?: string;
  companyName?: string;
  formData: {
    projectExperience?: string;
    technicalSkills?: string;
    teamworkExperience?: string;
    challengesSolved?: string;
    careerGoals?: string;
    additionalInfo?: string;
    [key: string]: any; // Allow other fields
  };
  submittedAt: any; // Firestore Timestamp
  status: string; // e.g., 'pending_review'
  id?: string; // Document ID from Firestore
}

const EvaluateInternshipPage = () => {
  const [match, params] = useRoute("/superadmin/evaluate-internship/:internshipId");
  const internshipId = match && params?.internshipId ? String(params.internshipId) : undefined;
  const { toast } = useToast();

  const [internshipDetails, setInternshipDetails] = useState<Internship | null>(null);
  // Round 1 (Quiz Completed) Applications
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoadingApplications, setIsLoadingApplications] = useState(true);
  
  // Round 2 (Form Submitted) Applications
  const [round2Applications, setRound2Applications] = useState<Application[]>([]);
  const [isLoadingRound2Applications, setIsLoadingRound2Applications] = useState(true);

  const [studentsMap, setStudentsMap] = useState<Map<string, Student>>(new Map());
  const [isLoadingInternship, setIsLoadingInternship] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Quiz Dialog (Round 1)
  const [showQuizDialog, setShowQuizDialog] = useState(false);
  const [selectedQuizSubmission, setSelectedQuizSubmission] = useState<QuizSubmission | null>(null);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);
  
  // State for quiz answers dialog
  const [showQuizAnswersDialog, setShowQuizAnswersDialog] = useState(false);
  const [selectedQuizForAnswers, setSelectedQuizForAnswers] = useState<QuizSubmission | null>(null);
  const [isLoadingQuizAnswers, setIsLoadingQuizAnswers] = useState(false);

  // Feedback Dialog for Round 1 decisions
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [feedbackActionType, setFeedbackActionType] = useState<'proceed' | 'reject' | null>(null);
  const [feedbackApplicationId, setFeedbackApplicationId] = useState<string | null>(null);
  const [round1Feedback, setRound1Feedback] = useState("");

  // Dialog for viewing Round 1 Submission Details
  const [showRound1DetailsDialog, setShowRound1DetailsDialog] = useState(false);
  const [selectedRound1Data, setSelectedRound1Data] = useState<any>(null);
  const [isLoadingRound1Details, setIsLoadingRound1Details] = useState(false);

  // Dialog for viewing Round 2 Submission Details
  const [showRound2DetailsDialog, setShowRound2DetailsDialog] = useState(false);
  const [selectedRound2Data, setSelectedRound2Data] = useState<Round2SubmissionData | null>(null);
  const [isLoadingRound2Details, setIsLoadingRound2Details] = useState(false);

  // Feedback Dialog for Round 2 decisions
  const [showRound2DecisionDialog, setShowRound2DecisionDialog] = useState(false);
  const [round2DecisionActionType, setRound2DecisionActionType] = useState<'r2_approve' | 'r2_reject' | null>(null);
  const [round2DecisionApplicationId, setRound2DecisionApplicationId] = useState<string | null>(null);
  const [round2DecisionFeedbackText, setRound2DecisionFeedbackText] = useState("");


  // Helper function to fetch students for a list of applications and update studentsMap
  const fetchStudentsForApplications = useCallback(async (appsToFetchFor: Application[]) => {
    if (appsToFetchFor.length === 0) return;
    const db = getFirestore();
    const existingStudentIds = new Set(studentsMap.keys());
    const studentIdsToFetch = Array.from(
      new Set(appsToFetchFor.map(app => app.studentId).filter(id => !existingStudentIds.has(id)))
    );

    if (studentIdsToFetch.length === 0) return;

    try {
      const studentPromises = studentIdsToFetch.map(id => getDoc(doc(db, 'students', id)));
      const studentDocs = await Promise.all(studentPromises);
      
      setStudentsMap(prevMap => {
        const newMap = new Map(prevMap);
        studentDocs.forEach(docSnap => {
          if (docSnap.exists()) {
            newMap.set(docSnap.id, { id: docSnap.id, ...docSnap.data() } as Student);
          }
        });
        return newMap;
      });
    } catch (error: any) {
      console.error("Error fetching student details:", error);
      toast({ title: "Error", description: "Could not load some student details.", variant: "destructive" });
    }
  }, [studentsMap, toast]);

  useEffect(() => {
    if (!internshipId) {
      setApplications([]);
      setRound2Applications([]);
      return;
    }

    const db = getFirestore();

    const fetchInternship = async () => {
      setIsLoadingInternship(true);
      try {
        const internshipRef = doc(db, 'internships', internshipId);
        const docSnap = await getDoc(internshipRef);
        if (docSnap.exists()) {
          setInternshipDetails({ id: docSnap.id, ...docSnap.data() } as Internship);
        } else {
          toast({ title: "Error", description: "Internship not found.", variant: "destructive" });
          setInternshipDetails(null);
        }
      } catch (error: any) {
        console.error("Error fetching internship details:", error);
        toast({ title: "Error", description: "Could not load internship details.", variant: "destructive" });
      } finally {
        setIsLoadingInternship(false);
      }
    };

    fetchInternship();

    // Listener for Round 1 (form_submitted) applications
    setIsLoadingApplications(true);
    const r1Query = query(
      collection(db, "internships", internshipId, "applications"),
      where("status", "==", "form_submitted")
    );
    const unsubscribeR1 = onSnapshot(r1Query, (snapshot) => {
      const updatedApps = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Application));
      setApplications(updatedApps);
      fetchStudentsForApplications(updatedApps);
      setIsLoadingApplications(false);
    }, (error: any) => {
      console.error("[EvaluateInternshipPage] Error in R1 applications listener:", error);
      setIsLoadingApplications(false);
    });

    // Listener for Round 2 (quiz_completed) applications
    setIsLoadingRound2Applications(true);
    const r2Query = query(
      collection(db, "internships", internshipId, "applications"),
      where("status", "==", "quiz_completed")
    );
    const unsubscribeR2 = onSnapshot(r2Query, (snapshot) => {
      const updatedApps = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Application));
      setRound2Applications(updatedApps);
      fetchStudentsForApplications(updatedApps);
      setIsLoadingRound2Applications(false);
    }, (error: any) => {
      console.error("[EvaluateInternshipPage] Error in R2 applications listener:", error);
      setIsLoadingRound2Applications(false);
    });

    return () => {
      unsubscribeR1();
      unsubscribeR2();
    };
  }, [internshipId, toast, fetchStudentsForApplications]);

  const updateApplicationRounds = (
    rounds: ApplicationRound[], 
    roundNumber: number, 
    status: 'passed' | 'failed', 
    feedback?: string, 
    evaluatedBy?: string
  ): ApplicationRound[] => {
    const clientTimestamp = new Date(); 
    const roundIndex = rounds.findIndex(r => r.roundNumber === roundNumber);
    if (roundIndex !== -1) {
      const updatedRounds = [...rounds];
      updatedRounds[roundIndex] = {
        ...updatedRounds[roundIndex],
        status,
        feedback: feedback || updatedRounds[roundIndex].feedback, 
        evaluatedAt: clientTimestamp, 
        evaluatedBy: evaluatedBy || "superadmin", 
      };
      return updatedRounds;
    } else {
      return [
        ...rounds,
        {
          roundNumber,
          status,
          feedback, 
          evaluatedAt: clientTimestamp, 
          evaluatedBy: evaluatedBy || "superadmin",
        }
      ];
    }
  };

  // Handles proceeding from Round 1 (form) to Round 2 (quiz) stage
  const handleProceedToRound2Form = async (applicationId: string, feedback?: string) => {
    if (!internshipId) return toast({ title: "Error", description: "Internship ID missing.", variant: "destructive" });
    setIsProcessing(true);
    const db = getFirestore();
    const appRef = doc(db, "internships", internshipId, "applications", applicationId);
    try {
      const appDoc = await getDoc(appRef);
      if (!appDoc.exists()) throw new Error("Application not found.");
      const currentApp = appDoc.data() as Application;
      const dataToUpdate = {
        status: 'form_approved' as ApplicationStatus, // Updated to form_approved to match new workflow
        currentRound: 2,
        rounds: updateApplicationRounds(currentApp.rounds || [], 1, 'passed', feedback),
        updatedAt: serverTimestamp(), 
      };
      await updateDoc(appRef, dataToUpdate);
      toast({ title: "Success", description: "Form approved. Student can now proceed to Round 2 quiz." });
      setApplications(prevApps => prevApps.filter(app => app.id !== applicationId)); // Optimistic update
    } catch (error: any) {
      console.error("Error approving form for Round 2:", error);
      toast({ title: "Error", description: `Could not update application: ${error.message}`, variant: "destructive" });
    } finally {
      setIsProcessing(false);
      setShowFeedbackDialog(false); // Close dialog
    }
  };

  // Handles rejecting application after Round 1
  const handleRejectApplicationRound1 = async (applicationId: string, feedback?: string) => {
    if (!internshipId) return toast({ title: "Error", description: "Internship ID missing.", variant: "destructive" });
    setIsProcessing(true);
    const db = getFirestore();
    const appRef = doc(db, "internships", internshipId, "applications", applicationId);
    try {
      const appDoc = await getDoc(appRef);
      if (!appDoc.exists()) throw new Error("Application not found.");
      const currentApp = appDoc.data() as Application;
      const dataToUpdate = {
        status: 'rejected_round1' as ApplicationStatus,
        rounds: updateApplicationRounds(currentApp.rounds || [], 1, 'failed', feedback),
        updatedAt: serverTimestamp(), 
      };
      await updateDoc(appRef, dataToUpdate);
      toast({ title: "Success", description: "Application rejected after Round 1." });
      setApplications(prevApps => prevApps.filter(app => app.id !== applicationId)); // Optimistic update
    } catch (error: any) {
      console.error("Error rejecting application post R1:", error);
      toast({ title: "Error", description: `Could not update application: ${error.message}`, variant: "destructive" });
    } finally {
      setIsProcessing(false);
      setShowFeedbackDialog(false); // Close dialog
    }
  };

  // Confirm feedback for Round 1 decisions
  const handleConfirmRound1Feedback = () => {
    if (!feedbackApplicationId || !feedbackActionType) return;
    if (feedbackActionType === 'proceed') {
      handleProceedToRound2Form(feedbackApplicationId, round1Feedback);
    } else if (feedbackActionType === 'reject') {
      handleRejectApplicationRound1(feedbackApplicationId, round1Feedback);
    }
    setRound1Feedback(""); // Reset feedback
  };

  const handleViewQuiz = async (application: Application) => {
    // In our new workflow, Round 1 is form submission and Round 2 is quiz
    // Display a more helpful message for Round 1 applications
    if (application.status === 'form_submitted') {
      toast({ 
        title: "Round 1 Form", 
        description: "This is a form submission for Round 1. Please review the form and either approve for Round 2 or reject.", 
        variant: "default" 
      });
      return;
    }
    
    // For Round 2 quiz submissions, check for quizSubmissionId
    if (!application.quizSubmissionId) {
      toast({ 
        title: "Error", 
        description: "Quiz submission ID not found. The student may not have completed the quiz yet.", 
        variant: "destructive" 
      });
      return;
    }
    
    setIsLoadingQuiz(true);
    try {
      const db = getFirestore();
      const quizRef = doc(db, 'quizSubmissions', application.quizSubmissionId);
      const quizDoc = await getDoc(quizRef);
      if (!quizDoc.exists()) throw new Error("Quiz submission not found.");
      setSelectedQuizSubmission({ id: quizDoc.id, ...quizDoc.data() } as QuizSubmission);
      setShowQuizDialog(true);
    } catch (error: any) {
      console.error("Error fetching quiz submission:", error);
      toast({ title: "Error", description: `Could not load quiz submission: ${error.message}`, variant: "destructive" });
    } finally {
      setIsLoadingQuiz(false);
    }
  };
  
  // View Round 1 Form Submission
  const handleViewRound1Submission = async (application: Application) => {
    if (application.status !== 'form_submitted') {
      toast({ 
        title: "Info", 
        description: "This is not a Round 1 form submission.", 
        variant: "default" 
      });
      return;
    }
    
    setIsLoadingRound1Details(true);
    try {
      // Create a formData object with all relevant fields
      const formData: Record<string, any> = {};
      
      // Add standard student info fields that are defined in the Application interface
      formData.fullName = application.studentName || '';
      formData.email = application.studentEmail || '';
      
      // Add resume and cover letter if available
      if (application.resume) formData.resume = application.resume;
      if (application.coverLetter) formData.coverLetter = application.coverLetter;
      
      // Use a type-safe approach to extract all properties from the application object
      // This will include any custom fields that might be in the Firestore document
      // but not explicitly defined in the TypeScript interface
      const appData = application as unknown as Record<string, any>;
      
      // List of standard application fields to exclude from form data display
      const excludedFields = ['id', 'studentId', 'internshipId', 'status', 'currentRound', 'rounds', 
        'appliedAt', 'updatedAt', 'quizSubmissionId', 'quizScore', 'quizCompletedAt', 'quizStatus', 
        'round2SubmissionId', 'round2FormData', 'selectedAt', 'studentName', 'studentEmail'];
      
      // Add all other fields from the application document that might be form data
      Object.keys(appData).forEach(key => {
        if (!excludedFields.includes(key) && appData[key] !== undefined && appData[key] !== null) {
          // Skip if we've already added this field
          if (!formData.hasOwnProperty(key)) {
            formData[key] = appData[key];
          }
        }
      });
      
      // Use the appData object to access potentially undefined fields like createdAt
      setSelectedRound1Data({
        id: application.id || '',
        formData: formData,
        submittedAt: appData.createdAt || application.updatedAt,
        status: application.status
      });
      
      setShowRound1DetailsDialog(true);
    } catch (error: any) {
      console.error("Error processing Round 1 form data:", error);
      toast({ 
        title: "Error", 
        description: `Could not load Round 1 details: ${error.message}`, 
        variant: "destructive" 
      });
    } finally {
      setIsLoadingRound1Details(false);
    }
  };
  
  // View Quiz Answers
  const handleViewQuizAnswers = async (application: Application) => {
    // After round swap, form submissions in Round 1 don't have quiz data
    if (application.status === 'form_submitted') {
      toast({ 
        title: "Round 1 Form", 
        description: "This is a form submission for Round 1. Quiz answers are only available after the student completes Round 2.", 
        variant: "default" 
      });
      return;
    }
    
    setIsLoadingQuizAnswers(true);
    try {
      // First, check if quiz answers are available directly in application data
      // Type assertion to handle potential missing property
      const appWithQuiz = application as Application & { quizProgress?: { answers: Record<string, string> } };
      if (appWithQuiz.quizProgress && appWithQuiz.quizProgress.answers) {
        // Create a QuizSubmission object from application data
        const quizData = {
          id: application.quizSubmissionId || `app-${application.id}-quiz`,
          applicationId: application.id,
          internshipId: application.internshipId,
          studentId: application.studentId,
          testId: application.testId || '',
          score: 0,
          totalPossiblePoints: 0,
          percentage: 0,
          questions: Object.values(appWithQuiz.quizProgress.answers).map((answer, index) => ({
            id: index + 1,
            text: `Question ${index + 1}`,
            options: [],
            selectedOption: -1,
            userAnswer: answer,
            type: 'text',
            correct: false
          })),
          questionData: [],
          submittedAt: application.updatedAt || application.appliedAt || new Date().toISOString(),
          status: 'pending' as const,
          _debug: { source: 'ApplicationData', answerCount: Object.values(appWithQuiz.quizProgress.answers).length }
        } as QuizSubmission;
        console.log("[DEBUG] Quiz data from application:", JSON.stringify(quizData, null, 2));
        setSelectedQuizForAnswers(quizData);
        setShowQuizAnswersDialog(true);
        console.log("[DEBUG] Dialog should be opening now with data from application");
        return;
      }
      
      // If not in application data, fetch from Firestore (preferred source)
      if (application.quizSubmissionId) {
        const db = getFirestore();
        const quizRef = doc(db, 'quizSubmissions', application.quizSubmissionId);
        const quizDoc = await getDoc(quizRef);
        if (quizDoc.exists()) {
          const quizSubmission = { id: quizDoc.id, ...quizDoc.data() } as QuizSubmission;
          console.log("[DEBUG] Loaded quiz submission from Firestore:", JSON.stringify(quizSubmission, null, 2));
          
          // Maintain both questionData (original) and questions (transformed)
          const questionData = quizSubmission.questionData || [];
          const questions = questionData.map((q, index) => {
            const isMCQ = q.type === 'mcq';
            const userAnswer = q.userAnswer || q.user_answer || q.answer || q.textAnswer || '';
            return {
              id: q.id || index + 1,
              text: q.question || q.text || `Question ${index + 1}`,
              options: q.options || [],
              selectedOption: isMCQ && userAnswer && q.options ? q.options.indexOf(userAnswer) : (q.selectedOption || -1),
              userAnswer,
              type: q.type || q.questionType || 'text',
              correctOption: q.correctAnswer !== undefined ? (typeof q.correctAnswer === 'number' ? q.correctAnswer : (q.options ? q.options.indexOf(q.correctAnswer) : undefined)) : q.correctOption,
              correct: q.isCorrect !== undefined ? q.isCorrect : q.correct,
              _debug: { source: 'Firestore', index }
            };
          });
          
          const transformedQuizSubmission = {
            ...quizSubmission,
            questionData,
            questions,
            _debug: { source: 'Firestore', questionCount: questions.length }
          };
          console.log("[DEBUG] Transformed quiz submission:", JSON.stringify(transformedQuizSubmission, null, 2));
          setSelectedQuizForAnswers(transformedQuizSubmission);
          setShowQuizAnswersDialog(true);
          console.log("[DEBUG] Dialog should be opening now with data from Firestore");
          return;
        } else {
          console.warn("[DEBUG] Quiz submission document not found in Firestore:", application.quizSubmissionId);
          toast({ 
            title: "Error", 
            description: "Quiz answers not found. The student may not have completed the quiz yet.", 
            variant: "destructive" 
          });
        }
      } else {
        console.warn("[DEBUG] No quizSubmissionId available for application:", application.id);
        toast({ 
          title: "Error", 
          description: "Quiz answers not found. The student may not have completed the quiz yet.", 
          variant: "destructive" 
        });
      }
    } catch (error: any) {
      console.error("Error fetching quiz answers:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load quiz answers due to a technical error.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingQuizAnswers(false);
    }
  };

// View Round 2 Submission Details
const handleViewRound2Submission = async (application: Application) => {
  if (!application.round2SubmissionId && !application.round2FormData) {
    return toast({ 
      title: "Info", 
      description: "Round 2 submission details not found for this application.", 
      variant: "default" 
    });
  }
  setIsLoadingRound2Details(true);
  try {
    // First try to get from quizSubmissions collection (now Round 2)
    if (application.quizSubmissionId) {
      const db = getFirestore();
      const r2SubRef = doc(db, 'quizSubmissions', application.quizSubmissionId);
      const r2SubDoc = await getDoc(r2SubRef);
      if (r2SubDoc.exists()) {
        const data = r2SubDoc.data();
        console.log('Round2 submission data from Firestore:', data);
        
        // Create formData object from the submission fields
        // In Round2Form.jsx, the form fields are stored directly in the document
        // rather than in a nested formData object
        const formData = {
          projectExperience: data.projectExperience || '',
          technicalSkills: data.technicalSkills || '',
          teamworkExperience: data.teamworkExperience || '',
          challengesSolved: data.challengesSolved || '',
          careerGoals: data.careerGoals || '',
          additionalInfo: data.additionalInfo || ''
        };
        
        console.log('Constructed formData from submission fields:', formData);
        
        setSelectedRound2Data({ 
          id: r2SubDoc.id, 
          ...data,
          formData: formData
        } as Round2SubmissionData);
        
        setShowRound2DetailsDialog(true);
        return;
      }
    }
      
    // If not found in round2Submissions or no ID, use the embedded form data
    if (application.round2FormData) {
      console.log('Round2 form data from application:', application.round2FormData);
      
      // Ensure formData is properly structured
      let formData = {};
      
      if (typeof application.round2FormData === 'object') {
        // The form data might be stored directly or in a nested structure
        // Check for expected fields and construct a consistent structure
        formData = {
          projectExperience: application.round2FormData.projectExperience || '',
          technicalSkills: application.round2FormData.technicalSkills || '',
          teamworkExperience: application.round2FormData.teamworkExperience || '',
          challengesSolved: application.round2FormData.challengesSolved || '',
          careerGoals: application.round2FormData.careerGoals || '',
          additionalInfo: application.round2FormData.additionalInfo || ''
        };
      }
        
      console.log('Processed embedded formData:', formData);
        
      setSelectedRound2Data({
        id: application.id,
        applicationId: application.id,
        internshipId: application.internshipId,
        studentId: application.studentId,
        studentName: application.studentName,
        studentEmail: application.studentEmail,
        formData: formData,
        submittedAt: application.updatedAt,
        status: application.status
      } as Round2SubmissionData);
      setShowRound2DetailsDialog(true);
      return;
    }
    
    throw new Error("Round 2 submission details not found.");
  } catch (error: any) {
      console.error("Error fetching Round 2 submission details:", error);
      toast({ 
        title: "Error", 
        description: `Could not load Round 2 details: ${error.message}`, 
        variant: "destructive" 
      });
    } finally {
      setIsLoadingRound2Details(false);
    }
  };

  // Approve after Round 2 (select for internship)
  const handleApproveAfterRound2 = async (applicationId: string, feedback?: string) => {
    if (!internshipId) return toast({ title: "Error", description: "Internship ID missing.", variant: "destructive" });
    setIsProcessing(true);
    const db = getFirestore();
    const appRef = doc(db, "internships", internshipId, "applications", applicationId);
    try {
      const appDoc = await getDoc(appRef);
      if (!appDoc.exists()) throw new Error("Application not found.");
      const currentApp = appDoc.data() as Application;
      
      // Update the application status
      const dataToUpdate = {
        status: 'selected' as ApplicationStatus,
        currentRound: 2,
        rounds: updateApplicationRounds(currentApp.rounds || [], 2, 'passed', feedback),
        updatedAt: serverTimestamp(),
        selectedAt: serverTimestamp() // Add timestamp for when student was selected
      };
      
      // Update in subcollection
      await updateDoc(appRef, dataToUpdate);
      
      // Also update the quizSubmission if it exists (now Round 2)
      if (currentApp.quizSubmissionId) {
        try {
          const quizSubRef = doc(db, 'quizSubmissions', currentApp.quizSubmissionId);
          await updateDoc(quizSubRef, {
            status: 'approved',
            evaluatedAt: serverTimestamp(),
            feedback: feedback || ''
          });
          console.log('Updated quiz submission with approved status');
        } catch (error) {
          console.warn('Could not update quiz submission:', error);
          // Don't throw error as the main update succeeded
        }
      } else {
        console.warn('No quizSubmissionId found for application:', applicationId);
      }
      
      toast({ 
        title: "Success", 
        description: "Student selected for internship!"
      });
      
      setRound2Applications(prevApps => prevApps.filter(app => app.id !== applicationId));
    } catch (error: any) {
      console.error("Error approving application post R2:", error);
      toast({ title: "Error", description: `Could not update application: ${error.message}`, variant: "destructive" });
    } finally {
      setIsProcessing(false);
      setShowRound2DecisionDialog(false);
    }
  };

  // Reject after Round 2
  const handleRejectAfterRound2 = async (applicationId: string, feedback?: string) => {
    if (!internshipId) return toast({ title: "Error", description: "Internship ID missing.", variant: "destructive" });
    setIsProcessing(true);
    const db = getFirestore();
    const appRef = doc(db, "internships", internshipId, "applications", applicationId);
    try {
      const appDoc = await getDoc(appRef);
      if (!appDoc.exists()) throw new Error("Application not found.");
      const currentApp = appDoc.data() as Application;
      const dataToUpdate = {
        status: 'rejected' as ApplicationStatus,
        rounds: updateApplicationRounds(currentApp.rounds || [], 2, 'failed', feedback),
        updatedAt: serverTimestamp(), 
      };
      await updateDoc(appRef, dataToUpdate);
      
      // Also update the quizSubmission if it exists
      if (currentApp.quizSubmissionId) {
        try {
          const quizSubRef = doc(db, 'quizSubmissions', currentApp.quizSubmissionId);
          await updateDoc(quizSubRef, {
            status: 'rejected',
            evaluatedAt: serverTimestamp(),
            feedback: feedback || ''
          });
          console.log('Updated quiz submission with rejected status');
        } catch (error) {
          console.warn('Could not update quiz submission:', error);
          // Don't throw error as the main update succeeded
        }
      } else {
        console.warn('No quizSubmissionId found for application:', applicationId);
      }
      
      toast({ title: "Success", description: "Application rejected after Round 2 quiz." });
      setRound2Applications(prevApps => prevApps.filter(app => app.id !== applicationId));
    } catch (error: any) {
      console.error("Error rejecting application post R2:", error);
      toast({ title: "Error", description: `Could not update application: ${error.message}`, variant: "destructive" });
    } finally {
      setIsProcessing(false);
      setShowRound2DecisionDialog(false);
    }
  };
  
  // Confirm feedback for Round 2 decisions
  const handleConfirmRound2Decision = () => {
    if (!round2DecisionApplicationId || !round2DecisionActionType) return;
    if (round2DecisionActionType === 'r2_approve') {
      handleApproveAfterRound2(round2DecisionApplicationId, round2DecisionFeedbackText);
    } else if (round2DecisionActionType === 'r2_reject') {
      handleRejectAfterRound2(round2DecisionApplicationId, round2DecisionFeedbackText);
    }
    setRound2DecisionFeedbackText(""); // Reset feedback
  };


  if (isLoadingInternship) {
    return <div className="container mx-auto p-4">Loading internship details...</div>;
  }

  if (!internshipDetails) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader><CardTitle>Error</CardTitle></CardHeader>
          <CardContent>
            <p>Internship not found.</p>
            <Link href="/superadmin/manage-tests"><Button variant="link" className="mt-4">Go back</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in p-1">
      <h1 className="text-2xl font-bold">Evaluate Internship Applications</h1>
      
      <Tabs defaultValue="round1" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="round1">Round 1 (Form Submissions)</TabsTrigger>
          <TabsTrigger value="round2">Round 2 (Quiz Submissions)</TabsTrigger>
        </TabsList>
        <TabsContent value="round1">
          <Card>
            <CardHeader>
              <CardTitle>Round 1 Form Submissions</CardTitle>
              <CardDescription>Review student application forms and decide if they proceed to Round 2 quiz. Students with approved forms will be able to take the quiz.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingApplications ? (
                <p>Loading applications...</p>
              ) : applications.length > 0 ? (
                <div className="space-y-3">
                  {applications.map(app => {
                    const student = studentsMap.get(app.studentId);
                    const displayName = student 
                      ? (student.firstName || student.lastName ? `${student.firstName || ''} ${student.lastName || ''}`.trim() : student.name || `Student ${app.studentId.substring(0,6)}`)
                      : 'Loading student...';
                    return (
                      <div key={app.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 border rounded-md shadow-sm">
                        <div>
                          <p className="font-semibold">{displayName}</p>
                          <p className="text-sm text-muted-foreground">{student?.email || app.studentEmail || app.studentId}</p>
                        </div>
                        <div className="flex gap-2 mt-2 sm:mt-0 flex-wrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewRound1Submission(app)}
                            disabled={isLoadingRound1Details || !app.id}
                          >
                            {isLoadingRound1Details ? (
                              <>
                                <span className="animate-spin mr-2">⏳</span>
                                Loading...
                              </>
                            ) : (
                              'View Submission'
                            )}
                          </Button>
                          <Button 
                            variant="default" 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => {
                              setFeedbackActionType('proceed');
                              setFeedbackApplicationId(app.id!); 
                              setShowFeedbackDialog(true);
                            }}
                            disabled={isProcessing || !app.id}
                          >
                            Proceed to Round 2
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => {
                              setFeedbackActionType('reject');
                              setFeedbackApplicationId(app.id!); 
                              setShowFeedbackDialog(true);
                            }}
                            disabled={isProcessing || !app.id}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p>No applications awaiting Round 1 review for this internship.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="round2">
          <Card>
            <CardHeader>
              <CardTitle>Round 2 Quiz Submissions</CardTitle>
              <CardDescription>Review student quiz submissions and make final selection decisions for the internship.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingRound2Applications ? (
                <p>Loading Round 2 applications...</p>
              ) : round2Applications.length > 0 ? (
                <div className="space-y-3">
                  {round2Applications.map(app => {
                    const student = studentsMap.get(app.studentId);
                    const displayName = student 
                      ? (student.firstName || student.lastName ? `${student.firstName || ''} ${student.lastName || ''}`.trim() : student.name || `Student ${app.studentId.substring(0,6)}`)
                      : 'Loading student...';
                    return (
                      <div key={app.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 border rounded-md shadow-sm">
                        <div>
                          <p className="font-semibold">{displayName}</p>
                          <p className="text-sm text-muted-foreground">{student?.email || app.studentEmail || app.studentId}</p>
                          <p className="text-xs text-muted-foreground pt-4 border-t">
                            Submitted at: {app.updatedAt?.toDate()?.toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-2 mt-2 sm:mt-0 flex-wrap">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            disabled={isProcessing || isLoadingRound2Details}
                            onClick={() => handleViewRound2Submission(app)}
                          >
                            {isLoadingRound2Details && selectedRound2Data?.applicationId === app.id ? "Loading..." : "View Submission"}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            disabled={isProcessing || isLoadingQuizAnswers}
                            onClick={() => handleViewQuizAnswers(app)}
                          >
                            {isLoadingQuizAnswers && selectedQuizForAnswers?.applicationId === app.id ? "Loading..." : "View Answers"}
                          </Button> 
                          <Button 
                            variant="default" 
                            size="sm" 
                            className="bg-blue-600 hover:bg-blue-700" // Changed color for R2 approve and select
                            onClick={() => {
                              setRound2DecisionActionType('r2_approve');
                              setRound2DecisionApplicationId(app.id!);
                              setShowRound2DecisionDialog(true);
                            }}
                            disabled={isProcessing || !app.id}
                          >
                            Select for Internship
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => {
                              setRound2DecisionActionType('r2_reject');
                              setRound2DecisionApplicationId(app.id!);
                              setShowRound2DecisionDialog(true);
                            }}
                            disabled={isProcessing || !app.id}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p>No applications awaiting Round 2 review for this internship.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Feedback Dialog for Round 1 Decisions */}
      {showFeedbackDialog && (
        <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Provide Feedback for Round 1</DialogTitle>
              <DialogDescription>
                Your feedback will be recorded. Please provide concise comments for your decision.
              </DialogDescription>
            </DialogHeader>
            <Textarea 
              placeholder={`Feedback for ${feedbackActionType === 'proceed' ? 'proceeding' : 'rejecting'} application...`}
              value={round1Feedback}
              onChange={(e) => setRound1Feedback(e.target.value)}
              className="my-4"
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowFeedbackDialog(false)}>Cancel</Button>
              <Button onClick={handleConfirmRound1Feedback} disabled={isProcessing}>
                {isProcessing ? "Submitting..." : `Confirm ${feedbackActionType === 'proceed' ? 'Proceed' : 'Reject'}`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog for Viewing Round 2 Submission Details */}
      {showRound2DetailsDialog && selectedRound2Data && (
        <Dialog open={showRound2DetailsDialog} onOpenChange={setShowRound2DetailsDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Round 2 Submission Details</DialogTitle>
              <DialogDescription>
                Applicant: {studentsMap.get(selectedRound2Data.studentId)?.firstName || ''} {studentsMap.get(selectedRound2Data.studentId)?.lastName || ''} ({studentsMap.get(selectedRound2Data.studentId)?.email})
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-6 max-h-[60vh] overflow-y-auto">
              {selectedRound2Data.formData && (
                <>
                  {/* Project Experience */}
                  <div className="border-b pb-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Project Experience:</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {selectedRound2Data.formData.projectExperience || 'Not provided'}
                    </p>
                  </div>
                  
                  {/* Technical Skills */}
                  <div className="border-b pb-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Technical Skills:</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {selectedRound2Data.formData.technicalSkills || 'Not provided'}
                    </p>
                  </div>
                  
                  {/* Teamwork Experience */}
                  <div className="border-b pb-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Teamwork Experience:</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {selectedRound2Data.formData.teamworkExperience || 'Not provided'}
                    </p>
                  </div>
                  
                  {/* Challenges Solved */}
                  <div className="border-b pb-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Challenges Solved:</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {selectedRound2Data.formData.challengesSolved || 'Not provided'}
                    </p>
                  </div>
                  
                  {/* Career Goals */}
                  <div className="border-b pb-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Career Goals:</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {selectedRound2Data.formData.careerGoals || 'Not provided'}
                    </p>
                  </div>
                  
                  {/* Additional Info */}
                  {selectedRound2Data.formData.additionalInfo && (
                    <div className="pb-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Additional Information:</h4>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {selectedRound2Data.formData.additionalInfo}
                      </p>
                    </div>
                  )}
                </>
              )}
              
              {(!selectedRound2Data.formData || Object.keys(selectedRound2Data.formData).length === 0) && (
                <div className="text-center py-4">
                  <p>No form data available</p>
                </div>
              )}
              
              <p className="text-xs text-muted-foreground pt-4 border-t">
                Submitted at: {selectedRound2Data.submittedAt?.toDate()?.toLocaleString()}
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRound2DetailsDialog(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Feedback Dialog for Round 2 Decisions */}
      {showRound2DecisionDialog && (
        <Dialog open={showRound2DecisionDialog} onOpenChange={setShowRound2DecisionDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{round2DecisionActionType === 'r2_approve' ? 'Select Student for Internship' : 'Reject Quiz Submission'}</DialogTitle>
              <DialogDescription>
                Your feedback will be recorded and shared with the student. Please provide concise comments explaining your decision.
              </DialogDescription>
            </DialogHeader>
            <Textarea 
              placeholder={`Feedback for ${round2DecisionActionType === 'r2_approve' ? 'approving' : 'rejecting'} application...`}
              value={round2DecisionFeedbackText}
              onChange={(e) => setRound2DecisionFeedbackText(e.target.value)}
              className="my-4"
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRound2DecisionDialog(false)}>Cancel</Button>
              <Button onClick={handleConfirmRound2Decision} disabled={isProcessing}>
                {isProcessing ? "Submitting..." :
                  (round2DecisionActionType === 'r2_approve' ? 'Select for Internship' : 'Confirm Reject')
                }
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Test Review Dialog (for Round 1 Quiz) */}
      {showQuizDialog && selectedQuizSubmission && (
        <Dialog open={showQuizDialog} onOpenChange={setShowQuizDialog}>
          <DialogContent className="max-w-3xl"> 
            <DialogHeader>
              <DialogTitle>Round 2 Quiz Submission Review</DialogTitle>
            </DialogHeader>
            <TestReviewDialog 
              testDetails={selectedQuizSubmission} 
              onClose={() => setShowQuizDialog(false)}
              onApprove={() => {}} 
              onReject={() => {}}  
              showActionFooter={false} 
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Quiz Answers Dialog */}
      <Dialog open={showQuizAnswersDialog} onOpenChange={setShowQuizAnswersDialog}>
        <DialogContent aria-describedby="quiz-answers-description" className="max-w-4xl max-h-[80vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Quiz Answers for {selectedQuizForAnswers?.studentName || 'Student'} - {selectedQuizForAnswers?.internshipTitle || 'Internship'}</DialogTitle>
            <DialogDescription id="quiz-answers-description" className="sr-only">
              This dialog displays the quiz answers submitted by the student for the selected internship application.
            </DialogDescription>
          </DialogHeader>
          {selectedQuizForAnswers ? (
            <div>
              <p className="text-sm font-medium text-blue-700 mb-2">Debug: Data passed to TestReviewDialog</p>
              <TestReviewDialog
                testDetails={selectedQuizForAnswers}
                onApprove={() => {}}
                onReject={() => {}}
                onClose={() => setShowQuizAnswersDialog(false)}
                showActionFooter={false}
              />
            </div>
          ) : (
            <p className="text-sm text-gray-500">No quiz data available to display.</p>
          )}
        </DialogContent>
      </Dialog>

      {/* Round 1 Form Details Dialog */}
      <Dialog open={showRound1DetailsDialog} onOpenChange={setShowRound1DetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-2 border-b">
            <DialogTitle className="text-xl font-bold text-primary">Round 1 Form Submission</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Review the student's application form details.
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingRound1Details ? (
            <div className="flex flex-col justify-center items-center p-8 gap-3">
              <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
              <span className="text-muted-foreground">Loading form details...</span>
            </div>
          ) : selectedRound1Data ? (
            <div className="space-y-6 p-4">
              {/* Student Header Card */}
              <div className="bg-muted/30 rounded-lg p-4 flex flex-col md:flex-row justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg text-primary">{selectedRound1Data.formData.fullName || 'Application Form'}</h3>
                  {selectedRound1Data.formData.email && (
                    <p className="text-sm flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>
                      {selectedRound1Data.formData.email}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    Submitted on {selectedRound1Data.submittedAt && 'toDate' in selectedRound1Data.submittedAt && typeof selectedRound1Data.submittedAt.toDate === 'function'
                      ? new Date((selectedRound1Data.submittedAt as any).toDate()).toLocaleString()
                      : selectedRound1Data.submittedAt
                        ? new Date(selectedRound1Data.submittedAt).toLocaleString()
                        : 'Unknown date'}
                  </p>
                </div>
                <div className="flex items-center">
                  <Badge variant={selectedRound1Data.status === 'form_submitted' ? 'outline' : 'secondary'} className="capitalize px-3 py-1">
                    {selectedRound1Data.status === 'form_submitted' ? 'Pending Review' : selectedRound1Data.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
              </div>
              
              {/* Internship Info Section */}
              {(selectedRound1Data.formData.domains || selectedRound1Data.formData.companyName || selectedRound1Data.formData.title) && (
                <div className="bg-white border rounded-lg p-4 mb-4 shadow-sm">
                  <div className="flex items-center mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary mr-2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M14 3v5h5M18 21v-6M15 18h6"></path></svg>
                    <h3 className="text-md font-semibold text-primary">Internship Information</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedRound1Data.formData.companyName && (
                      <div className="flex flex-col bg-muted/20 p-3 rounded-md">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Company</span>
                        <span className="text-sm font-medium mt-1">{selectedRound1Data.formData.companyName}</span>
                      </div>
                    )}
                    
                    {selectedRound1Data.formData.title && (
                      <div className="flex flex-col bg-muted/20 p-3 rounded-md">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Position</span>
                        <span className="text-sm font-medium mt-1">{selectedRound1Data.formData.title}</span>
                      </div>
                    )}
                    
                    {selectedRound1Data.formData.domains && (
                      <div className="flex flex-col md:col-span-2 bg-muted/20 p-3 rounded-md">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Domains</span>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {Array.isArray(selectedRound1Data.formData.domains) ? 
                            selectedRound1Data.formData.domains.map((domain: string, i: number) => (
                              <Badge key={i} variant="secondary" className="text-xs py-1">{domain}</Badge>
                            )) : 
                            <span className="text-sm">{JSON.stringify(selectedRound1Data.formData.domains)}</span>
                          }
                        </div>
                      </div>
                    )}
                    
                    {/* Date Information with Icons */}
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      {selectedRound1Data.formData.firstRoundDate && (
                        <div className="flex items-center bg-muted/20 p-3 rounded-md">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground mr-2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                          <div>
                            <span className="text-xs font-medium text-muted-foreground block">First Round Date</span>
                            <span className="text-sm font-medium">
                              {typeof selectedRound1Data.formData.firstRoundDate === 'object' && selectedRound1Data.formData.firstRoundDate !== null && 'toDate' in selectedRound1Data.formData.firstRoundDate && typeof selectedRound1Data.formData.firstRoundDate.toDate === 'function' 
                                ? new Date((selectedRound1Data.formData.firstRoundDate as any).toDate()).toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric'})
                                : typeof selectedRound1Data.formData.firstRoundDate === 'string'
                                  ? new Date(selectedRound1Data.formData.firstRoundDate).toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric'})
                                  : String(selectedRound1Data.formData.firstRoundDate)
                              }
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {selectedRound1Data.formData.testDate && (
                        <div className="flex items-center bg-muted/20 p-3 rounded-md">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground mr-2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                          <div>
                            <span className="text-xs font-medium text-muted-foreground block">Test Date</span>
                            <span className="text-sm font-medium">
                              {typeof selectedRound1Data.formData.testDate === 'object' && selectedRound1Data.formData.testDate !== null && 'toDate' in selectedRound1Data.formData.testDate && typeof selectedRound1Data.formData.testDate.toDate === 'function' 
                                ? new Date((selectedRound1Data.formData.testDate as any).toDate()).toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric'})
                                : typeof selectedRound1Data.formData.testDate === 'string'
                                  ? new Date(selectedRound1Data.formData.testDate).toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric'})
                                  : String(selectedRound1Data.formData.testDate)
                              }
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Resume & Portfolio Links */}
              {(selectedRound1Data.formData.resumeUrl || selectedRound1Data.formData.portfolio) && (
                <div className="bg-white border rounded-lg p-4 mb-4 shadow-sm">
                  <div className="flex items-center mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary mr-2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M14 3v5h5M18 21v-6M15 18h6"></path></svg>
                    <h3 className="text-md font-semibold text-primary">Documents & Links</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedRound1Data.formData.resumeUrl && (
                      <div className="flex flex-col bg-muted/20 p-3 rounded-md">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Resume</span>
                        <a 
                          href={selectedRound1Data.formData.resumeUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-2"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                          View Resume
                        </a>
                      </div>
                    )}
                    
                    {selectedRound1Data.formData.portfolio && (
                      <div className="flex flex-col bg-muted/20 p-3 rounded-md">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Portfolio</span>
                        <a 
                          href={selectedRound1Data.formData.portfolio} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-2"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                          View Portfolio
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Application Form Data */}
              <div className="bg-white border rounded-lg p-4 shadow-sm">
                <div className="flex items-center mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary mr-2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M14 3v5h5M18 21v-6M15 18h6"></path></svg>
                  <h3 className="text-md font-semibold text-primary">Application Form Data</h3>
                </div>
                
                <div className="space-y-4">
                  {/* Key Application Questions */}
                  {[
                    { field: 'projectExperience', question: 'Describe a significant project you\'ve worked on that\'s relevant to this role:' },
                    { field: 'technicalSkills', question: 'Detail your technical skills and proficiency levels relevant to this internship:' },
                    { field: 'teamworkExperience', question: 'Describe your experience working in a team environment:' },
                    { field: 'challengesSolved', question: 'Describe a technical challenge you\'ve solved:' },
                    { field: 'careerGoals', question: 'What are your career goals and how does this internship fit into them?' },
                    { field: 'additionalInfo', question: 'Additional Information (Optional)' }
                  ].map(({ field, question }) => 
                    selectedRound1Data.formData[field] ? (
                      <div key={field} className="border rounded-lg overflow-hidden">
                        <div className="bg-primary/10 p-3 border-b">
                          <h4 className="font-semibold text-sm text-black">
                            {question}
                          </h4>
                        </div>
                        <div className="p-4 bg-white text-sm whitespace-pre-wrap text-black">
                          {selectedRound1Data.formData[field] || 'Not provided'}
                        </div>
                      </div>
                    ) : null
                  )}
                  
                  {/* Additional Form Fields */}
                  {['teamworkExperience', 'projectExperience', 'careerGoals', 'challengesSolved', 'whyJoin', 'additionalInfo'].map(field => 
                    selectedRound1Data.formData[field] ? (
                      <div key={field} className="border rounded-lg overflow-hidden">
                        <div className="bg-muted/30 p-3 border-b">
                          <h4 className="font-semibold text-sm text-gray-800 capitalize">
                            {field.replace(/([A-Z])/g, ' $1').trim()}
                          </h4>
                        </div>
                        <div className="p-3 bg-white text-sm whitespace-pre-wrap text-gray-700">
                          {selectedRound1Data.formData[field] || 'Not provided'}
                        </div>
                      </div>
                    ) : null
                  )}
                  
                  {/* Any Remaining Fields */}
                  {Object.entries(selectedRound1Data.formData).filter(([key]) => {
                    const commonFields = ['fullName', 'email', 'phone', 'education', 'experience', 'skills', 
                      'technicalSkills', 'teamworkExperience', 'projectExperience', 'careerGoals', 
                      'challengesSolved', 'whyJoin', 'additionalInfo', 'resumeUrl', 'portfolio', 
                      'domains', 'companyName', 'title', 'firstRoundDate', 'testDate'];
                    return !commonFields.includes(key);
                  }).map(([key, value]) => {
                    // Format the field name for display
                    const formattedKey = key
                      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
                      .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
                      .replace(/Id$/, 'ID') // Replace 'Id' with 'ID'
                      .replace(/Url$/, 'URL'); // Replace 'Url' with 'URL'
                    
                    // Handle different value types
                    if (typeof value === 'object' && value !== null) {
                      if ('toDate' in value && typeof value.toDate === 'function') {
                        // Handle Firestore timestamps
                        return (
                          <div key={key} className="border rounded-lg overflow-hidden">
                            <div className="bg-muted/30 p-3 border-b">
                              <h4 className="font-semibold text-sm text-gray-800">{formattedKey}</h4>
                            </div>
                            <div className="p-3 bg-white text-sm text-gray-700">
                              {new Date((value as any).toDate()).toLocaleString()}
                            </div>
                          </div>
                        );
                      } else if (Array.isArray(value)) {
                        // Format arrays nicely
                        return (
                          <div key={key} className="border rounded-lg overflow-hidden">
                            <div className="bg-muted/30 p-3 border-b">
                              <h4 className="font-semibold text-sm text-gray-800">{formattedKey}</h4>
                            </div>
                            <div className="p-3 bg-white">
                              <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                                {value.map((item: any, idx: number) => (
                                  <li key={idx}>
                                    {typeof item === 'object' ? JSON.stringify(item) : String(item)}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        );
                      } else {
                        // Format objects as a styled list
                        try {
                          const objData = value as Record<string, any>;
                          return (
                            <div key={key} className="border rounded-lg overflow-hidden">
                              <div className="bg-muted/30 p-3 border-b">
                                <h4 className="font-semibold text-sm text-gray-800">{formattedKey}</h4>
                              </div>
                              <div className="divide-y">
                                {Object.entries(objData).map(([k, v], idx) => {
                                  const subKey = k.replace(/([A-Z])/g, ' $1')
                                    .replace(/^./, str => str.toUpperCase());
                                  const subValue = typeof v === 'object' ? 
                                    (v === null ? 'None' : JSON.stringify(v)) : String(v);
                                  return (
                                    <div key={idx} className="p-3 bg-white">
                                      <div className="text-xs font-medium text-gray-500 mb-1">{subKey}</div>
                                      <div className="text-sm text-gray-700">{subValue}</div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        } catch (e) {
                          // Fallback to JSON if there's an error
                          return (
                            <div key={key} className="border rounded-lg overflow-hidden">
                              <div className="bg-muted/30 p-3 border-b">
                                <h4 className="font-semibold text-sm text-gray-800">{formattedKey}</h4>
                              </div>
                              <div className="p-3 bg-white">
                                <pre className="text-xs overflow-auto p-2 bg-gray-50 rounded border">
                                  {JSON.stringify(value, null, 2)}
                                </pre>
                              </div>
                            </div>
                          );
                        }
                      }
                    } else {
                      // Handle string, number, boolean values
                      const displayValue = value === null || value === undefined ? 'Not provided' : String(value);
                      
                      return (
                        <div key={key} className="border rounded-lg overflow-hidden">
                          <div className="bg-muted/30 p-3 border-b">
                            <h4 className="font-semibold text-sm text-gray-800">{formattedKey}</h4>
                          </div>
                          <div className="p-3 bg-white text-sm text-gray-700">
                            {displayValue.startsWith('http') ? (
                              <a href={displayValue} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                {displayValue}
                              </a>
                            ) : (
                              displayValue
                            )}
                          </div>
                        </div>
                      );
                    }
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 text-center">
              <p>No form data available</p>
            </div>
          )}
          
          {/* Submission ID Section */}
          {selectedRound1Data && selectedRound1Data.formData.round1SubmissionId && (
            <div className="bg-white border rounded-lg p-4 mt-4 shadow-sm">
              <div className="flex items-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary mr-2"><path d="M20 11.08V8l-6-6H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h6"></path><path d="M14 3v5h5M18 21v-6M15 18h6"></path></svg>
                <h3 className="text-md font-semibold text-black">Round 1 Submission ID</h3>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-muted/20 p-3 rounded-md">
                <div className="flex-1">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Submission Reference</div>
                  <code className="bg-muted p-2 rounded text-sm font-mono block overflow-x-auto">
                    {selectedRound1Data.formData.round1SubmissionId}
                  </code>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-1 whitespace-nowrap"
                  onClick={() => {
                    navigator.clipboard.writeText(selectedRound1Data.formData.round1SubmissionId);
                    toast({ title: "Copied", description: "Submission ID copied to clipboard", variant: "default" });
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                  Copy ID
                </Button>
              </div>
            </div>
          )}
          
          <DialogFooter className="border-t pt-4 mt-4">
            <Button variant="outline" onClick={() => setShowRound1DetailsDialog(false)} className="w-full sm:w-auto">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EvaluateInternshipPage;
