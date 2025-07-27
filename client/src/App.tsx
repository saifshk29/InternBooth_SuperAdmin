import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Auth from "@/pages/login"; // The auth component (login + register)
import Home from "@/pages/home";
import ManageFaculty from "@/pages/manage-faculty";
import ManageStudents from "@/pages/manage-students";
import ManageInternships from "@/pages/manage-internships";
import ManageTests from "@/pages/manage-tests";
import Analytics from "@/pages/analytics";
import EvaluateInternshipPage from "@/pages/EvaluateInternshipPage"; // Import the new page
import DashboardLayout from "@/components/dashboard-layout";
import { AuthProvider } from "@/hooks/use-auth";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const [_, setLocation] = useLocation();
  // Check if authenticated, redirect to login if not
  const isAuthenticated = localStorage.getItem("superAdmin");

  // If user is not authenticated, redirect to login
  if (!isAuthenticated) {
    // Use setTimeout to avoid state updates during render
    setTimeout(() => {
      setLocation("/login");
    }, 0);
    return null;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Auth} />
      
      <Route path="/superadmin">
        <DashboardLayout>
          <Route path="/superadmin" component={Home} />
        </DashboardLayout>
      </Route>
      
      <Route path="/superadmin/manage-faculty">
        <DashboardLayout>
          <ProtectedRoute component={ManageFaculty} />
        </DashboardLayout>
      </Route>
      
      <Route path="/superadmin/manage-students">
        <DashboardLayout>
          <ProtectedRoute component={ManageStudents} />
        </DashboardLayout>
      </Route>
      
      <Route path="/superadmin/manage-internships">
        <DashboardLayout>
          <ProtectedRoute component={ManageInternships} />
        </DashboardLayout>
      </Route>
      
      <Route path="/superadmin/manage-tests">
        <DashboardLayout>
          <ProtectedRoute component={ManageTests} />
        </DashboardLayout>
      </Route>
      
      <Route path="/superadmin/analytics">
        <DashboardLayout>
          <ProtectedRoute component={Analytics} />
        </DashboardLayout>
      </Route>
      
      <Route path="/superadmin/evaluate-internship/:internshipId">
        <DashboardLayout>
          <ProtectedRoute component={EvaluateInternshipPage} />
        </DashboardLayout>
      </Route>
      
      <Route path="/">
        <DashboardLayout>
          <ProtectedRoute component={Home} />
        </DashboardLayout>
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
