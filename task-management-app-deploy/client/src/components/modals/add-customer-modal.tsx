import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertCustomerSchema, type InsertCustomer } from "@shared/schema";

interface AddCustomerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddCustomerModal({ open, onOpenChange }: AddCustomerModalProps) {
  const { toast } = useToast();

  const form = useForm<InsertCustomer>({
    resolver: zodResolver(insertCustomerSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      phone: null,
    },
  });

  const createCustomerMutation = useMutation({
    mutationFn: (data: InsertCustomer) => apiRequest("POST", "/api/customers", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: "Success",
        description: "Customer created successfully",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create customer",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertCustomer) => {
    createCustomerMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter company name" {...field} data-testid="input-customer-company" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Person</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter contact person name" {...field} data-testid="input-customer-name" />
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
                      data-testid="input-customer-email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      type="tel" 
                      placeholder="Enter phone number" 
                      {...field} 
                      value={field.value || ""}
                      data-testid="input-customer-phone"
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
                data-testid="button-cancel-customer"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createCustomerMutation.isPending}
                className="bg-primary text-white hover:bg-blue-700"
                data-testid="button-create-customer"
              >
                {createCustomerMutation.isPending ? "Creating..." : "Create Customer"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
