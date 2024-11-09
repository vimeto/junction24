import { ItemType } from '@openai/realtime-api-beta/dist/lib/client.js';
import { Button } from '~/components/ui/button';
import { Card } from '~/components/ui/card';
import { X } from 'lucide-react';

export function ConversationList({
  items,
  onDelete,
}: {
  items: ItemType[];
  onDelete: (id: string) => void;
}) {
  if (!items.length) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Awaiting connection...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <Card key={item.id} className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium capitalize text-muted-foreground">
              {(item.role || item.type)?.replaceAll('_', ' ')}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(item.id)}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            {/* Tool response */}
            {item.type === 'function_call_output' && (
              <div className="text-sm">{item.formatted.output}</div>
            )}

            {/* Tool call */}
            {item.formatted.tool && (
              <div className="text-sm font-mono bg-muted p-2 rounded-md">
                {item.formatted.tool.name}({item.formatted.tool.arguments})
              </div>
            )}

            {/* User message */}
            {!item.formatted.tool && item.role === 'user' && (
              <div className="text-sm">
                {item.formatted.transcript ||
                  (item.formatted.audio?.length
                    ? '(awaiting transcript)'
                    : item.formatted.text ||
                      '(item sent)')}
              </div>
            )}

            {/* Assistant message */}
            {!item.formatted.tool && item.role === 'assistant' && (
              <div className="text-sm">
                {item.formatted.transcript ||
                  item.formatted.text ||
                  '(truncated)'}
              </div>
            )}

            {/* Audio player */}
            {item.formatted.file && (
              <audio
                src={item.formatted.file.url}
                controls
                className="w-full"
              />
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
