"use client";

import { useCallback, useState, useRef, useEffect } from 'react';
import { RealtimeClient } from '@openai/realtime-api-beta';
import { InputTextContentType, ItemType } from '@openai/realtime-api-beta/dist/lib/client.js';
import { WavRecorder, WavStreamPlayer } from '~/lib/wavtools/index.js';
import { instructions } from '~/lib/system_prompts/realtime_config';
import { RealtimeEvent } from '../_types';
import { env } from '~/env';
import { Message } from '~/app/audits/[id]/_components/auditWindow';
import { auditTool } from "~/app/api/chat/tools";

type UpdatedItemType = ItemType & {
  content?: {
    type?: string;
    transcript?: string;
  }[];
};

const OPENAI_RELAY_SERVER_URL = env.NEXT_PUBLIC_OPENAI_RELAY_SERVER_URL;

export function useConversation({ initialMessages }: { initialMessages: Message[] }) {
  const [isConnected, setIsConnected] = useState(false);
  const [items, setItems] = useState<UpdatedItemType[]>([]);

  const [realtimeEvents, setRealtimeEvents] = useState<RealtimeEvent[]>([]);
  const [expandedEvents, setExpandedEvents] = useState<{
    [key: string]: boolean;
  }>({});

  const [isMuted, setIsMuted] = useState(false);

  const wavRecorderRef = useRef<WavRecorder>(
    new WavRecorder({ sampleRate: 24000 })
  );
  const wavStreamPlayerRef = useRef<WavStreamPlayer>(
    new WavStreamPlayer({ sampleRate: 24000 })
  );
  const clientRef = useRef<RealtimeClient>(
    new RealtimeClient({ url: OPENAI_RELAY_SERVER_URL })
  );

  const connect = useCallback(async () => {
    const client = clientRef.current;
    const wavRecorder = wavRecorderRef.current;
    const wavStreamPlayer = wavStreamPlayerRef.current;

    setIsConnected(true);
    setRealtimeEvents([]);
    setItems(client.conversation.getItems() as UpdatedItemType[]);

    await wavRecorder.begin();
    await wavStreamPlayer.connect();
    await client.connect();

    // Add the audit tool
    client.addTool({
      name: "audit_item_location",
      description: "Generates a report stating that the item has been audited to the provided location.",
      parameters: {
        type: "object",
        required: ["auditer_id", "item_id", "audit_id"],
        properties: {
          auditer_id: {
            type: "integer",
            description: "Unique identifier for the auditor"
          },
          item_id: {
            type: "integer",
            description: "Unique identifier for the item being audited"
          },
          location_id: {
            type: "integer",
            description: "Unique identifier for the location"
          },
          audit_id: {
            type: "integer",
            description: "Unique identifier for the audit. This is the audit ID!"
          },
          metadata: {
            type: "object",
            description: "Additional audit information",
            properties: {
              latitude: {
                type: "number",
                description: "Latitude coordinate of the location"
              },
              longitude: {
                type: "number",
                description: "Longitude coordinate of the location"
              },
              comments: {
                type: "string",
                description: "Optional comments about the audit"
              },
              condition: {
                type: "string",
                enum: ["good", "fair", "poor"],
                description: "Optional assessment of the item's condition"
              },
              image_url: {
                type: "string",
                description: "URL of the audit image if provided"
              },
              image_confirmed: {
                type: "boolean",
                description: "Whether the image has been confirmed"
              },
              serial_number: {
                type: "string",
                description: "Serial number of the item if applicable"
              }
            }
          }
        },
        additionalProperties: false
      }
    }, async (params: any) => {
      console.log(params);
      try {
        const response = await fetch('/api/realtime/audit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params),
        });

        if (!response.ok) {
          throw new Error('Failed to create audit');
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || 'Failed to create audit');
        }

        return {
          success: true,
          message: "Audit created successfully",
          auditId: result.itemAuditId
        };
      } catch (error) {
        console.error('Audit tool error:', error);
        throw error;
      }
    });

    let messageHistory: InputTextContentType[] = []
    if (initialMessages.length > 0) {
      const initialMessage = { type: `input_text` as const, text: `You are an auditor assistant for Kone. Your job is to help users audit items. You must return all text in markdown format, and always be as concise as possible!\n\nThe following is the history of the previous conversations` }
      const previousMessages = initialMessages.map((message) => ({
        type: `input_text` as const,
        text: `${message.role === "user" ? "User" : "Assistant"}: ${message.text}`
      }));
      const finalMessage = { type: `input_text` as const, text: `That was it! If there was a question, please answer it, otherwise answer with a neutral greeting.` }
      messageHistory = [initialMessage, ...previousMessages, finalMessage]
    }
    else {
      messageHistory.push({
        type: `input_text`,
        text: `Hello!`,
      })
    }
    client.sendUserMessageContent(messageHistory);

    if (client.getTurnDetectionType() === 'server_vad') {
      await wavRecorder.record((data) => client.appendInputAudio(data.mono));
    }
  }, []);

  const disconnect = useCallback(async () => {
    setIsConnected(false);
    setItems([]);
    setRealtimeEvents([]);

    const client = clientRef.current;
    client.disconnect();

    const wavRecorder = wavRecorderRef.current;
    await wavRecorder.end();

    const wavStreamPlayer = wavStreamPlayerRef.current;
    await wavStreamPlayer.interrupt();
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    const client = clientRef.current;
    client.deleteItem(id);
    // Update items after deletion
    setItems(client.conversation.getItems() as UpdatedItemType[]);
  }, []);

  const toggleMute = useCallback(async () => {
    const wavRecorder = wavRecorderRef.current;
    setIsMuted(prev => !prev);

    if (isMuted) {
      const client = clientRef.current;
      const wavStreamPlayer = wavStreamPlayerRef.current;
      const trackSampleOffset = await wavStreamPlayer.interrupt();
      if (trackSampleOffset?.trackId) {
        const { trackId, offset } = trackSampleOffset;
        await client.cancelResponse(trackId, offset);
      }
      await wavRecorder.record((data) => client.appendInputAudio(data.mono));
    } else {
      // Mute: pause recording
      await wavRecorder.pause();
    }
  }, [isMuted]);

  useEffect(() => {
    const wavStreamPlayer = wavStreamPlayerRef.current;
    const client = clientRef.current;

    // Set up client configuration
    client.updateSession({ instructions: instructions });
    client.updateSession({ voice: 'ash' });
    client.updateSession({ input_audio_transcription: { model: 'whisper-1' } });
    client.updateSession({ turn_detection: { type: 'server_vad' } });

    // Define event handlers
    const handleRealtimeEvent = (realtimeEvent: RealtimeEvent) => {
      setRealtimeEvents((realtimeEvents) => {
        const lastEvent = realtimeEvents[realtimeEvents.length - 1];
        if (lastEvent?.event.type === realtimeEvent.event.type && lastEvent) {
          lastEvent.count = (lastEvent.count || 0) + 1;
          return realtimeEvents.slice(0, -1).concat(lastEvent);
        } else {
          return realtimeEvents.concat(realtimeEvent);
        }
      });
    };

    const handleError = (event: any) => console.error(event);

    const handleInterrupted = async () => {
      const trackSampleOffset = await wavStreamPlayer.interrupt();
      if (trackSampleOffset?.trackId) {
        const { trackId, offset } = trackSampleOffset;
        await client.cancelResponse(trackId, offset);
      }
    };

    const handleConversationUpdated = async ({ item, delta }: any) => {
      const items = client.conversation.getItems();
      if (delta?.audio) {
        wavStreamPlayer.add16BitPCM(delta.audio, item.id);
      }
      if (item.status === 'completed' && item.formatted.audio?.length) {
        const wavFile = await WavRecorder.decode(
          item.formatted.audio,
          24000,
          24000
        );
        item.formatted.file = wavFile;
      }
      setItems(items as UpdatedItemType[]);
    };

    // Add event listeners
    client.on('realtime.event', handleRealtimeEvent);
    client.on('error', handleError);
    client.on('conversation.interrupted', handleInterrupted);
    client.on('conversation.updated', handleConversationUpdated);

    setItems(client.conversation.getItems() as UpdatedItemType[]);

    // Cleanup function
    return () => {
      client.off('realtime.event', handleRealtimeEvent);
      client.off('error', handleError);
      client.off('conversation.interrupted', handleInterrupted);
      client.off('conversation.updated', handleConversationUpdated);
      client.reset();
    };
  }, []);

  return {
    isConnected,
    isMuted,
    toggleMute,
    items,
    wavRecorderRef,
    wavStreamPlayerRef,
    clientRef,
    connect,
    disconnect,
    deleteItem,
    setItems,
    realtimeEvents,
    expandedEvents,
    setExpandedEvents,
  };
}
