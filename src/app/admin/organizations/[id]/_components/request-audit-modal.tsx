import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useState } from "react";
import { type LocationWithItems } from "~/server/queries/organizations";
import { sendSMS } from "~/server/actions/sms";
import { toast } from "sonner";

type Auditor = {
  id: string;
  name: string;
  phone: string;
};

export function RequestAuditModal({
  open,
  onOpenChange,
  location,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location: LocationWithItems | null;
}) {
  const [auditors, setAuditors] = useState<Auditor[]>([{ id: "1", name: "", phone: "" }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addAuditor = () => {
    setAuditors([...auditors, { id: crypto.randomUUID(), name: "", phone: "" }]);
  };

  const removeAuditor = (id: string) => {
    if (auditors.length === 1) return;
    setAuditors(auditors.filter(auditor => auditor.id !== id));
  };

  const updateAuditor = (id: string, field: keyof Auditor, value: string) => {
    setAuditors(auditors.map(auditor =>
      auditor.id === id ? { ...auditor, [field]: value } : auditor
    ));
  };

  const handleSubmit = async () => {
    if (!location) return;

    setIsSubmitting(true);
    try {
      // Send SMS to each auditor
      await Promise.all(
        auditors.map(async (auditor) => {
          if (!auditor.name || !auditor.phone) {
            throw new Error("Please fill in all auditor details");
          }
          await sendSMS(auditor.phone, auditor.name);
        })
      );

      toast.success("Audit request sent successfully!");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send audit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!location) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Request Audit for {location.name}</DialogTitle>
          <DialogDescription>
            Add auditor details for the location audit request
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {auditors.map((auditor) => (
            <div key={auditor.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Auditor Details</h4>
                {auditors.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAuditor(auditor.id)}
                  >
                    Remove
                  </Button>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`name-${auditor.id}`}>Name</Label>
                <Input
                  id={`name-${auditor.id}`}
                  placeholder="Enter name"
                  value={auditor.name}
                  onChange={(e) => updateAuditor(auditor.id, "name", e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`phone-${auditor.id}`}>Phone Number</Label>
                <Input
                  id={`phone-${auditor.id}`}
                  placeholder="Enter phone number"
                  value={auditor.phone}
                  onChange={(e) => updateAuditor(auditor.id, "phone", e.target.value)}
                />
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={addAuditor}
          >
            Add Another Auditor
          </Button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Sending..." : "Request Audit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
