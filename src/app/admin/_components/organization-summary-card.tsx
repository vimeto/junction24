import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

type OrganizationSummaryProps = {
  id: number;
  name: string;
  totalItems: number;
  totalLocations: number;
  totalAudits: number;
};

export function OrganizationSummaryCard({
  id,
  name,
  totalItems,
  totalLocations,
  totalAudits,
}: OrganizationSummaryProps) {
  return (
    <Link href={`/admin/organizations/${id}`} className="block transition-opacity hover:opacity-70">
      <Card>
        <CardHeader>
          <CardTitle>{name}</CardTitle>
          <CardDescription>Organization Summary</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Items</p>
            <p className="text-2xl font-bold">{totalItems}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Locations</p>
            <p className="text-2xl font-bold">{totalLocations}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Audits</p>
            <p className="text-2xl font-bold">{totalAudits}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}