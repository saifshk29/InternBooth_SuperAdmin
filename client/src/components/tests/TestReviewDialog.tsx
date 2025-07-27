import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckCircleIcon, XCircleIcon, HelpCircleIcon, FileTextIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TestQuestion, QuizSubmission, Student } from "../../lib/types"; 
import { getFirestore, doc, getDoc } from 'firebase/firestore'; 

// Placeholder for the original test assignment details structure
// TODO: Define a proper interface for this if possible for better type safety
type AnyTestAssignmentDetails = any;

// Type guard to check if details is a QuizSubmission
function isQuizSubmission(details: any): details is QuizSubmission {
  return details && typeof details === 'object' && 'questionData' in details && 'submittedAt' in details;
}

interface TestReviewDialogProps {
  testDetails: AnyTestAssignmentDetails | QuizSubmission; // Union type
  onApprove: (feedback: string, advanceToNextRound: boolean) => void;
  onReject: (feedback: string) => void;
  onClose: () => void;
  showActionFooter?: boolean; // New prop
}

const TestReviewDialog: React.FC<TestReviewDialogProps> = ({
  testDetails,
  onApprove,
  onReject,
  onClose,
  showActionFooter = true // Default to true
}) => {
  const { toast } = useToast();
  const [decision, setDecision] = useState<"approve" | "reject" | null>(null);
  const [feedback, setFeedback] = useState("");
  const [advanceToNextRound, setAdvanceToNextRound] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [studentName, setStudentName] = useState<string>("Loading student details...");
  const [renderKey, setRenderKey] = useState(0);

  useEffect(() => {
    setRenderKey(prev => prev + 1);
    console.log('Test details updated, forcing re-render:', testDetails);
  }, [testDetails]);

  const isSubmission = isQuizSubmission(testDetails);

  useEffect(() => {
    if (isSubmission && testDetails.studentId) {
      const fetchStudentName = async () => {
        const db = getFirestore();
        try {
          const studentRef = doc(db, 'students', testDetails.studentId);
          const studentSnap = await getDoc(studentRef);
          if (studentSnap.exists()) {
            const studentData = studentSnap.data() as Student;
            const fName = (studentData as any).firstName;
            const lName = (studentData as any).lastName;
            if (fName || lName) {
              setStudentName(`${fName || ''} ${lName || ''}`.trim());
            } else if (studentData.name) { // Fallback to name as per Student type
              setStudentName(studentData.name);
            } else {
              setStudentName("Student (Name not found)");
            }
          } else {
            setStudentName("Student (Not found)");
          }
        } catch (error) {
          console.error("Error fetching student details:", error);
          setStudentName("Student (Error loading)");
        }
      };
      fetchStudentName();
    } else if (!isSubmission && testDetails?.student?.name) {
      // Fallback for original structure if student name is directly available
      setStudentName(testDetails.student.name);
    } else if (!isSubmission) {
        setStudentName("Student (Details N/A for this type)")
    }
  }, [testDetails, isSubmission]);

  // Get current round information - only relevant for non-quiz submissions (original test assignments)
  const currentRound = !isSubmission && testDetails?.application?.currentRound ? testDetails.application.currentRound : 1;

  const handleSubmit = async () => {
    if (!decision) return;
    setIsSubmitting(true);
    try {
      if (decision === "approve") {
        // For QuizSubmissions, advanceToNextRound is conceptually false or not applicable from dialog's perspective
        await onApprove(feedback, isSubmission ? false : advanceToNextRound);
      } else {
        await onReject(feedback);
      }
      onClose(); // Close dialog on successful submission
    } catch (error: any) {
      console.error("Error submitting review:", error);
      toast({
        variant: "destructive",
        title: "Error submitting review",
        description: error.message || "An unknown error occurred"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatQuestionAnswers = () => {
    if (!testDetails) return <p className="text-sm text-gray-500">No details available</p>;
    console.log('Full testDetails to render:', JSON.stringify(testDetails, null, 2));
    
    const questionsToRender = testDetails.questions || testDetails.questionData || [];
    
    return (
      <div className="space-y-4">
        {questionsToRender.length > 0 ? (
          questionsToRender.map((qItem: any, index: number) => (
            <div key={qItem.id || index} className="border p-4 rounded-lg bg-white shadow-sm">
              <h4 className="text-lg font-medium mb-2">Q{index + 1}: {qItem.text || qItem.question || `Question ${index + 1}`}</h4>
              <div className="mt-2 bg-gray-50 p-3 rounded-md border border-gray-200">
                <p className="text-sm font-medium text-gray-700">Student's Answer:</p>
                <p className="mt-1 text-base text-blue-800 font-medium">{qItem.userAnswer || qItem.user_answer || qItem.answer || qItem.textAnswer || 'No answer provided'}</p>
              </div>
              {qItem.correct !== undefined && (
                <div className="mt-2 flex items-center">
                  <span className={`px-3 py-1 rounded-full text-sm ${qItem.correct ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}> 
                    {qItem.correct ? '✓ Correct' : '✗ Incorrect'}
                  </span>
                </div>
              )}
              {(qItem.type === 'mcq' && qItem.options && qItem.options.length > 0) && (
                <div className="mt-3 space-y-2">
                  <p className="text-sm font-medium text-gray-700">Options:</p>
                  {qItem.options.map((opt: string, optIndex: number) => (
                    <div key={optIndex} className={`p-2 border rounded-md text-sm ${qItem.selectedOption === optIndex ? 'bg-blue-50 border-blue-300' : ''} ${qItem.correctOption === optIndex ? 'border-green-400 bg-green-50' : ''}`}>
                      {String.fromCharCode(65 + optIndex)}. {opt}
                      {qItem.selectedOption === optIndex && <span className="ml-2 text-blue-600 text-xs font-medium">(Selected)</span>}
                      {qItem.correctOption === optIndex && <span className="ml-2 text-green-600 text-xs font-medium">(Correct)</span>}
                    </div>
                  ))}
                </div>
              )}
              {(qItem.type === 'text' && qItem.correctAnswer) && (
                <div className="mt-3 bg-green-50 p-3 rounded-md border border-green-200">
                  <p className="text-sm font-medium text-green-700">Correct Answer:</p>
                  <p className="mt-1 text-base text-green-800 font-medium">{qItem.correctAnswer}</p>
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500 italic">No questions available to display.</p>
        )}
        <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-md opacity-70">
          <p className="text-sm font-medium text-blue-700">Raw Data View (Debug):</p>
          <pre className="mt-2 text-xs text-blue-800 overflow-x-auto bg-blue-100 p-2 rounded max-h-40">
            {JSON.stringify(testDetails, null, 2)}
          </pre>
        </div>
      </div>
    );
  };

  // Determine display values based on whether it's a quiz submission or test assignment
  const internshipTitle = isSubmission ? (testDetails as QuizSubmission).internshipTitle : testDetails?.internshipTitle || testDetails?.internship?.title;
  const testTitle = isSubmission ? (testDetails as QuizSubmission).testName : testDetails?.test?.title;
  const completedAtDate = isSubmission ? (testDetails as QuizSubmission).submittedAt : testDetails?.completedAt;
  const displayCompletedAt = completedAtDate
    ? (completedAtDate.toDate ? new Date(completedAtDate.toDate()).toLocaleString() : new Date(completedAtDate).toLocaleString())
    : "Unknown";

  return (
    <div key={renderKey} className="space-y-4 p-1">
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium flex items-center">
            {isSubmission ? <FileTextIcon className="mr-2 h-5 w-5 text-blue-600" /> : <HelpCircleIcon className="mr-2 h-5 w-5 text-orange-500" />}
            {isSubmission ? "Quiz Submission Review" : "Test Assignment Review"}
          </h3>
          <span className={`px-2 py-1 rounded-full text-xs ${isSubmission ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>
            Pending Review
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm border rounded-md p-3 bg-slate-50/50">
          <div>
            <p className="text-gray-500">Student</p>
            <p className="font-medium">{studentName}</p>
          </div>
          <div>
            <p className="text-gray-500">Internship</p>
            <p className="font-medium">{internshipTitle || "Unknown"}</p>
          </div>
          <div>
            <p className="text-gray-500">{isSubmission ? "Quiz Name" : "Test Name"}</p>
            <p className="font-medium">{testTitle || "Unknown"}</p>
          </div>
          {!isSubmission && (
            <div>
              <p className="text-gray-500">Current Round</p>
              <p className="font-medium">
                Round {currentRound}
              </p>
            </div>
          )}
          {isSubmission && (testDetails as QuizSubmission).score !== undefined && (
            <div>
              <p className="text-gray-500">Score</p>
              <p className="font-medium">
                {(testDetails as QuizSubmission).score} / {(testDetails as QuizSubmission).totalPossiblePoints} ({(testDetails as QuizSubmission).percentage?.toFixed(1)}%)
              </p>
            </div>
          )}
          <div>
            <p className="text-gray-500">{isSubmission ? "Submitted At" : "Completed On"}</p>
            <p className="font-medium">{displayCompletedAt}</p>
          </div>
        </div>
      </div>

      <div className="border rounded-md p-3 space-y-3 max-h-[calc(100vh-450px)] overflow-y-auto bg-white">
        <div>
          <h4 className="font-medium mb-2 text-gray-700">{isSubmission ? "Quiz Responses & Correctness" : "Student Responses"}</h4>
          {formatQuestionAnswers()}
        </div>
      </div>

      {showActionFooter && (
        <div className="mt-4 pt-4 border-t">
          <Label htmlFor="feedback">Feedback (optional)</Label>
          <Textarea
            id="feedback"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder={`Provide feedback to the student regarding their ${isSubmission ? 'quiz submission' : 'test performance'}...`}
            className="mt-1 mb-3"
          />

          <Label className="mb-2 block">Decision</Label>
          <RadioGroup value={decision || undefined} onValueChange={(value) => setDecision(value as "approve" | "reject")}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="approve" id="approve" />
              <Label htmlFor="approve">Approve</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="reject" id="reject" />
              <Label htmlFor="reject">Reject</Label>
            </div>
          </RadioGroup>

          {!isSubmission && decision === "approve" && currentRound === 1 && (
            <div className="mt-3">
              <div className="flex items-center space-x-2">
                <input 
                    type="checkbox" 
                    id="advanceRound" 
                    checked={advanceToNextRound} 
                    onChange={(e) => setAdvanceToNextRound(e.target.checked)} 
                    className="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
                />
                <Label htmlFor="advanceRound">Advance to next round (Round 2)</Label>
              </div>
            </div>
          )}

          <div className="mt-4 flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!decision || isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Decision"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestReviewDialog;
