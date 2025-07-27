import { Eye, CheckCircle, Clock } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { getInitials, formatTimeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Application {
  id: string;
  student: {
    id: string;
    name: string;
    avatar?: string;
  };
  internship: {
    id: string;
    title: string;
    company: string;
  };
  appliedAt: string;
  status: "pending" | "test_assigned" | "test_completed";
}

interface RecentApplicationsProps {
  applications: Application[];
  onViewApplication: (id: string) => void;
  onAssignTest: (id: string) => void;
}

export default function RecentApplications({ 
  applications, 
  onViewApplication, 
  onAssignTest 
}: RecentApplicationsProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
            Pending Test
          </span>
        );
      case "test_assigned":
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
            Test Assigned
          </span>
        );
      case "test_completed":
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
            Test Completed
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
            Unknown
          </span>
        );
    }
  };

  const getActionButton = (status: string, applicationId: string) => {
    switch (status) {
      case "pending":
        return (
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-success hover:text-green-700"
            onClick={() => onAssignTest(applicationId)}
          >
            <CheckCircle className="h-4 w-4" />
          </Button>
        );
      case "test_assigned":
        return (
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-warning hover:text-yellow-700"
          >
            <Clock className="h-4 w-4" />
          </Button>
        );
      case "test_completed":
        return (
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-success hover:text-green-700"
          >
            <CheckCircle className="h-5 w-5" />
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="col-span-2">
      <CardHeader className="border-b px-5 py-4">
        <CardTitle className="font-heading font-semibold text-base">Recent Internship Applications</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs font-medium">Student</TableHead>
                <TableHead className="text-xs font-medium">Internship</TableHead>
                <TableHead className="text-xs font-medium">Applied On</TableHead>
                <TableHead className="text-xs font-medium">Status</TableHead>
                <TableHead className="text-xs font-medium">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((application) => (
                <TableRow key={application.id}>
                  <TableCell className="py-3 text-sm whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-primary mr-3">
                        <span>{getInitials(application.student.name)}</span>
                      </div>
                      <span className="font-medium">{application.student.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 text-sm whitespace-nowrap">
                    {application.internship.title} at {application.internship.company}
                  </TableCell>
                  <TableCell className="py-3 text-sm whitespace-nowrap text-gray-500">
                    {formatTimeAgo(application.appliedAt)}
                  </TableCell>
                  <TableCell className="py-3 text-sm whitespace-nowrap">
                    {getStatusBadge(application.status)}
                  </TableCell>
                  <TableCell className="py-3 text-sm whitespace-nowrap">
                    <div className="flex items-center">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-primary hover:text-indigo-800 mr-3"
                        onClick={() => onViewApplication(application.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {getActionButton(application.status, application.id)}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="p-4 text-center">
          <Button variant="link" className="text-primary hover:text-indigo-700">
            View All Applications
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
