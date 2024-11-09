import AuditWindow from "./_components/auditWindow";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AuditPage({ params }: PageProps) {
  const awaitedParams = await params;
  const auditUuid = awaitedParams.id;

  return <AuditWindow params={{ id: auditUuid }} />;
}
