"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
import { type OrganizationDetails } from "~/server/queries/organizations";
import { LocationMap } from "./location-map";
import { LocationItems } from "./location-items";
import { OrganizationSettings } from "./organization-settings";

export function OrganizationTabs({
  organization,
}: {
  organization: OrganizationDetails;
}) {
  return (
    <Tabs defaultValue="map" className="space-y-4">
      <TabsList>
        <TabsTrigger value="map">Map View</TabsTrigger>
        <TabsTrigger value="items">Items by Location</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>

      <TabsContent value="map" className="space-y-4">
        <LocationMap organization={organization} />
      </TabsContent>

      <TabsContent value="items" className="space-y-4">
        <LocationItems organization={organization} />
      </TabsContent>

      <TabsContent value="settings" className="space-y-4">
        <OrganizationSettings organization={organization} />
      </TabsContent>
    </Tabs>
  );
}
