import AuditWindow from "./_components/auditWindow";
import { getVisibleChats } from "~/server/queries/chats";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AuditPage({ params }: PageProps) {
  const awaitedParams = await params;
  const auditUuid = awaitedParams.id;

  const initialMessages = await getVisibleChats(auditUuid);

  return <AuditWindow params={{ id: auditUuid, initialMessages }} />;
}
