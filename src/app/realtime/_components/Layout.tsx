import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

export function RealtimeLayout({
  children,
  visualizer,
  events,
  conversation,
  connectButton
}: {
  children: React.ReactNode;
  visualizer: React.ReactNode;
  events: React.ReactNode;
  conversation: React.ReactNode;
  connectButton: React.ReactNode;
}) {
  return (
    <div className="container mx-auto p-4 h-screen">
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Realtime Chat</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {visualizer}

          <Tabs defaultValue="conversation" className="h-[60vh]">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="conversation">Conversation</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
            </TabsList>

            <TabsContent value="conversation" className="h-full">
              <ScrollArea className="h-[calc(60vh-3rem)] rounded-md border p-4">
                {conversation}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="events" className="h-full">
              <ScrollArea className="h-[calc(60vh-3rem)] rounded-md border p-4">
                {events}
              </ScrollArea>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end">
            {connectButton}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
