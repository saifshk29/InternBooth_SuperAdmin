import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  getActiveUserCount, 
  getApplications, 
  getInternshipList, 
  getTestsList, 
  getTestAssignments 
} from "@/lib/firebase";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";

// Sample data structure for charts
const activityData = {
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

const applicationsData = {
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

const testPerformanceData = [
  { name: "90-100", value: 8 },
  { name: "80-90", value: 12 },
  { name: "70-80", value: 11 },
  { name: "60-70", value: 6 },
  { name: "Below 60", value: 3 },
];

const internshipDistributionData = [
  { name: "Computer Science", value: 35 },
  { name: "Electronics", value: 20 },
  { name: "Mechanical", value: 15 },
  { name: "Civil", value: 10 },
  { name: "Business", value: 20 },
];

const internshipSourceData = [
  { name: "Faculty Posted", value: 65 },
  { name: "Student Startup", value: 35 },
];

const COLORS = ['#6366F1', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

export default function Analytics() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [userDataPeriod, setUserDataPeriod] = useState<"week" | "month" | "quarter">("week");
  const [applicationsPeriod, setApplicationsPeriod] = useState<"week" | "month" | "quarter">("week");
  const [internshipDistribution, setInternshipDistribution] = useState<"department" | "source">("department");
  const [selectedTest, setSelectedTest] = useState<string>("all");
  
  const [statsData, setStatsData] = useState({
    activeUsers: 0,
    applications: 0,
    testsAssigned: 0,
    testsCompleted: 0,
    usersTrend: 0,
    applicationsTrend: 0,
    testsAssignedTrend: 0,
    testsCompletedTrend: 0
  });
  
  const [tests, setTests] = useState<any[]>([]);
  
  // Fetch analytics data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch stats data
        const activeUsers = await getActiveUserCount();
        const applications = await getApplications();
        const testAssignments = await getTestAssignments();
        const testsList = await getTestsList();
        
        setTests(testsList);
        
        const testsAssigned = testAssignments.length;
        const testsCompleted = testAssignments.filter(
          assignment => assignment.status === "completed"
        ).length;
        
        setStatsData({
          activeUsers,
          applications: applications.length,
          testsAssigned,
          testsCompleted,
          usersTrend: 18,
          applicationsTrend: -5,
          testsAssignedTrend: 12,
          testsCompletedTrend: 30
        });
      } catch (error) {
        console.error("Error fetching analytics data:", error);
        toast({
          variant: "destructive",
          title: "Error fetching analytics",
          description: "Failed to load analytics data. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [toast]);
  
  // Handle export data
  const handleExportData = () => {
    toast({
      title: "Export initiated",
      description: "Analytics data export has started.",
    });
    
    // In a real application, this would trigger a download of analytics data
    setTimeout(() => {
      toast({
        title: "Export completed",
        description: "Analytics data has been exported successfully.",
      });
    }, 1500);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-heading font-bold">Platform Analytics</h1>
        <div className="flex gap-3">
          <Select
            defaultValue="week"
            onValueChange={(value) => {
              setUserDataPeriod(value as "week" | "month" | "quarter");
              setApplicationsPeriod(value as "week" | "month" | "quarter");
            }}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last 7 days</SelectItem>
              <SelectItem value="month">Last 30 days</SelectItem>
              <SelectItem value="quarter">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExportData}>
            <Download className="mr-2 h-4 w-4" />
            <span>Export</span>
          </Button>
        </div>
      </div>
      
      {/* Analytics Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="border-l-4 border-primary">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm">Active Users Today</p>
                <h3 className="text-2xl font-bold mt-1">{statsData.activeUsers}</h3>
                <p className="text-xs flex items-center mt-2 text-success">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="18 15 12 9 6 15"></polyline>
                  </svg>
                  <span>{statsData.usersTrend}% from yesterday</span>
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-secondary">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm">Internship Applications</p>
                <h3 className="text-2xl font-bold mt-1">{statsData.applications}</h3>
                <p className="text-xs flex items-center mt-2 text-danger">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                  <span>{Math.abs(statsData.applicationsTrend)}% from yesterday</span>
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-violet-100 flex items-center justify-center text-secondary">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-success">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm">Tests Assigned</p>
                <h3 className="text-2xl font-bold mt-1">{statsData.testsAssigned}</h3>
                <p className="text-xs flex items-center mt-2 text-success">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="18 15 12 9 6 15"></polyline>
                  </svg>
                  <span>{statsData.testsAssignedTrend}% from yesterday</span>
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center text-success">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-warning">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm">Tests Completed</p>
                <h3 className="text-2xl font-bold mt-1">{statsData.testsCompleted}</h3>
                <p className="text-xs flex items-center mt-2 text-success">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="18 15 12 9 6 15"></polyline>
                  </svg>
                  <span>{statsData.testsCompletedTrend}% from yesterday</span>
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-yellow-100 flex items-center justify-center text-warning">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="font-heading font-semibold text-base">User Activity</CardTitle>
            <Select
              value={userDataPeriod}
              onValueChange={(value) => setUserDataPeriod(value as "week" | "month" | "quarter")}
            >
              <SelectTrigger className="w-[150px] h-9 text-sm bg-gray-100 border-0">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Last 7 days</SelectItem>
                <SelectItem value="month">Last 30 days</SelectItem>
                <SelectItem value="quarter">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={activityData[userDataPeriod]}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="value"
                    name="Active Users"
                    stroke="#6366F1"
                    activeDot={{ r: 8 }}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="font-heading font-semibold text-base">Internship Distribution</CardTitle>
            <Select
              value={internshipDistribution}
              onValueChange={(value) => setInternshipDistribution(value as "department" | "source")}
            >
              <SelectTrigger className="w-[150px] h-9 text-sm bg-gray-100 border-0">
                <SelectValue placeholder="Group by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="department">By Department</SelectItem>
                <SelectItem value="source">By Type (Faculty/Startup)</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={internshipDistribution === "department" ? internshipDistributionData : internshipSourceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {(internshipDistribution === "department" ? internshipDistributionData : internshipSourceData).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value}`, name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="font-heading font-semibold text-base">Internship Applications</CardTitle>
            <Select
              value={applicationsPeriod}
              onValueChange={(value) => setApplicationsPeriod(value as "week" | "month" | "quarter")}
            >
              <SelectTrigger className="w-[150px] h-9 text-sm bg-gray-100 border-0">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Last 7 days</SelectItem>
                <SelectItem value="month">Last 30 days</SelectItem>
                <SelectItem value="quarter">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={applicationsData[applicationsPeriod]}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" name="Applications" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="font-heading font-semibold text-base">Test Performance</CardTitle>
            <Select
              value={selectedTest}
              onValueChange={setSelectedTest}
            >
              <SelectTrigger className="w-[180px] h-9 text-sm bg-gray-100 border-0">
                <SelectValue placeholder="Select test" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tests</SelectItem>
                {tests.map(test => (
                  <SelectItem key={test.id} value={test.id}>
                    {test.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={testPerformanceData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 40,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" name="Students" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Platform Health */}
      <Card>
        <CardHeader className="border-b px-5 py-4">
          <CardTitle className="font-heading font-semibold text-base">Platform Health</CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-4 border rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <p className="font-medium">Avg. Response Time</p>
                <span className="text-success font-medium">245 ms</span>
              </div>
              <div className="bg-gray-200 rounded-full h-2">
                <div className="bg-success rounded-full h-2" style={{ width: '85%' }}></div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Excellent performance</p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <p className="font-medium">Error Rate</p>
                <span className="text-success font-medium">0.4%</span>
              </div>
              <div className="bg-gray-200 rounded-full h-2">
                <div className="bg-success rounded-full h-2" style={{ width: '96%' }}></div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Below threshold (1%)</p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <p className="font-medium">Database Usage</p>
                <span className="text-warning font-medium">75%</span>
              </div>
              <div className="bg-gray-200 rounded-full h-2">
                <div className="bg-warning rounded-full h-2" style={{ width: '75%' }}></div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Consider optimization</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
