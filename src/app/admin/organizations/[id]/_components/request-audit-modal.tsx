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

  const addAuditor = () => {
    setAuditors([...auditors, { id: crypto.randomUUID(), name: "", phone: "" }]);
  };

  const removeAuditor = (id: string) => {
    if (auditors.length === 1) return;
    setAuditors(auditors.filter(auditor => auditor.id !== id));
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
                <Input id={`name-${auditor.id}`} placeholder="Enter name" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`phone-${auditor.id}`}>Phone Number</Label>
                <Input id={`phone-${auditor.id}`} placeholder="Enter phone number" />
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
          <Button type="submit">Request Audit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
