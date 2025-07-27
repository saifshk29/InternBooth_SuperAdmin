import { useState } from "react";
import { Menu, Search, Bell, ChevronDown } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export default function Header({ sidebarOpen, setSidebarOpen }: HeaderProps) {
  const { user, logout } = useAuth();
  
  return (
    <header className="bg-white border-b h-16 flex items-center justify-between px-6">
      <div className="flex items-center lg:hidden">
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-gray-600 hover:text-primary focus:outline-none"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>
      
      <div className="flex items-center">
        <div className="relative">
          <Input 
            type="text" 
            placeholder="Search..." 
            className="bg-gray-100 rounded-lg pl-10 w-64 focus:ring-primary/20"
          />
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-gray-500" />
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="relative">
          <button className="text-gray-600 hover:text-primary focus:outline-none relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-danger rounded-full"></span>
          </button>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center space-x-2 focus:outline-none">
              <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white">
                <span className="text-sm font-medium">SA</span>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium">Super Admin</p>
                <p className="text-xs text-gray-500">admin@campus.edu</p>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-danger focus:text-danger"
              onClick={() => logout()}
            >
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
