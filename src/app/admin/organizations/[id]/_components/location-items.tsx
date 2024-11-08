import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import { type LocationWithItems } from "~/server/queries/organizations";

export function LocationItems({
  locations,
}: {
  locations: LocationWithItems[];
}) {
  return (
    <div className="space-y-6">
      {locations.map((location) => (
        <Card key={location.id}>
          <CardHeader>
            <CardTitle>{location.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Identifier</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Requirements</TableHead>
                  <TableHead>Last Audit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {location.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="font-medium">{item.identifier}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.identifierType}
                      </div>
                    </TableCell>
                    <TableCell>{item.itemType}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {item.requireImage && (
                          <Badge variant="secondary">Requires Image</Badge>
                        )}
                        {item.requireImageConfirmation && (
                          <Badge variant="secondary">Image Confirmation</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.lastAuditDate
                        ? new Date(item.lastAuditDate).toLocaleDateString()
                        : "Never"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
