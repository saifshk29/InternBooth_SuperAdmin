import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  UserCog, 
  User, 
  Briefcase, 
  FileText, 
  BarChart2,
  Settings,
  LogOut 
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Separator } from "@/components/ui/separator";

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export default function Sidebar({ open, setOpen }: SidebarProps) {
  const [location] = useLocation();
  const { logout } = useAuth();
  
  const handleLogout = async () => {
    await logout();
  };
  
  const navigationItems = [
    { href: "/superadmin", label: "Home", icon: <LayoutDashboard className="h-5 w-5" /> },
    { href: "/superadmin/manage-faculty", label: "Manage Faculty", icon: <UserCog className="h-5 w-5" /> },
    { href: "/superadmin/manage-students", label: "Manage Students", icon: <User className="h-5 w-5" /> },
    { href: "/superadmin/manage-internships", label: "Manage Internships", icon: <Briefcase className="h-5 w-5" /> },
    { href: "/superadmin/manage-tests", label: "Manage Tests", icon: <FileText className="h-5 w-5" /> },
    { href: "/superadmin/analytics", label: "Platform Analytics", icon: <BarChart2 className="h-5 w-5" /> },
  ];
  
  const accountItems = [
    { href: "#settings", label: "Settings", icon: <Settings className="h-5 w-5" /> },
    { href: "#logout", label: "Logout", icon: <LogOut className="h-5 w-5" />, onClick: handleLogout, danger: true },
  ];

  return (
    <aside 
      className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-auto",
        open ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-5 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
              <span className="text-white text-lg font-bold">C</span>
            </div>
            <h1 className="text-xl font-heading font-bold">Campus Intern</h1>
          </div>
        </div>
        
        {/* Navigation Links */}
        <nav className="p-4 flex-1 overflow-y-auto">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-4">Dashboard</p>
          <ul className="space-y-1">
            {navigationItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href} 
                  onClick={() => {
                    // Close sidebar on mobile when link is clicked
                    if (window.innerWidth < 1024) {
                      setOpen(false);
                    }
                  }}
                  className={cn(
                    "flex items-center space-x-3 p-3 rounded-lg font-medium",
                    location === item.href
                      ? "text-primary bg-indigo-50"
                      : "text-gray-700 hover:bg-indigo-50 hover:text-primary transition-colors"
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
          
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-8 mb-4">Account</p>
          <ul className="space-y-1">
            {accountItems.map((item) => (
              <li key={item.label}>
                <a 
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    if (item.onClick) item.onClick();
                    // Close sidebar on mobile when item is clicked
                    if (window.innerWidth < 1024) {
                      setOpen(false);
                    }
                  }}
                  className={cn(
                    "flex items-center space-x-3 p-3 rounded-lg text-gray-700 transition-colors",
                    item.danger
                      ? "hover:bg-red-50 hover:text-danger"
                      : "hover:bg-indigo-50 hover:text-primary"
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
}
