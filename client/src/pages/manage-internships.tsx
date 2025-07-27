import { useState, useEffect } from "react";
import { 
  SearchIcon, 
  FilterIcon, 
  PencilIcon, 
  XCircleIcon, 
  TrashIcon, 
  EyeIcon
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
import { Textarea } from "@/components/ui/textarea";
import { getInternshipList, updateInternship, deleteInternship, handleFirebaseError } from "@/lib/firebase";
import { cn } from "@/lib/utils";

// Internship form schema
const internshipFormSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  status: z.string().min(1, "Please select a status"),
});

type InternshipFormValues = z.infer<typeof internshipFormSchema>;

export default function ManageInternships() {
  const { toast } = useToast();
  const [internshipList, setInternshipList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedInternship, setSelectedInternship] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [postedByFilter, setPostedByFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  
  const form = useForm<InternshipFormValues>({
    resolver: zodResolver(internshipFormSchema),
    defaultValues: {
      title: "",
      companyName: "",
      description: "",
      status: "open",
    },
  });

  // Fetch internship list
  useEffect(() => {
    const fetchInternships = async () => {
      setIsLoading(true);
      try {
        const internships = await getInternshipList();
        setInternshipList(internships);
      } catch (error) {
        console.error("Error fetching internships:", error);
        toast({
          variant: "destructive",
          title: "Error fetching internships",
          description: handleFirebaseError(error),
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInternships();
  }, [toast]);
  
  // Handle view internship details
  const handleViewInternship = (internship: any) => {
    setSelectedInternship(internship);
    setShowDetails(true);
  };
  
  // Handle edit internship
  const handleEditInternship = (internship: any) => {
    setSelectedInternship(internship);
    form.reset({
      title: internship.title,
      companyName: internship.companyName,
      description: internship.description,
      status: internship.status,
    });
    setShowForm(true);
  };
  
  // Handle form submission
  const onSubmit = async (data: InternshipFormValues) => {
    setIsUpdating(true);
    try {
      if (selectedInternship) {
        // Update existing internship
        await updateInternship(selectedInternship.id, {
          title: data.title,
          companyName: data.companyName,
          description: data.description,
          status: data.status,
        });
        
        // Update local state
        setInternshipList(internshipList.map(internship => 
          internship.id === selectedInternship.id ? 
          { ...internship, ...data } : 
          internship
        ));
        
        toast({
          title: "Internship updated",
          description: `${data.title} at ${data.companyName} has been updated successfully.`,
        });
        
        // Reset form and close dialog
        form.reset();
        setShowForm(false);
        setSelectedInternship(null);
      }
    } catch (error) {
      console.error("Error updating internship:", error);
      toast({
        variant: "destructive",
        title: "Error updating internship",
        description: handleFirebaseError(error),
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Handle close internship
  const handleCloseInternship = async (internship: any) => {
    try {
      await updateInternship(internship.id, { status: "closed" });
      
      // Update local state
      setInternshipList(internshipList.map(item => 
        item.id === internship.id ? { ...item, status: "closed" } : item
      ));
      
      toast({
        title: "Internship closed",
        description: `${internship.title} at ${internship.companyName} has been closed.`,
      });
    } catch (error) {
      console.error("Error closing internship:", error);
      toast({
        variant: "destructive",
        title: "Error closing internship",
        description: handleFirebaseError(error),
      });
    }
  };
  
  // Handle delete internship
  const handleDeleteInternship = async (id: string) => {
    try {
      await deleteInternship(id);
      
      // Update local state
      setInternshipList(internshipList.filter(internship => internship.id !== id));
      
      toast({
        title: "Internship deleted",
        description: "Internship has been deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting internship:", error);
      toast({
        variant: "destructive",
        title: "Error deleting internship",
        description: handleFirebaseError(error),
      });
    }
  };
  
  // Filter internship list
  const filteredInternships = internshipList.filter(internship => {
    const matchesSearch = 
      (internship.title?.toLowerCase() || "").includes(searchTerm.toLowerCase()) || 
      (internship.companyName?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    const matchesPostedBy = !postedByFilter || postedByFilter === "all" || internship.postedBy === postedByFilter;
    const matchesStatus = !statusFilter || statusFilter === "all" || internship.status === statusFilter;
    
    return matchesSearch && matchesPostedBy && matchesStatus;
  });
  
  // Apply filters
  const handleApplyFilters = () => {
    toast({
      title: "Filters applied",
      description: "Internship list has been filtered.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-heading font-bold">Manage Internships</h1>
      </div>
      
      {/* Internship Filter and Search */}
      <Card className="shadow-sm">
        <CardContent className="p-5 flex flex-wrap gap-4">
          <div className="flex-1 min-w-[240px]">
            <Label className="text-xs font-medium text-gray-700 mb-1">Search</Label>
            <div className="relative">
              <Input
                type="text"
                className="pl-10"
                placeholder="Search by title or company"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <SearchIcon className="h-4 w-4 absolute left-3 top-2.5 text-gray-500" />
            </div>
          </div>
          
          <div className="w-40">
            <Label className="text-xs font-medium text-gray-700 mb-1">Posted By</Label>
            <Select
              value={postedByFilter}
              onValueChange={setPostedByFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="faculty">Faculty</SelectItem>
                <SelectItem value="student">Student Startup</SelectItem>
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
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
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
      
      {/* Internships Table */}
      <Card className="shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Title</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Posted By</TableHead>
                <TableHead>Faculty Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Loading internship data...
                  </TableCell>
                </TableRow>
              ) : filteredInternships.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    No internships found. {searchTerm || postedByFilter || statusFilter ? "Try adjusting your filters." : ""}
                  </TableCell>
                </TableRow>
              ) : (
                filteredInternships.map((internship) => (
                  <TableRow key={internship.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{internship.title || "Untitled"}</TableCell>
                    <TableCell>{internship.companyName || "Unknown"}</TableCell>
                    <TableCell>
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs",
                        internship.postedBy === "faculty" 
                          ? "bg-indigo-100 text-indigo-800" 
                          : "bg-pink-100 text-pink-800"
                      )}>
                        {internship.postedBy === "faculty" ? "Faculty" : "Student Startup"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {internship.facultyName || 
                       (internship.facultyId ? `ID: ${internship.facultyId}` : 
                       internship.postedBy === "faculty" ? "Unknown Faculty" : "N/A")}
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs",
                        internship.status === "open" 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      )}>
                        {internship.status === "open" ? "Open" : "Closed"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-primary hover:text-indigo-800"
                          onClick={() => handleViewInternship(internship)}
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-primary hover:text-indigo-800"
                          onClick={() => handleEditInternship(internship)}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        
                        {internship.status === "open" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-warning hover:text-yellow-700"
                            onClick={() => handleCloseInternship(internship)}
                          >
                            <XCircleIcon className="h-4 w-4" />
                          </Button>
                        )}
                        
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
                              <AlertDialogTitle>Delete Internship</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this internship? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-red-600 hover:bg-red-700"
                                onClick={() => handleDeleteInternship(internship.id)}
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
        
        {/* Pagination */}
        <div className="px-6 py-4 flex items-center justify-between border-t">
          <div className="text-sm text-gray-500">
            Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredInternships.length}</span> of <span className="font-medium">{internshipList.length}</span> results
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="outline" size="sm" className="bg-primary text-white border-primary">1</Button>
            <Button variant="outline" size="sm" disabled>Next</Button>
          </div>
        </div>
      </Card>
      
      {/* Edit Internship Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Internship</DialogTitle>
            <DialogDescription>
              Update internship details below.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter internship title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter company name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter internship description" 
                        className="min-h-[120px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="mt-6 flex flex-wrap gap-3">
                <Button
                  type="submit"
                  className="bg-primary hover:bg-indigo-700"
                  disabled={isUpdating}
                >
                  {isUpdating ? "Updating..." : "Update Internship"}
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
      
      {/* View Internship Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Internship Details</DialogTitle>
          </DialogHeader>
          
          {selectedInternship && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">{selectedInternship.title}</h3>
                <p className="text-sm text-gray-500">{selectedInternship.companyName}</p>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <div>
                  <span className="text-xs text-gray-500">Posted By</span>
                  <p className="text-sm">
                    {selectedInternship.postedBy === "faculty" ? "Faculty" : "Student Startup"}
                  </p>
                </div>
                {selectedInternship.postedBy === "faculty" && (
                  <div>
                    <span className="text-xs text-gray-500">Faculty Name</span>
                    <p className="text-sm">
                      {selectedInternship.facultyName || 
                      (selectedInternship.facultyId ? `ID: ${selectedInternship.facultyId}` : "Unknown Faculty")}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-xs text-gray-500">Status</span>
                  <p className="text-sm">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs",
                      selectedInternship.status === "open" 
                        ? "bg-green-100 text-green-800" 
                        : "bg-red-100 text-red-800"
                    )}>
                      {selectedInternship.status === "open" ? "Open" : "Closed"}
                    </span>
                  </p>
                </div>
              </div>
              
              <div>
                <span className="text-xs text-gray-500">Description</span>
                <p className="text-sm mt-1 whitespace-pre-line">{selectedInternship.description}</p>
              </div>
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDetails(false)}
                >
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
