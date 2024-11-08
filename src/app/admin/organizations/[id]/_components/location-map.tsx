import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { type OrganizationDetails } from "~/server/queries/organizations";

export function LocationMap({
  organization,
}: {
  organization: OrganizationDetails;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Location Map</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="aspect-video w-full bg-muted flex items-center justify-center">
          <p className="text-muted-foreground">Map placeholder</p>
        </div>
      </CardContent>
    </Card>
  );
}
