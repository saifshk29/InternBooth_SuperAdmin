import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import OverviewStats from "@/components/overview-stats";
import ActivityChart from "@/components/charts/activity-chart";
import ApplicationsChart from "@/components/charts/applications-chart";
import RecentApplications from "@/components/dashboard/recent-applications";
import TestResults from "@/components/dashboard/test-results";
import { 
  getStudentList, 
  getFacultyList, 
  getActiveUserCount, 
  getInternshipList,
  getApplications,
  assignTest
} from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";

// Sample chart data (typically this would come from your backend)
const sampleActivityData = {
  week: [
    { name: "Mon", value: 145 },
    { name: "Tue", value: 213 },
    { name: "Wed", value: 278 },
    { name: "Thu", value: 259 },
    { name: "Fri", value: 305 },
    { name: "Sat", value: 187 },
    { name: "Sun", value: 152 },
  ],
  month: [
    { name: "Week 1", value: 1250 },
    { name: "Week 2", value: 1450 },
    { name: "Week 3", value: 1320 },
    { name: "Week 4", value: 1490 },
  ],
  quarter: [
    { name: "Jan", value: 4200 },
    { name: "Feb", value: 3800 },
    { name: "Mar", value: 5100 },
  ],
};

const sampleApplicationsData = {
  week: [
    { name: "Mon", value: 12 },
    { name: "Tue", value: 18 },
    { name: "Wed", value: 25 },
    { name: "Thu", value: 15 },
    { name: "Fri", value: 22 },
    { name: "Sat", value: 8 },
    { name: "Sun", value: 5 },
  ],
  month: [
    { name: "Week 1", value: 78 },
    { name: "Week 2", value: 92 },
    { name: "Week 3", value: 85 },
    { name: "Week 4", value: 110 },
  ],
  quarter: [
    { name: "Jan", value: 320 },
    { name: "Feb", value: 290 },
    { name: "Mar", value: 385 },
  ],
};

const sampleTestResults = [
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

export default function Home() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }));
  
  const [dashboardData, setDashboardData] = useState({
    students: { total: 0, trend: 12 },
    faculty: { total: 0, trend: 5 },
    activeUsers: { total: 0, trend: -3 },
    internships: { total: 0, trend: 18 },
  });
  
  const [applications, setApplications] = useState<any[]>([]);
  
  useEffect(() => {
    // Fetch dashboard data
    const fetchDashboardData = async () => {
      try {
        const students = await getStudentList();
        const faculty = await getFacultyList();
        const activeUsers = await getActiveUserCount();
        const internships = await getInternshipList();
        
        setDashboardData({
          students: { total: students.length, trend: 12 },
          faculty: { total: faculty.length, trend: 5 },
          activeUsers: { total: activeUsers, trend: -3 },
          internships: { total: internships.length, trend: 18 },
        });
        
        // Fetch applications
        const applicationsData = await getApplications();
        const formattedApplications = applicationsData.slice(0, 3).map((app: any) => ({
          id: app.id,
          student: {
            id: app.studentId,
            name: app.studentName || "Student Name",
          },
          internship: {
            id: app.internshipId,
            title: app.internshipTitle || "Position",
            company: app.companyName || "Company",
          },
          appliedAt: app.createdAt?.toDate() || new Date(),
          status: app.status || "pending",
        }));
        
        setApplications(formattedApplications);
      } catch (error: any) {
        console.error("Error fetching dashboard data:", error);
        
        // More specific error message for permission denied
        if (error.code === "permission-denied") {
          toast({
            variant: "destructive",
            title: "Permission Denied",
            description: "You don't have access to this data. Please make sure your Firebase security rules are configured correctly.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Error fetching data",
            description: error.message || "Failed to load dashboard data. Please try again.",
          });
        }
      }
    };
    
    fetchDashboardData();
  }, [toast]);
  
  const handleViewApplication = (id: string) => {
    navigate(`/superadmin/manage-internships?application=${id}`);
  };
  
  const handleAssignTest = async (id: string) => {
    try {
      // In a real app, you'd open a modal to select a test
      const application = applications.find(app => app.id === id);
      
      if (application) {
        await assignTest({
          applicationId: id,
          studentId: application.student.id,
          internshipId: application.internship.id,
          testId: "sample-test-id", // In real app, user would select this
          testName: "Web Development Test" // In real app, user would select this
        });
        
        toast({
          title: "Test assigned",
          description: `Test has been assigned to ${application.student.name}`,
        });
        
        // Update the local state
        setApplications(applications.map(app => 
          app.id === id ? { ...app, status: "test_assigned" } : app
        ));
      }
    } catch (error: any) {
      console.error("Error assigning test:", error);
      
      // More specific error message for permission denied
      if (error.code === "permission-denied") {
        toast({
          variant: "destructive",
          title: "Permission Denied",
          description: "You don't have permission to assign tests. Please check your Firebase security rules.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error assigning test",
          description: error.message || "Failed to assign test. Please try again.",
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-heading font-bold">Welcome back, Super Admin!</h1>
        <div>
          <span className="text-sm text-gray-500">Today: </span>
          <span className="text-sm font-medium">{currentDate}</span>
        </div>
      </div>
      
      {/* Stats Overview */}
      <OverviewStats data={dashboardData} />
      
      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ActivityChart 
          title="Weekly Active Students" 
          data={sampleActivityData}
        />
        <ApplicationsChart 
          title="Internship Applications" 
          data={sampleApplicationsData}
        />
      </div>
      
      {/* Recent Activity & Test Results */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <RecentApplications 
          applications={applications}
          onViewApplication={handleViewApplication}
          onAssignTest={handleAssignTest}
        />
        <TestResults 
          testResults={sampleTestResults}
        />
      </div>
    </div>
  );
}
