import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertEmployeeSchema, type InsertEmployee } from "@shared/schema";

interface AddEmployeeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddEmployeeModal({ open, onOpenChange }: AddEmployeeModalProps) {
  const { toast } = useToast();

  const form = useForm<InsertEmployee>({
    resolver: zodResolver(insertEmployeeSchema),
    defaultValues: {
      name: "",
      email: "",
      position: "",
      department: "",
    },
  });

  const createEmployeeMutation = useMutation({
    mutationFn: (data: InsertEmployee) => apiRequest("POST", "/api/employees", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "Employee created successfully",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create employee",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertEmployee) => {
    createEmployeeMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter full name" {...field} data-testid="input-employee-name" />
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
                    <Input 
                      type="email" 
                      placeholder="Enter email address" 
                      {...field} 
                      data-testid="input-employee-email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Position</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter job position" 
                      {...field} 
                      data-testid="input-employee-position"
                    />
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
                  <FormControl>
                    <Input 
                      placeholder="Enter department" 
                      {...field} 
                      data-testid="input-employee-department"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex items-center justify-end space-x-4 pt-4">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel-employee"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createEmployeeMutation.isPending}
                className="bg-primary text-white hover:bg-blue-700"
                data-testid="button-create-employee"
              >
                {createEmployeeMutation.isPending ? "Creating..." : "Create Employee"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
