'use client';

import { useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Button } from "~/components/ui/button";
import { toast } from "sonner";
import { type OrganizationDetails } from "~/server/queries/organizations";
import { updateOrganization } from "~/server/actions/organizations";

export function OrganizationSettings({
  organization,
}: {
  organization: OrganizationDetails;
}) {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      try {
        await updateOrganization(organization.id, formData);
        toast.success("Organization updated successfully");
      } catch (error) {
        toast.error("Failed to update organization");
        console.error(error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Organization Settings</CardTitle>
          <CardDescription>
            Update your organization details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Organization Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={organization.name}
              placeholder="Enter organization name"
              required
            />
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Updating..." : "Update Organization"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
