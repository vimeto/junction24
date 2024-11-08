import { db } from "../db";
import { auth } from "@clerk/nextjs/server";
import { organizations, organizationRoles, locations, audits, itemAudits } from "../db/schema";
import { and, eq } from "drizzle-orm";

export type OrganizationSummary = {
  id: number;
  name: string;
  totalItems: number;
  totalLocations: number;
  totalAudits: number;
};

export async function getUserOrganizations(): Promise<OrganizationSummary[]> {
  const user = await auth();
  if (!user.userId) throw new Error("Unauthorized");

  // Get user's roles
  const roles = await db.query.organizationRoles.findMany({
    where: eq(organizationRoles.userId, user.userId),
    with: {
      organization: true,
    },
  });

  // If user is admin in any org, get all orgs
  const isAdmin = roles.some((role) => role.role === "admin");

  let orgs;
  if (isAdmin) {
    orgs = await db.query.organizations.findMany();
  } else {
    orgs = roles.map((role) => role.organization);
  }

  // Get summary for each organization
  const summaries = await Promise.all(
    orgs.map(async (org) => {
      if (!org) return null;

      const [locationCount] = await db
        .select({ count: locations.id })
        .from(locations)
        .where(eq(locations.organizationId, org.id));

      const [auditCount] = await db
        .select({ count: audits.id })
        .from(audits)
        .where(eq(audits.organizationId, org.id));

      const [itemCount] = await db
        .select({ count: itemAudits.id })
        .from(itemAudits)
        .innerJoin(locations, eq(itemAudits.locationId, locations.id))
        .where(eq(locations.organizationId, org.id));

      return {
        id: org.id,
        name: org.name ?? "Unnamed Organization",
        totalItems: Number(itemCount?.count ?? 0),
        totalLocations: Number(locationCount?.count ?? 0),
        totalAudits: Number(auditCount?.count ?? 0),
      };
    })
  ).then(results => results.filter((summary): summary is OrganizationSummary => summary !== null));

  return summaries;
}

export type OrganizationDetails = {
  id: number;
  name: string;
  totalItems: number;
  totalLocations: number;
  totalAudits: number;
  locations: {
    id: number;
    name: string;
    latitude: string | null;
    longitude: string | null;
  }[];
};

export async function getUserOrganization(id: number): Promise<OrganizationDetails | null> {
  const user = await auth();
  if (!user.userId) throw new Error("Unauthorized");

  // Check if user has access to this organization
  const role = await db.query.organizationRoles.findFirst({
    where: and(
      eq(organizationRoles.userId, user.userId),
      eq(organizationRoles.organizationId, id)
    ),
  });

  // If user is not admin and has no role in this org, return null
  if (role?.role !== "admin" && !role) return null;

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, id),
    with: {
      locations: true,
    },
  });

  if (!org) return null;

  // Get summary counts
  const [itemCount] = await db
    .select({ count: itemAudits.id })
    .from(itemAudits)
    .innerJoin(locations, eq(itemAudits.locationId, locations.id))
    .where(eq(locations.organizationId, id));

  const [auditCount] = await db
    .select({ count: audits.id })
    .from(audits)
    .where(eq(audits.organizationId, id));

  return {
    id: org.id,
    name: org.name ?? "Unnamed Organization",
    totalItems: Number(itemCount?.count ?? 0),
    totalLocations: org.locations.length,
    totalAudits: Number(auditCount?.count ?? 0),
    locations: org.locations.map(loc => ({
      id: loc.id,
      name: loc.name ?? "Unnamed Location",
      latitude: loc.latitude,
      longitude: loc.longitude,
    })),
  };
}
