"use client";

import { Suspense } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { type OrganizationDetails, type LocationWithItems } from "~/server/queries/organizations";
import { LocationMap } from "./location-map";
import { LocationItems } from "./location-items";
import { OrganizationSettings } from "./organization-settings";
import { ImageValidation } from "./image-validation";

export function OrganizationTabs({
  organization,
  locationItems,
}: {
  organization: OrganizationDetails;
  locationItems: LocationWithItems[];
}) {
  return (
    <Tabs defaultValue="map" className="space-y-4">
      <TabsList>
        <TabsTrigger value="map">Map View</TabsTrigger>
        <TabsTrigger value="items">Items by Location</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
        <TabsTrigger value="validate-images">Validate Images</TabsTrigger>
      </TabsList>

      <TabsContent value="map" className="space-y-4">
        <LocationMap organization={organization} />
      </TabsContent>

      <TabsContent value="items" className="space-y-4">
        <LocationItems locations={locationItems} />
      </TabsContent>

      <TabsContent value="settings" className="space-y-4">
        <OrganizationSettings organization={organization} />
      </TabsContent>

      <TabsContent value="validate-images" className="space-y-4">
        <ImageValidation />
      </TabsContent>
    </Tabs>
  );
}
