"use client";

import { Button } from "~/components/ui/button";
import { makeSuperAdmin } from "~/server/actions/admin";
import { toast } from "sonner";

export function AdminButton() {
  const handleMakeSuperAdmin = async () => {
    try {
      await makeSuperAdmin();
      toast.success("You are now a super admin!");
    } catch (error) {
      toast.error("Failed to make super admin: " + (error as Error).message);
    }
  };

  return (
    <Button onClick={handleMakeSuperAdmin}>
      Make me superadmin!
    </Button>
  );
}
