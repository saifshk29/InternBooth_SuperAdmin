import { useState, useEffect } from "react";
import { 
  PlusIcon, 
  SearchIcon, 
  FilterIcon, 
  PencilIcon, 
  PauseCircleIcon, 
  PlayCircleIcon, 
  TrashIcon, 
  RefreshCwIcon
} from "lucide-react";
import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createFaculty, updateFaculty, deleteFaculty, getFacultyList, handleFirebaseError } from "@/lib/firebase";
import { generatePassword, getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";

// Faculty form schema
const facultyFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  department: z.string().min(1, "Please select a department"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FacultyFormValues = z.infer<typeof facultyFormSchema>;

export default function ManageFaculty() {
  const { toast } = useToast();
  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  
  const form = useForm<FacultyFormValues>({
    resolver: zodResolver(facultyFormSchema),
    defaultValues: {
      name: "",
      email: "",
      department: "",
      password: generatePassword(),
    },
  });

  // Fetch faculty list
  useEffect(() => {
    const fetchFaculty = async () => {
      setIsLoading(true);
      try {
        const faculty = await getFacultyList();
        setFacultyList(faculty);
      } catch (error) {
        console.error("Error fetching faculty:", error);
        toast({
          variant: "destructive",
          title: "Error fetching faculty",
          description: handleFirebaseError(error),
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFaculty();
  }, [toast]);
  
  // Handle form submission
  const onSubmit = async (data: FacultyFormValues) => {
    setIsCreating(true);
    try {
      if (editingFaculty) {
        // Update existing faculty - use try/catch to handle potential errors
        try {
          console.log(`Updating faculty ID ${editingFaculty.id} with new data:`, {
            name: data.name,
            email: data.email,
            department: data.department
          });
          
          // Wait for the update to complete and get the updated faculty object
          const updatedFaculty = await updateFaculty(editingFaculty.id, {
            name: data.name,
            email: data.email,
            department: data.department,
            // Don't update password on edit
          });
          
          console.log("Faculty update successful, returned data:", updatedFaculty);
          
          // Update local state with the data returned from Firebase
          setFacultyList(facultyList.map(faculty => 
            faculty.id === editingFaculty.id ? 
            { 
              ...faculty,
              ...updatedFaculty, // Use all values from updatedFaculty
              // Ensure these specific fields are definitely updated
              name: data.name,
              email: data.email, 
              department: data.department
            } : 
            faculty
          ));
          
          toast({
            title: "Faculty updated",
            description: `${data.name}'s account has been updated successfully.`,
          });
        } catch (error) {
          console.error("Error during faculty update:", error);
          toast({
            variant: "destructive",
            title: "Update failed",
            description: handleFirebaseError(error),
          });
        }
      } else {
        // Create new faculty
        const newFaculty = await createFaculty({
          name: data.name,
          email: data.email,
          department: data.department,
          password: data.password,
        });
        
        // Add to local state
        setFacultyList([...facultyList, { 
          id: newFaculty.id, 
          name: data.name, 
          email: data.email, 
          department: data.department,
          status: "active",
          internshipsPosted: 0,
        }]);
        
        toast({
          title: "Faculty created",
          description: `${data.name}'s account has been created successfully.`,
        });
      }
      
      // Reset form and close dialog
      form.reset();
      setShowForm(false);
      setEditingFaculty(null);
    } catch (error) {
      console.error("Error saving faculty:", error);
      toast({
        variant: "destructive",
        title: "Error saving faculty",
        description: handleFirebaseError(error),
      });
    } finally {
      setIsCreating(false);
    }
  };
  
  // Handle edit faculty
  const handleEditFaculty = (faculty: any) => {
    setEditingFaculty(faculty);
    form.reset({
      name: faculty.name,
      email: faculty.email,
      department: faculty.department,
      password: "********" // Not showing the actual password for security
    });
    setShowForm(true);
  };
  
  // Handle toggle faculty status
  const handleToggleStatus = async (faculty: any) => {
    try {
      const newStatus = faculty.status === "active" ? "inactive" : "active";
      console.log(`Toggling faculty ID ${faculty.id} status to: ${newStatus}`);
      
      // Wait for the update to complete and get the updated faculty object
      const updatedFaculty = await updateFaculty(faculty.id, { status: newStatus });
      console.log("Status update successful, returned data:", updatedFaculty);
      
      // Update local state with the data returned from Firebase
      setFacultyList(facultyList.map(f => 
        f.id === faculty.id ? { ...f, ...updatedFaculty, status: newStatus } : f
      ));
      
      toast({
        title: "Status updated",
        description: `${faculty.name}'s status has been changed to ${newStatus}.`,
      });
    } catch (error) {
      console.error("Error updating faculty status:", error);
      toast({
        variant: "destructive",
        title: "Error updating status",
        description: handleFirebaseError(error),
      });
    }
  };
  
  // Handle delete faculty
  const handleDeleteFaculty = async (id: string) => {
    try {
      await deleteFaculty(id);
      
      // Update local state
      setFacultyList(facultyList.filter(faculty => faculty.id !== id));
      
      toast({
        title: "Faculty deleted",
        description: "Faculty account has been deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting faculty:", error);
      toast({
        variant: "destructive",
        title: "Error deleting faculty",
        description: handleFirebaseError(error),
      });
    }
  };
  
  // Generate new password
  const handleGeneratePassword = () => {
    const newPassword = generatePassword();
    form.setValue("password", newPassword);
  };
  
  // Filter faculty list
  const filteredFaculty = facultyList.filter(faculty => {
    const matchesSearch = 
      (faculty.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) || 
      (faculty.email?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    const matchesDepartment = !departmentFilter || departmentFilter === "all" || faculty.department === departmentFilter;
    const matchesStatus = !statusFilter || statusFilter === "all" || faculty.status === statusFilter;
    
    return matchesSearch && matchesDepartment && matchesStatus;
  });
  
  // Apply filters
  const handleApplyFilters = () => {
    // Just use the current filter state values
    toast({
      title: "Filters applied",
      description: "Faculty list has been filtered.",
    });
  };
  
  // Create new faculty dialog open
  const handleNewFaculty = () => {
    setEditingFaculty(null);
    form.reset({
      name: "",
      email: "",
      department: "",
      password: generatePassword(),
    });
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-heading font-bold">Manage Faculty</h1>
        <Button onClick={handleNewFaculty} className="bg-primary hover:bg-indigo-700">
          <PlusIcon className="mr-2 h-4 w-4" />
          <span>Generate Faculty Account</span>
        </Button>
      </div>
      
      {/* Faculty Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingFaculty ? "Edit Faculty Account" : "Create New Faculty Account"}
            </DialogTitle>
            <DialogDescription>
              {editingFaculty 
                ? "Update faculty details below." 
                : "Create a new faculty account. The password will be auto-generated."}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter faculty name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter email address" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Computer Science">Computer Science</SelectItem>
                          <SelectItem value="Electronics & Communication">Electronics & Communication</SelectItem>
                          <SelectItem value="Mechanical Engineering">Mechanical Engineering</SelectItem>
                          <SelectItem value="Civil Engineering">Civil Engineering</SelectItem>
                          <SelectItem value="Business Administration">Business Administration</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {!editingFaculty && (
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input readOnly {...field} />
                          </FormControl>
                          <Button 
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-3 top-2 text-primary hover:text-indigo-700"
                            onClick={handleGeneratePassword}
                          >
                            <RefreshCwIcon className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500">Auto-generated secure password</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
              
              <DialogFooter className="mt-6 flex flex-wrap gap-3">
                <Button
                  type="submit"
                  className="bg-primary hover:bg-indigo-700"
                  disabled={isCreating}
                >
                  {isCreating ? "Saving..." : editingFaculty ? "Update Faculty" : "Save Faculty Account"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Faculty Filter and Search */}
      <Card className="shadow-sm">
        <CardContent className="p-5 flex flex-wrap gap-4">
          <div className="flex-1 min-w-[240px]">
            <Label className="text-xs font-medium text-gray-700 mb-1">Search</Label>
            <div className="relative">
              <Input
                type="text"
                className="pl-10"
                placeholder="Search by name or email"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <SearchIcon className="h-4 w-4 absolute left-3 top-2.5 text-gray-500" />
            </div>
          </div>
          
          <div className="w-40">
            <Label className="text-xs font-medium text-gray-700 mb-1">Department</Label>
            <Select
              value={departmentFilter}
              onValueChange={setDepartmentFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="Computer Science">Computer Science</SelectItem>
                <SelectItem value="Electronics & Communication">Electronics & Communication</SelectItem>
                <SelectItem value="Mechanical Engineering">Mechanical Engineering</SelectItem>
                <SelectItem value="Civil Engineering">Civil Engineering</SelectItem>
                <SelectItem value="Business Administration">Business Administration</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-40">
            <Label className="text-xs font-medium text-gray-700 mb-1">Status</Label>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-40 flex items-end">
            <Button
              variant="outline"
              className="w-full bg-primary/10 hover:bg-primary/20 text-primary"
              onClick={handleApplyFilters}
            >
              <FilterIcon className="mr-2 h-4 w-4" />
              <span>Apply Filters</span>
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Faculty Table */}
      <Card className="shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Internships Posted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading faculty data...
                  </TableCell>
                </TableRow>
              ) : filteredFaculty.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No faculty found. {searchTerm || departmentFilter || statusFilter ? "Try adjusting your filters." : ""}
                  </TableCell>
                </TableRow>
              ) : (
                filteredFaculty.map((faculty) => (
                  <TableRow key={faculty.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-primary mr-3">
                          <span>{getInitials(faculty.name || "Faculty")}</span>
                        </div>
                        <span className="font-medium">{faculty.name || "Unknown"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{faculty.email || "No email"}</TableCell>
                    <TableCell className="text-sm">{faculty.department || "Not assigned"}</TableCell>
                    <TableCell className="text-sm">{faculty.internshipsPosted || 0}</TableCell>
                    <TableCell>
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs",
                        faculty.status === "active" 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      )}>
                        {faculty.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-primary hover:text-indigo-800"
                          onClick={() => handleEditFaculty(faculty)}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          className={faculty.status === "active" 
                            ? "text-warning hover:text-yellow-700" 
                            : "text-success hover:text-green-700"}
                          onClick={() => handleToggleStatus(faculty)}
                        >
                          {faculty.status === "active" ? (
                            <PauseCircleIcon className="h-4 w-4" />
                          ) : (
                            <PlayCircleIcon className="h-4 w-4" />
                          )}
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-danger hover:text-red-700"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Faculty Account</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {faculty.name || "this faculty"}'s account? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-red-600 hover:bg-red-700"
                                onClick={() => handleDeleteFaculty(faculty.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination - Simple implementation */}
        <div className="px-6 py-4 flex items-center justify-between border-t">
          <div className="text-sm text-gray-500">
            Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredFaculty.length}</span> of <span className="font-medium">{facultyList.length}</span> results
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="outline" size="sm" className="bg-primary text-white border-primary">1</Button>
            <Button variant="outline" size="sm" disabled>Next</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
