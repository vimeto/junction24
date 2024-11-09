"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
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
import { RequestAuditModal } from "./request-audit-modal";

export function LocationItems({
  locations,
}: {
  locations: LocationWithItems[];
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationWithItems | null>(null);

  const handleRequestAudit = (location: LocationWithItems) => {
    if (location.id === -1) return; // Prevent audit requests for "No Location"
    setSelectedLocation(location);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="space-y-6">
        {locations.map((location) => (
          <Card key={location.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{location.name}</CardTitle>
              {location.id !== -1 && (
                <Button onClick={() => handleRequestAudit(location)}>
                  Request Audit
                </Button>
              )}
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
      <RequestAuditModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        location={selectedLocation}
      />
    </>
  );
}
