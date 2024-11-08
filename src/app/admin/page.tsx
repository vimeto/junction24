"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { toast } from "sonner"
import { makeSuperAdmin } from "~/server/actions/admin"

export default function AdminPage() {
  const handleMakeSuperAdmin = async () => {
    try {
      await makeSuperAdmin();
      toast.success("You are now a super admin!");
    } catch (error) {
      toast.error("Failed to make super admin: " + (error as Error).message);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Admin Dashboard</h1>
        <Button onClick={handleMakeSuperAdmin}>
          Make me superadmin!
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Users</CardTitle>
            <CardDescription>Active users in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">1,234</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
            <CardDescription>Total revenue this month</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">$45,678</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Sessions</CardTitle>
            <CardDescription>Current active users</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">42</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
