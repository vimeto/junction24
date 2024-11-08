import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { type OrganizationDetails } from "~/server/queries/organizations";

export function OrganizationSettings({
  organization,
}: {
  organization: OrganizationDetails;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-muted-foreground">
          Settings view coming soon...
        </div>
      </CardContent>
    </Card>
  );
}
