import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  addDoc,
  serverTimestamp,
  onSnapshot,
  runTransaction,
  Transaction
} from "firebase/firestore";

// Import types
import { 
  Test, 
  TestQuestion, 
  TestAssignment, 
  Application, 
  ApplicationStatus, 
  Student,
  ApplicationRound,
  RoundStatus,
  Internship,
  QuizSubmission
} from './types';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBZ_ihy3_pQYksERjevUYLgQ5JNzx5omyY",
  authDomain: "bridgeinterntest.firebaseapp.com",
  projectId: "bridgeinterntest",
  storageBucket: "bridgeinterntest.appspot.com",
  messagingSenderId: "484145503886",
  appId: "1:484145503886:web:55e4a191288da5844333df"
};

// Initialize Firebase
let app;

console.log('Attempting to initialize Firebase with config:', {
  apiKey: firebaseConfig.apiKey,
  projectId: firebaseConfig.projectId,
  // Not logging full config for security
});

try {
  app = initializeApp(firebaseConfig);
  console.log('Firebase app initialized successfully');
} catch (error: any) {
  console.error('Firebase initialization error:', error);
  // If app already exists, use the existing one
  if (error.code === 'app/duplicate-app') {
    console.log('App already exists, creating with different name');
    app = initializeApp(firebaseConfig, 'superAdminApp');
  } else {
    console.error('Critical Firebase error:', error);
    throw error;
  }
}
const auth = getAuth(app);
const db = getFirestore(app);

// Authentication functions
export const loginWithEmail = (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const createAccount = (email: string, password: string) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

export const logout = () => {
  return signOut(auth);
};

// Firestore functions
export const createFaculty = async (faculty: any) => {
  // Make sure a user is authenticated before making the request
  if (!auth.currentUser) {
    throw new Error("You must be logged in to perform this action");
  }
  
  // Create firebase authentication account first
  let userCredential;
  try {
    // Create an auth account for the faculty member
    userCredential = await createUserWithEmailAndPassword(
      auth, 
      faculty.email, 
      faculty.password
    );
    
    console.log("Created authentication account for faculty:", faculty.email);
  } catch (authError: any) {
    console.error("Error creating authentication account:", authError);
    throw new Error(`Failed to create account: ${authError.message}`);
  }
  
  const facultyRef = collection(db, "faculty");
  
  // Basic document that should always work, omit password from Firestore
  const { password, ...facultyWithoutPassword } = faculty;
  const facultyData = {
    ...facultyWithoutPassword,
    uid: userCredential.user.uid, // Store the authentication UID
    createdAt: serverTimestamp(),
    status: "active"
  };
  
  // Try to add the createdBy field, but continue even if we can't
  try {
    return await addDoc(facultyRef, {
      ...facultyData,
      createdBy: auth.currentUser.uid // Track who created this document
    });
  } catch (error) {
    console.warn("Could not add createdBy, trying without it");
    // If that fails, try without the createdBy field
    return addDoc(facultyRef, facultyData);
  }
};

export const getFacultyList = async () => {
  const facultyRef = collection(db, "faculty");
  const snapshot = await getDocs(facultyRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const updateFaculty = async (id: string, data: any) => {
  // Make sure a user is authenticated before making the request
  if (!auth.currentUser) {
    throw new Error("You must be logged in to perform this action");
  }
  
  const facultyRef = doc(db, "faculty", id);
  
  // Verify document exists
  const docSnap = await getDoc(facultyRef);
  if (!docSnap.exists()) {
    throw new Error("Faculty document doesn't exist");
  }
  
  // Get existing data to merge with updates
  const existingData = docSnap.data();
  
  // Basic updates that should always work - merge with existing data
  const updateData = {
    ...data,
    updatedAt: serverTimestamp(),
  };
  
  console.log("Updating faculty with data:", updateData);
  
  try {
    // First attempt - with updatedBy
    await updateDoc(facultyRef, {
      ...updateData,
      updatedBy: auth.currentUser.uid
    });
    console.log("Faculty updated successfully with updatedBy");
    
    // If successful, get the updated document to return
    const updatedDoc = await getDoc(facultyRef);
    return { id, ...updatedDoc.data() };
  } catch (error) {
    console.warn("Could not update with updatedBy, trying without it:", error);
    
    // Second attempt - without updatedBy
    await updateDoc(facultyRef, updateData);
    console.log("Faculty updated successfully without updatedBy");
    
    // If successful, get the updated document to return
    const updatedDoc = await getDoc(facultyRef);
    return { id, ...updatedDoc.data() };
  }
};

export const deleteFaculty = async (id: string) => {
  // Make sure a user is authenticated before making the request
  if (!auth.currentUser) {
    throw new Error("You must be logged in to perform this action");
  }
  
  const facultyRef = doc(db, "faculty", id);
  return deleteDoc(facultyRef);
};

export const getStudentList = async () => {
  const studentsRef = collection(db, "students");
  const snapshot = await getDocs(studentsRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const updateStudent = async (id: string, data: any) => {
  // Make sure a user is authenticated before making the request
  if (!auth.currentUser) {
    throw new Error("You must be logged in to perform this action");
  }
  
  const studentRef = doc(db, "students", id);
  
  // Verify document exists
  const docSnap = await getDoc(studentRef);
  if (!docSnap.exists()) {
    throw new Error("Student document doesn't exist");
  }
  
  // Basic updates that should always work - merge with existing data
  const updateData = {
    ...data,
    updatedAt: serverTimestamp(),
  };
  
  console.log("Updating student with data:", updateData);
  
  try {
    // First attempt - with updatedBy
    await updateDoc(studentRef, {
      ...updateData,
      updatedBy: auth.currentUser.uid
    });
    
    // If successful, get the updated document to return
    const updatedDoc = await getDoc(studentRef);
    return { id, ...updatedDoc.data() };
  } catch (error) {
    console.warn("Could not update with updatedBy, trying without it:", error);
    
    // Second attempt - without updatedBy
    await updateDoc(studentRef, updateData);
    
    // If successful, get the updated document to return
    const updatedDoc = await getDoc(studentRef);
    return { id, ...updatedDoc.data() };
  }
};

export const deleteStudent = async (id: string) => {
  // Make sure a user is authenticated before making the request
  if (!auth.currentUser) {
    throw new Error("You must be logged in to perform this action");
  }
  
  const studentRef = doc(db, "students", id);
  return deleteDoc(studentRef);
};

export const getInternshipList = async () => {
  try {
    // Get all internships
    const internshipsRef = collection(db, "internships");
    const snapshot = await getDocs(internshipsRef);
    const internships = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Get all faculty
    const facultyRef = collection(db, "faculty");
    const facultySnapshot = await getDocs(facultyRef);
    const facultyMap: Record<string, string> = {};
    
    facultySnapshot.docs.forEach(doc => {
      const facultyData = doc.data();
      facultyMap[doc.id] = facultyData.name;
    });
    
    // Attach faculty names to internships
    return internships.map(internship => {
      const typedInternship: any = internship;
      if (typedInternship.facultyId && facultyMap[typedInternship.facultyId]) {
        return {
          ...typedInternship,
          facultyName: facultyMap[typedInternship.facultyId]
        };
      }
      return typedInternship;
    });
  } catch (error) {
    console.error("Error fetching internship list with faculty names:", error);
    throw error;
  }
};

export const updateInternship = async (id: string, data: any) => {
  // Make sure a user is authenticated before making the request
  if (!auth.currentUser) {
    throw new Error("You must be logged in to perform this action");
  }
  
  const internshipRef = doc(db, "internships", id);
  
  // Verify document exists
  const docSnap = await getDoc(internshipRef);
  if (!docSnap.exists()) {
    throw new Error("Internship document doesn't exist");
  }
  
  // Get existing faculty ID if present
  const existingData = docSnap.data();
  const facultyId = existingData.facultyId;
  
  // Basic updates that should always work - merge with existing data
  const updateData = {
    ...data,
    updatedAt: serverTimestamp(),
  };
  
  console.log("Updating internship with data:", updateData);
  
  try {
    // First attempt - with updatedBy
    await updateDoc(internshipRef, {
      ...updateData,
      updatedBy: auth.currentUser.uid
    });
    
    // If this internship is associated with a faculty member, update their counter
    if (facultyId && !data.facultyId) {
      // This means we're keeping the same faculty
      try {
        await updateFacultyInternshipCount(facultyId);
      } catch (error) {
        console.warn("Failed to update faculty internship count:", error);
      }
    } else if (data.facultyId && facultyId !== data.facultyId) {
      // Faculty changed, update both old and new faculty counts
      try {
        if (facultyId) await updateFacultyInternshipCount(facultyId);
        await updateFacultyInternshipCount(data.facultyId);
      } catch (error) {
        console.warn("Failed to update faculty internship counts:", error);
      }
    }
    
    // If successful, get the updated document to return
    const updatedDoc = await getDoc(internshipRef);
    return { id, ...updatedDoc.data() };
  } catch (error) {
    console.warn("Could not update with updatedBy, trying without it:", error);
    
    // Second attempt - without updatedBy
    await updateDoc(internshipRef, updateData);
    
    // Same faculty update logic as above
    if (facultyId && !data.facultyId) {
      try {
        await updateFacultyInternshipCount(facultyId);
      } catch (error) {
        console.warn("Failed to update faculty internship count:", error);
      }
    } else if (data.facultyId && facultyId !== data.facultyId) {
      try {
        if (facultyId) await updateFacultyInternshipCount(facultyId);
        await updateFacultyInternshipCount(data.facultyId);
      } catch (error) {
        console.warn("Failed to update faculty internship counts:", error);
      }
    }
    
    // If successful, get the updated document to return
    const updatedDoc = await getDoc(internshipRef);
    return { id, ...updatedDoc.data() };
  }
};

export const deleteInternship = async (id: string) => {
  // Make sure a user is authenticated before making the request
  if (!auth.currentUser) {
    throw new Error("You must be logged in to perform this action");
  }
  
  const internshipRef = doc(db, "internships", id);
  return deleteDoc(internshipRef);
};

// Removed duplicate import

export const createTest = async (testData: Omit<Test, 'id' | 'createdAt' | 'createdBy' | 'status'> & { questions: string | TestQuestion[] }) => {
  // Make sure a user is authenticated before making the request
  if (!auth.currentUser) {
    throw new Error("You must be logged in to perform this action");
  }
  
  // Validate questions if they're provided as a string
  let validatedQuestions: TestQuestion[] = [];
  if (typeof testData.questions === 'string') {
    try {
      validatedQuestions = JSON.parse(testData.questions);
      
      // Validate each question has required fields
      validatedQuestions.forEach(q => {
        if (!q.id || !q.type || !q.question || !q.timeAllowed) {
          throw new Error(`Invalid question format: ${JSON.stringify(q)}`);
        }
        
        // Validate MCQ questions have options and a valid correctAnswer
        if (q.type === 'mcq') {
          if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
            throw new Error(`MCQ question must have at least 2 options: ${JSON.stringify(q)}`);
          }
          
          if (typeof q.correctAnswer !== 'number' || q.correctAnswer < 0 || q.correctAnswer >= q.options.length) {
            throw new Error(`MCQ question must have a valid correctAnswer index: ${JSON.stringify(q)}`);
          }
        }
      });
    } catch (error: any) {
      console.error("Error parsing questions:", error);
      throw new Error(`Invalid questions format: ${error.message || 'Unknown error'}`);
    }
  }
  
  const testsRef = collection(db, "tests");
  
  // Prepare the test document
  const test: Omit<Test, 'id'> = {
    ...testData,
    questions: validatedQuestions,
    createdAt: serverTimestamp(),
    createdBy: auth.currentUser.uid,
    status: "active"
  };
  
  try {
    const docRef = await addDoc(testsRef, test);
    return { id: docRef.id, ...test };
  } catch (error: any) {
    console.error("Error creating test:", error);
    throw new Error(`Failed to create test: ${error.message || 'Unknown error'}`);
  }
};

export const getTestsList = async () => {
  const testsRef = collection(db, "tests");
  const snapshot = await getDocs(testsRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const updateTest = async (id: string, data: any) => {
  // Make sure a user is authenticated before making the request
  if (!auth.currentUser) {
    throw new Error("You must be logged in to perform this action");
  }
  
  const testRef = doc(db, "tests", id);
  
  // Verify document exists
  const docSnap = await getDoc(testRef);
  if (!docSnap.exists()) {
    throw new Error("Test document doesn't exist");
  }
  
  // Basic updates that should always work - merge with existing data
  const updateData = {
    ...data,
    updatedAt: serverTimestamp(),
  };
  
  console.log("Updating test with data:", updateData);
  
  try {
    // First attempt - with updatedBy
    await updateDoc(testRef, {
      ...updateData,
      updatedBy: auth.currentUser.uid
    });
    
    // If successful, get the updated document to return
    const updatedDoc = await getDoc(testRef);
    return { id, ...updatedDoc.data() };
  } catch (error) {
    console.warn("Could not update with updatedBy, trying without it:", error);
    
    // Second attempt - without updatedBy
    await updateDoc(testRef, updateData);
    
    // If successful, get the updated document to return
    const updatedDoc = await getDoc(testRef);
    return { id, ...updatedDoc.data() };
  }
};

export const deleteTest = async (id: string) => {
  // Make sure a user is authenticated before making the request
  if (!auth.currentUser) {
    throw new Error("You must be logged in to perform this action");
  }
  
  const testRef = doc(db, "tests", id);
  return deleteDoc(testRef);
};

// Removed duplicate import

export const assignTest = async (assignment: Omit<TestAssignment, 'id' | 'assignedAt' | 'assignedBy' | 'status'>) => {
  // Make sure a user is authenticated before making the request
  if (!auth.currentUser) {
    throw new Error("You must be logged in to perform this action");
  }
  
  try {
    // Verify the application exists and is in a valid state for test assignment
    const applicationRef = doc(db, "internships", assignment.internshipId, "applications", assignment.applicationId);
    const applicationSnap = await getDoc(applicationRef);
    
    if (!applicationSnap.exists()) {
      throw new Error("Application not found");
    }
    
    const applicationData = applicationSnap.data() as Application;
    // In our new workflow, only form_approved applications can proceed to quiz (Round 2)
    const validStatuses: ApplicationStatus[] = ['form_approved'];
    
    if (!validStatuses.includes(applicationData.status)) {
      throw new Error(`Cannot assign test to application with status: ${applicationData.status}. Application must be in 'form_approved' status to proceed to Round 2 quiz.`);
    }
    
    // Verify the student ID in the application matches the provided student ID
    if (applicationData.studentId !== assignment.studentId) {
      throw new Error("Student ID in application does not match the provided student ID");
    }
    
    // Verify the internship ID in the application matches the provided internship ID
    if (applicationData.internshipId !== assignment.internshipId) {
      throw new Error("Internship ID in application does not match the provided internship ID");
    }
    
    // Verify the test exists
    const testRef = doc(db, "tests", assignment.testId);
    const testSnap = await getDoc(testRef);
    
    if (!testSnap.exists()) {
      throw new Error("Test not found");
    }
    
    // Verify the student exists
    const studentRef = doc(db, "students", assignment.studentId);
    const studentSnap = await getDoc(studentRef);
    
    if (!studentSnap.exists()) {
      throw new Error("Student not found");
    }
    
    // Verify the internship exists
    const internshipRef = doc(db, "internships", assignment.internshipId);
    const internshipSnap = await getDoc(internshipRef);
    
    if (!internshipSnap.exists()) {
      throw new Error("Internship not found");
    }
    
    // Check if a test is already assigned for this application
    const assignmentsRef = collection(db, "testsAssigned");
    const q = query(assignmentsRef, where("applicationId", "==", assignment.applicationId));
    const existingAssignments = await getDocs(q);
    
    if (!existingAssignments.empty) {
      throw new Error("A test is already assigned for this application");
    }
    
    // Create the test assignment
    const assignmentData: Omit<TestAssignment, 'id'> = {
      ...assignment,
      assignedAt: serverTimestamp(),
      assignedBy: auth.currentUser.uid,
      status: "assigned"
    };
    
    // Use a transaction to ensure both operations succeed or fail together
    return await runTransaction(db, async (transaction: Transaction) => {
      // Create the test assignment
      const assignmentRef = doc(collection(db, "testsAssigned"));
      transaction.set(assignmentRef, assignmentData);
      
      // Update the application status with more explicit fields
      const statusUpdateData = {
        status: 'test_assigned' as ApplicationStatus, // Keep using test_assigned for backward compatibility
        currentRound: 2, // Update to Round 2 (quiz)
        updatedAt: serverTimestamp(),
        testAssignmentId: assignmentRef.id, // Add reference to the test assignment
        testAssignedAt: serverTimestamp(), // Add timestamp for when test was assigned
        testId: assignment.testId, // Add direct reference to the test ID
        // Add round tracking information
        rounds: updateApplicationRounds(applicationData.rounds || [], 1, 'passed', 'Form approved for Round 2 quiz')
      };
      
      console.log('Updating application status with:', statusUpdateData);
      transaction.update(applicationRef, statusUpdateData);
      
      // Return the assignment with its ID
      return { id: assignmentRef.id, ...assignmentData };
    });
    
    // After transaction completes, verify the update was successful
    // This runs outside the transaction and is just for debugging
    const verifyApp = await getDoc(applicationRef);
    console.log('Application status after update:', verifyApp.data()?.status);
    console.log('Application currentRound after update:', verifyApp.data()?.currentRound);
  } catch (error: any) {
    console.error("Error assigning test:", error);
    throw new Error(`Failed to assign test: ${error.message || 'Unknown error'}`);
  }
};

export const getTestAssignments = async () => {
  const assignmentsRef = collection(db, "testsAssigned");
  const snapshot = await getDocs(assignmentsRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Get test assignments that are completed and pending review
export const getPendingTestReviews = async () => {
  // Make sure a user is authenticated before making the request
  if (!auth.currentUser) {
    throw new Error("You must be logged in to perform this action");
  }
  
  const assignmentsRef = collection(db, "testsAssigned");
  const q = query(assignmentsRef, where("status", "==", "completed"));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Get a specific test assignment with detailed information
export const getTestAssignmentDetails = async (assignmentId: string) => {
  // Make sure a user is authenticated before making the request
  if (!auth.currentUser) {
    throw new Error("You must be logged in to perform this action");
  }
  
  const assignmentRef = doc(db, "testsAssigned", assignmentId);
  const assignmentSnap = await getDoc(assignmentRef);
  
  if (!assignmentSnap.exists()) {
    throw new Error("Test assignment not found");
  }
  
  const assignmentData = assignmentSnap.data() as TestAssignment;
  
  // Get the test details
  const testRef = doc(db, "tests", assignmentData.testId);
  const testSnap = await getDoc(testRef);
  
  if (!testSnap.exists()) {
    throw new Error("Test not found");
  }
  
  const testData = testSnap.data() as Test;
  
  // Get the student details
  const studentRef = doc(db, "students", assignmentData.studentId);
  const studentSnap = await getDoc(studentRef);
  
  if (!studentSnap.exists()) {
    throw new Error("Student not found");
  }
  
  const studentData = studentSnap.data() as Student;
  
  // Get the application details
  const applicationRef = doc(db, "applications", assignmentData.applicationId);
  const applicationSnap = await getDoc(applicationRef);
  
  if (!applicationSnap.exists()) {
    throw new Error("Application not found");
  }
  
  const applicationData = applicationSnap.data() as Application;
  
  return {
    assignment: { id: assignmentId, ...assignmentData },
    test: { id: assignmentData.testId, ...testData },
    student: { id: assignmentData.studentId, ...studentData },
    application: { id: assignmentData.applicationId, ...applicationData }
  };
};

// Approve a completed test and advance to the next round
export const approveTestResult = async (assignmentId: string, feedback?: string, advanceToNextRound: boolean = true) => {
  // Make sure a user is authenticated before making the request
  if (!auth.currentUser) {
    throw new Error("You must be logged in to perform this action");
  }
  
  try {
    // Use a transaction to ensure all updates are atomic
    return await runTransaction(db, async (transaction: Transaction) => {
      // Get the test assignment
      const assignmentRef = doc(db, "testsAssigned", assignmentId);
      const assignmentSnap = await transaction.get(assignmentRef);
      
      if (!assignmentSnap.exists()) {
        throw new Error("Test assignment not found");
      }
      
      const assignmentData = assignmentSnap.data() as TestAssignment;
      
      if (assignmentData.status !== "completed") {
        throw new Error(`Cannot approve test with status: ${assignmentData.status}`);
      }
      
      // Get the application
      const applicationRef = doc(db, "internships", assignmentData.internshipId, "applications", assignmentData.applicationId);
      const applicationSnap = await transaction.get(applicationRef);
      
      if (!applicationSnap.exists()) {
        throw new Error("Application not found");
      }
      
      const applicationData = applicationSnap.data() as Application;
      const currentRound = applicationData.currentRound || 1;
      const rounds = applicationData.rounds || [];
      
      // Find the current round
      const roundIndex = rounds.findIndex(r => r.roundNumber === currentRound);
      
      // Update the test assignment status
      transaction.update(assignmentRef, {
        status: "approved",
        feedback: feedback || "",
        reviewedAt: serverTimestamp(),
        reviewedBy: auth.currentUser?.uid || 'unknown'
      });
      
      // Update the application with round information  
      let updatedRounds = [...rounds];
      let newStatus: ApplicationStatus = "quiz_approved"; // Use the new quiz_approved status
      let newCurrentRound = currentRound;
      
      if (roundIndex >= 0) {
        // Update existing round
        updatedRounds[roundIndex] = {
          ...updatedRounds[roundIndex],
          status: 'passed',
          feedback: feedback || "",
          evaluatedAt: serverTimestamp(),
          evaluatedBy: auth.currentUser?.uid || 'unknown'
        };
      } else {
        // Add new round
        updatedRounds.push({
          roundNumber: currentRound,
          status: 'passed',
          testAssignmentId: assignmentId,
          feedback: feedback || "",
          evaluatedAt: serverTimestamp(),
          evaluatedBy: auth.currentUser?.uid || 'unknown'
        });
      }
      
      // If advancing to next round
      if (advanceToNextRound) {
        newCurrentRound = currentRound + 1;
        
        // Add next round as pending
        updatedRounds.push({
          roundNumber: newCurrentRound,
          status: 'pending'
        });
      } else {
        // If not advancing, mark as selected (final approval)
        newStatus = "selected";
      }
      
      // Update the application
      transaction.update(applicationRef, {
        status: newStatus,
        currentRound: newCurrentRound,
        rounds: updatedRounds,
        updatedAt: serverTimestamp()
      });
      
      return { 
        id: assignmentId, 
        ...assignmentData, 
        status: "approved",
        application: {
          id: applicationData.id,
          status: newStatus,
          currentRound: newCurrentRound
        }
      };
    });
  } catch (error: any) {
    console.error("Error approving test result:", error);
    throw new Error(`Failed to approve test: ${error.message || 'Unknown error'}`);
  }
};

// Helper function to update application rounds
const updateApplicationRounds = (rounds: ApplicationRound[], roundNumber: number, status: RoundStatus, feedback?: string, evaluatedBy?: string): ApplicationRound[] => {
  const clientTimestamp = new Date();
  const roundIndex = rounds.findIndex(r => r.roundNumber === roundNumber);
  
  if (roundIndex >= 0) {
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

// Delete a test assignment
export const deleteTestAssignment = async (assignmentId: string) => {
  // Make sure a user is authenticated before making the request
  if (!auth.currentUser) {
    throw new Error("You must be logged in to perform this action");
  }
  
  try {
    // Get the test assignment
    const assignmentRef = doc(db, "testsAssigned", assignmentId);
    const assignmentSnap = await getDoc(assignmentRef);
    
    if (!assignmentSnap.exists()) {
      throw new Error("Test assignment not found");
    }
    
    // Only allow deleting assignments that haven't been completed
    const assignmentData = assignmentSnap.data() as TestAssignment;
    if (assignmentData.status === "completed") {
      throw new Error("Cannot delete a completed test assignment");
    }
    
    // Delete the test assignment
    await deleteDoc(assignmentRef);
    
    return { success: true, id: assignmentId };
  } catch (error: any) {
    console.error("Error deleting test assignment:", error);
    throw new Error(`Failed to delete test assignment: ${error.message || 'Unknown error'}`);
  }
};

// Reject a completed test
export const rejectTestResult = async (assignmentId: string, feedback: string) => {
  // Make sure a user is authenticated before making the request
  if (!auth.currentUser) {
    throw new Error("You must be logged in to perform this action");
  }
  
  if (!feedback) {
    throw new Error("Feedback is required when rejecting a test");
  }
  
  try {
    // Use a transaction to ensure all updates are atomic
    return await runTransaction(db, async (transaction: Transaction) => {
      // Get the test assignment
      const assignmentRef = doc(db, "testsAssigned", assignmentId);
      const assignmentSnap = await transaction.get(assignmentRef);
      
      if (!assignmentSnap.exists()) {
        throw new Error("Test assignment not found");
      }
      
      const assignmentData = assignmentSnap.data() as TestAssignment;
      
      if (assignmentData.status !== "completed") {
        throw new Error(`Cannot reject test with status: ${assignmentData.status}`);
      }
      
      // Get the application
      const applicationRef = doc(db, "internships", assignmentData.internshipId, "applications", assignmentData.applicationId);
      const applicationSnap = await transaction.get(applicationRef);
      
      if (!applicationSnap.exists()) {
        throw new Error("Application not found");
      }
      
      const applicationData = applicationSnap.data() as Application;
      const currentRound = applicationData.currentRound || 1;
      const rounds = applicationData.rounds || [];
      
      // Find the current round
      const roundIndex = rounds.findIndex(r => r.roundNumber === currentRound);
      
      // Update the test assignment status
      transaction.update(assignmentRef, {
        status: "rejected",
        feedback: feedback,
        reviewedAt: serverTimestamp(),
        reviewedBy: auth.currentUser?.uid || 'unknown'
      });
      
      // Update the application with round information
      let updatedRounds = [...rounds];
      
      if (roundIndex >= 0) {
        // Update existing round
        updatedRounds[roundIndex] = {
          ...updatedRounds[roundIndex],
          status: 'failed',
          feedback: feedback,
          evaluatedAt: serverTimestamp(),
          evaluatedBy: auth.currentUser?.uid || 'unknown'
        };
      } else {
        // Add new round
        updatedRounds.push({
          roundNumber: currentRound,
          status: 'failed',
          testAssignmentId: assignmentId,
          feedback: feedback,
          evaluatedAt: serverTimestamp(),
          evaluatedBy: auth.currentUser?.uid || 'unknown'
        });
      }
      
      // Update the application
      transaction.update(applicationRef, {
        status: 'quiz_rejected' as ApplicationStatus, // Use the new quiz_rejected status
        rounds: updatedRounds,
        updatedAt: serverTimestamp()
      });
      
      return { 
        id: assignmentId, 
        ...assignmentData, 
        status: "rejected",
        application: {
          id: applicationData.id,
          status: 'quiz_rejected' as ApplicationStatus,
          currentRound: currentRound
        }
      };
    });
  } catch (error: any) {
    console.error("Error rejecting test result:", error);
    throw new Error(`Failed to reject test: ${error.message || 'Unknown error'}`);
  }
};

export const getApplications = async () => {
  const applicationsRef = collection(db, "applications");
  const snapshot = await getDocs(applicationsRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Get applications by internship ID
export const getApplicationsByInternship = async (internshipId: string) => {
  if (!internshipId) {
    throw new Error("Internship ID is required");
  }
  
  const applicationsRef = collection(db, "internships", internshipId, "applications");
  const snapshot = await getDocs(applicationsRef);
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Application }));
};

export const getActiveUserCount = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const studentsRef = collection(db, "students");
  const facultyRef = collection(db, "faculty");
  
  // Get active students
  const studentQuery = query(studentsRef, where("lastActive", ">=", today));
  const studentSnapshot = await getDocs(studentQuery);
  
  // Get active faculty
  const facultyQuery = query(facultyRef, where("lastActive", ">=", today));
  const facultySnapshot = await getDocs(facultyQuery);
  
  return studentSnapshot.size + facultySnapshot.size;
};

// Realtime listeners
export const onStudentsChange = (callback: (students: any[]) => void) => {
  const studentsRef = collection(db, "students");
  return onSnapshot(studentsRef, (snapshot) => {
    const students = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(students);
  });
};

export const onFacultyChange = (callback: (faculty: any[]) => void) => {
  const facultyRef = collection(db, "faculty");
  return onSnapshot(facultyRef, (snapshot) => {
    const faculty = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(faculty);
  });
};

export const onInternshipsChange = (callback: (internships: any[]) => void) => {
  const internshipsRef = collection(db, "internships");
  
  // First, get the faculty data to create a lookup map
  getDocs(collection(db, "faculty")).then(facultySnapshot => {
    const facultyMap: Record<string, string> = {};
    facultySnapshot.docs.forEach(doc => {
      const facultyData = doc.data();
      facultyMap[doc.id] = facultyData.name;
    });
    
    // Now set up the real-time listener with faculty names attached
    return onSnapshot(internshipsRef, (snapshot) => {
      const internships = snapshot.docs.map(doc => {
        const data = doc.data();
        const internship: any = { id: doc.id, ...data };
        
        // Attach faculty name if available
        if (internship.facultyId && facultyMap[internship.facultyId]) {
          internship.facultyName = facultyMap[internship.facultyId];
        }
        
        return internship;
      });
      
      callback(internships);
    });
  }).catch(error => {
    console.error("Error setting up internships listener with faculty data:", error);
    
    // Fallback to basic listener if faculty lookup fails
    return onSnapshot(internshipsRef, (snapshot) => {
      const internships = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(internships);
    });
  });
};

export const onApplicationsChange = (callback: (applications: any[]) => void) => {
  const applicationsRef = collection(db, "applications");
  return onSnapshot(applicationsRef, (snapshot) => {
    const applications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(applications);
  });
};

export const onTestsChange = (callback: (tests: any[]) => void) => {
  const testsRef = collection(db, "tests");
  return onSnapshot(testsRef, (snapshot) => {
    const tests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(tests);
  });
};

export const onTestAssignmentsChange = (callback: (assignments: any[]) => void) => {
  const assignmentsRef = collection(db, "testsAssigned");
  return onSnapshot(assignmentsRef, (snapshot) => {
    const assignments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(assignments);
  });
};

// Helper function to update faculty internship count
export const updateFacultyInternshipCount = async (facultyId: string) => {
  // Make sure a user is authenticated before making the request
  if (!auth.currentUser) {
    throw new Error("You must be logged in to perform this action");
  }
  
  console.log(`Updating internship count for faculty ID: ${facultyId}`);
  
  try {
    // Get all internships for this faculty
    const internshipsRef = collection(db, "internships");
    const q = query(internshipsRef, where("facultyId", "==", facultyId));
    const snapshot = await getDocs(q);
    const count = snapshot.size;
    
    console.log(`Found ${count} internships for faculty ID: ${facultyId}`);
    
    // Update the faculty document with the count
    const facultyRef = doc(db, "faculty", facultyId);
    
    // Check if faculty exists
    const facultyDoc = await getDoc(facultyRef);
    if (!facultyDoc.exists()) {
      throw new Error(`Faculty document with ID ${facultyId} doesn't exist`);
    }
    
    // Update the count
    await updateDoc(facultyRef, {
      internshipsPosted: count,
      updatedAt: serverTimestamp()
    });
    
    console.log(`Successfully updated internship count to ${count} for faculty ID: ${facultyId}`);
    
    return count;
  } catch (error) {
    console.error(`Error updating internship count for faculty ID: ${facultyId}`, error);
    throw error;
  }
};

// Helper function for handling Firebase errors
export const handleFirebaseError = (error: any): string => {
  console.error("Firebase error:", error);
  
  if (error.code === 'permission-denied') {
    return "You don't have permission to perform this action. Please contact your administrator.";
  } 
  
  if (error.code?.includes('auth/')) {
    return `Authentication error: ${error.message}`;
  }
  
  if (error.code?.includes('firestore/')) {
    return `Database error: ${error.message}`;
  }
  
  return error.message || "An unexpected error occurred. Please try again.";
};

export { auth, db };
