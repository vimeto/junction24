"use client";

import { useCallback, useState, useRef, useEffect } from 'react';
import { RealtimeClient } from '@openai/realtime-api-beta';
import { ItemType } from '@openai/realtime-api-beta/dist/lib/client.js';
import { WavRecorder, WavStreamPlayer } from '~/lib/wavtools/index.js';
import { instructions } from '~/lib/system_prompts/realtime_config';
import { RealtimeEvent } from '../_types';
import { env } from '~/env';

const OPENAI_RELAY_SERVER_URL = env.NEXT_PUBLIC_OPENAI_RELAY_SERVER_URL;

export function useConversation() {
  const [isConnected, setIsConnected] = useState(false);
  const [items, setItems] = useState<ItemType[]>([]);

  const [realtimeEvents, setRealtimeEvents] = useState<RealtimeEvent[]>([]);
  const [expandedEvents, setExpandedEvents] = useState<{
    [key: string]: boolean;
  }>({});

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
    setItems(client.conversation.getItems());

    await wavRecorder.begin();
    await wavStreamPlayer.connect();
    await client.connect();

    client.sendUserMessageContent([
      {
        type: `input_text`,
        text: `Hello!`,
      },
    ]);

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
    setItems(client.conversation.getItems());
  }, []);

  useEffect(() => {
    const wavStreamPlayer = wavStreamPlayerRef.current;
    const client = clientRef.current;

    // Set up client configuration
    client.updateSession({ instructions: instructions });
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
      setItems(items);
    };

    // Add event listeners
    client.on('realtime.event', handleRealtimeEvent);
    client.on('error', handleError);
    client.on('conversation.interrupted', handleInterrupted);
    client.on('conversation.updated', handleConversationUpdated);

    setItems(client.conversation.getItems());

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
