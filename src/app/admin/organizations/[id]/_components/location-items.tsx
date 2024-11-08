import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { type OrganizationDetails } from "~/server/queries/organizations";

export function LocationItems({
  organization,
}: {
  organization: OrganizationDetails;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Items by Location</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-muted-foreground">
          Items by location view coming soon...
        </div>
      </CardContent>
    </Card>
  );
}
