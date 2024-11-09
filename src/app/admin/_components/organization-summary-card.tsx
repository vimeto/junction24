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
    <Link 
      href={`/admin/organizations/${id}`} 
      className="block group relative"
    >
      <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <Card className="relative z-10 transition-all group-hover:border-transparent duration-500">
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
