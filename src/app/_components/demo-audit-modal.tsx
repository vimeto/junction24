import { useState } from "react";
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
import { createDemoAudit } from "~/server/actions/demo";
import { useRouter } from "next/navigation";

export function DemoAuditModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    if (!name) return;
    setIsSubmitting(true);
    try {
      const auditUuid = await createDemoAudit(name);
      router.push(`/audits/${auditUuid}`);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Welcome to the Demo Audit!</DialogTitle>
          <DialogDescription>
            Please enter your name to start the demo audit experience. Note: This is a demo audit, and does not use the Real-Time API. This is for cost reasons. For the full experience, please visit our table!
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !name}
          >
            {isSubmitting ? "Creating..." : "Start Audit!"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
