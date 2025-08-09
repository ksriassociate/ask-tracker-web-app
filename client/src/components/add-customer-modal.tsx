import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { z } from "zod";

const customerSchema = z.object({
  company_name: z.string().min(1, "Company is required"),
  contact_person: z.string().min(1, "Contact person is required"),
  email: z.string().email(),
  phone: z.string().optional(),
});

type CustomerForm = z.infer<typeof customerSchema>;

export default function AddCustomerModal({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { toast } = useToast();

  const form = useForm<CustomerForm>({
    resolver: zodResolver(customerSchema),
    defaultValues: { company_name: "", contact_person: "", email: "", phone: "" },
  });

  const mutation = useMutation({
    mutationFn: async (values: CustomerForm) => {
      const { error } = await supabase.from("customers").insert([values]);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Customer added" });
      form.reset();
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add customer", variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Customer</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
            {["company_name", "contact_person", "email", "phone"].map((field) => (
              <FormField
                key={field}
                name={field as keyof CustomerForm}
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
            <Button type="submit" disabled={mutation.isPending}>Add</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
