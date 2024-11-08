import { getUserOrganizations } from "~/server/queries/organizations"
import { OrganizationSummaryCard } from "./_components/organization-summary-card"
import { AdminButton } from "./_components/admin-button"

export default async function AdminPage() {
  const organizations = await getUserOrganizations();

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Admin Dashboard</h1>
        <AdminButton />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {organizations.length === 0 ? (
          <div className="col-span-full text-center text-lg text-muted-foreground">
            You are not a member of any organization
          </div>
        ) : (
          organizations.map((org) => (
            <OrganizationSummaryCard
              key={org.id}
              id={org.id}
              name={org.name}
              totalItems={org.totalItems}
              totalLocations={org.totalLocations}
              totalAudits={org.totalAudits}
            />
          ))
        )}
      </div>
    </div>
  );
}
