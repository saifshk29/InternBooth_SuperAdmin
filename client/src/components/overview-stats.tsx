import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  trend: number;
  icon: ReactNode;
  iconBg: string;
  iconColor: string;
}

export function StatCard({ title, value, trend, icon, iconBg, iconColor }: StatCardProps) {
  const isPositive = trend >= 0;
  
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex justify-between">
          <div>
            <p className="text-gray-500 text-sm">{title}</p>
            <h3 className="text-2xl font-bold mt-1">{value}</h3>
            <p className={cn(
              "text-xs flex items-center mt-2",
              isPositive ? "text-success" : "text-danger"
            )}>
              {isPositive ? (
                <ArrowUpIcon className="h-3 w-3 mr-1" />
              ) : (
                <ArrowDownIcon className="h-3 w-3 mr-1" />
              )}
              <span>{Math.abs(trend)}% since last month</span>
            </p>
          </div>
          <div className={cn(
            "h-12 w-12 rounded-lg flex items-center justify-center",
            iconBg, iconColor
          )}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface OverviewStatsProps {
  data: {
    students: { total: number, trend: number },
    faculty: { total: number, trend: number },
    activeUsers: { total: number, trend: number },
    internships: { total: number, trend: number }
  }
}

export default function OverviewStats({ data }: OverviewStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      <StatCard 
        title="Total Students"
        value={data.students.total}
        trend={data.students.trend}
        icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user text-xl"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
        iconBg="bg-indigo-100"
        iconColor="text-primary"
      />
      
      <StatCard 
        title="Total Faculty"
        value={data.faculty.total}
        trend={data.faculty.trend}
        icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user-cog text-xl"><circle cx="12" cy="8" r="5"/><path d="M20 16.2A5 5 0 0 1 18 17H6a5 5 0 0 1-4-2"/><path d="M16 4.6A13.9 13.9 0 0 0 12 4c-2.2 0-5 .5-7.3 2.2"/></svg>}
        iconBg="bg-violet-100"
        iconColor="text-secondary"
      />
      
      <StatCard 
        title="Active Users Today"
        value={data.activeUsers.total}
        trend={data.activeUsers.trend}
        icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users text-xl"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
        iconBg="bg-green-100"
        iconColor="text-success"
      />
      
      <StatCard 
        title="Total Internships"
        value={data.internships.total}
        trend={data.internships.trend}
        icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-briefcase text-xl"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>}
        iconBg="bg-yellow-100"
        iconColor="text-warning"
      />
    </div>
  );
}
