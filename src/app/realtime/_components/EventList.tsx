import { Badge } from "~/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";

export function EventList({
  events,
  expandedEvents,
  onToggleExpand,
  formatTime
}: {
  events: RealtimeEvent[];
  expandedEvents: Record<string, boolean>;
  onToggleExpand: (id: string) => void;
  formatTime: (timestamp: string) => string;
}) {
  if (!events.length) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Awaiting connection...
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {events.map((realtimeEvent) => (
        <Collapsible
          key={realtimeEvent.event.event_id}
          open={expandedEvents[realtimeEvent.event.event_id]}
          onOpenChange={() => onToggleExpand(realtimeEvent.event.event_id)}
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted rounded-md">
            <div className="flex items-center gap-2">
              <Badge variant={realtimeEvent.source === 'error' ? 'destructive' : 'secondary'}>
                {realtimeEvent.source}
              </Badge>
              <span className="text-sm">{realtimeEvent.event.type}</span>
              {realtimeEvent.count && (
                <Badge variant="outline">×{realtimeEvent.count}</Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {formatTime(realtimeEvent.time)}
            </span>
          </CollapsibleTrigger>

          <CollapsibleContent className="p-2 mt-1 text-sm bg-muted rounded-md">
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(realtimeEvent.event, null, 2)}
            </pre>
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  );
}
