import { notFound } from "next/navigation";
import { OrganizationTabs } from "./_components/organization-tabs";
import { getUserOrganization } from "~/server/queries/organizations";

export default async function OrganizationPage({
  params,
}: {
  params: { id: string };
}) {
  const organizationId = parseInt(params.id);
  if (isNaN(organizationId)) notFound();

  const organization = await getUserOrganization(organizationId);
  if (!organization) notFound();

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">{organization.name}</h1>
        <p className="text-muted-foreground">Organization Management</p>
      </div>

      <OrganizationTabs organization={organization} />
    </div>
  );
}
