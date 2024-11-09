import RealtimeWindow from "./_components/realtimeWindow";
import { getVisibleChats } from "~/server/queries/chats";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RealtimePage({ params }: PageProps) {
  const awaitedParams = await params;
  const id = awaitedParams.id;

  const initialMessages = await getVisibleChats(id);

  return <RealtimeWindow id={id} initialMessages={initialMessages} />;
}
