// Reusable EmployeeModal.tsx for Add/Edit
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";

const employeeSchema = z.object({
  full_name: z.string().min(1),
  email: z.string().email(),
  position: z.string().min(1),
});

type EmployeeForm = z.infer<typeof employeeSchema>;

export default function EmployeeModal({ open, onOpenChange, employee }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: { id?: number } & EmployeeForm;
}) {
  const { toast } = useToast();
  const form = useForm<EmployeeForm>({
    resolver: zodResolver(employeeSchema),
    defaultValues: { full_name: '', email: '', position: '' },
  });

  useEffect(() => {
    if (employee) {
      form.reset({
        full_name: employee.full_name,
        email: employee.email,
        position: employee.position,
      });
    }
  }, [employee, form]);

  const onSubmit = async (values: EmployeeForm) => {
    const { error } = employee?.id
      ? await supabase.from("employees").update(values).eq("id", employee.id)
      : await supabase.from("employees").insert([values]);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: employee?.id ? "Employee updated" : "Employee added" });
      form.reset();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{employee?.id ? "Edit Employee" : "Add Employee"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {["full_name", "email", "position"].map((field) => (
              <FormField
                key={field}
                name={field as keyof EmployeeForm}
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{field.name.replace("_", " ")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {employee?.id ? "Save Changes" : "Add Employee"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
