import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TestResult {
  id: string;
  name: string;
  completedCount: number;
  averageScore: number;
}

interface TestResultsProps {
  testResults: TestResult[];
}

export default function TestResults({ testResults }: TestResultsProps) {
  return (
    <Card>
      <CardHeader className="border-b px-5 py-4">
        <CardTitle className="font-heading font-semibold text-base">Test Results Overview</CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        <div className="space-y-4">
          {testResults.map((result) => (
            <div key={result.id} className="p-4 border rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{result.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{result.completedCount} students completed</p>
                </div>
                <span 
                  className={cn(
                    "text-sm font-medium",
                    result.averageScore >= 75 ? "text-success" : 
                    result.averageScore >= 60 ? "text-warning" : "text-danger"
                  )}
                >
                  {result.averageScore}% avg. score
                </span>
              </div>
              <div className="mt-3 bg-gray-200 rounded-full h-2">
                <div 
                  className={cn(
                    "rounded-full h-2",
                    result.averageScore >= 75 ? "bg-success" : 
                    result.averageScore >= 60 ? "bg-warning" : "bg-danger"
                  )} 
                  style={{ width: `${result.averageScore}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-center">
          <Button variant="link" className="text-primary hover:text-indigo-700">
            View All Test Results
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
