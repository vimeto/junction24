"use client";

import { useEffect, useRef, useCallback } from 'react';

import { WavRenderer } from '~/lib/wav_renderer';
import { Button } from '~/components/ui/button';
import { RealtimeLayout } from './Layout';
import { Visualizer } from './Visualizer';
import { EventList } from './EventList';
import { ConversationList } from './ConversationList';
import { formatTime } from '../_utils/formatTime';
import { useConversation } from '../_hooks/useConversation';
import { Message } from '~/app/audits/[id]/_components/auditWindow';

interface RealtimeWindowProps {
  id: string;
  initialMessages: Message[];
}

export default function RealtimeWindow({ id, initialMessages }: RealtimeWindowProps) {
  const clientCanvasRef = useRef<HTMLCanvasElement>(null);
  const serverCanvasRef = useRef<HTMLCanvasElement>(null);
  const eventsScrollHeightRef = useRef(0);
  const eventsScrollRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<string>(new Date().toISOString());

  const {
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
  } = useConversation({ initialMessages });

  const formatTimeWithRef = useCallback((timestamp: string) => {
    return formatTime(startTimeRef.current, timestamp);
  }, []);

  useEffect(() => {
    let isLoaded = true;
    let animationFrameId: number;

    const wavRecorder = wavRecorderRef.current;
    const clientCanvas = clientCanvasRef.current;
    let clientCtx: CanvasRenderingContext2D | null = null;

    const wavStreamPlayer = wavStreamPlayerRef.current;
    const serverCanvas = serverCanvasRef.current;
    let serverCtx: CanvasRenderingContext2D | null = null;

    const render = () => {
      if (!isLoaded || !isConnected) return;

      if (clientCanvas) {
        if (!clientCanvas.width || !clientCanvas.height) {
          clientCanvas.width = clientCanvas.offsetWidth;
          clientCanvas.height = clientCanvas.offsetHeight;
        }
        clientCtx = clientCtx || clientCanvas.getContext('2d');
        if (clientCtx) {
          clientCtx.clearRect(0, 0, clientCanvas.width, clientCanvas.height);
          const result = wavRecorder.recording
            ? wavRecorder.getFrequencies('voice')
            : { values: new Float32Array([0]) };
          WavRenderer.drawBars(
            clientCanvas,
            clientCtx,
            result.values,
            '#0099ff',
            10,
            0,
            8
          );
        }
      }
      if (serverCanvas) {
        if (!serverCanvas.width || !serverCanvas.height) {
          serverCanvas.width = serverCanvas.offsetWidth;
          serverCanvas.height = serverCanvas.offsetHeight;
        }
        serverCtx = serverCtx || serverCanvas.getContext('2d');
        if (serverCtx) {
          serverCtx.clearRect(0, 0, serverCanvas.width, serverCanvas.height);
          const result = wavStreamPlayer.analyser
            ? wavStreamPlayer.getFrequencies('voice')
            : { values: new Float32Array([0]) };
          WavRenderer.drawBars(
            serverCanvas,
            serverCtx,
            result.values,
            '#009900',
            10,
            0,
            8
          );
        }
      }

      animationFrameId = window.requestAnimationFrame(render);
    };

    if (isConnected) {
      render();
    }

    return () => {
      isLoaded = false;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isConnected]);

  /**
   * Auto-scroll the event logs
   */
  useEffect(() => {
    if (eventsScrollRef.current) {
      const eventsEl = eventsScrollRef.current;
      const scrollHeight = eventsEl.scrollHeight;
      // Only scroll if height has just changed
      if (scrollHeight !== eventsScrollHeightRef.current) {
        eventsEl.scrollTop = scrollHeight;
        eventsScrollHeightRef.current = scrollHeight;
      }
    }
  }, [realtimeEvents]);

  /**
   * Auto-scroll the conversation logs
   */
  useEffect(() => {
    const conversationEls = [].slice.call(
      document.body.querySelectorAll('[data-conversation-content]')
    );
    for (const el of conversationEls) {
      const conversationEl = el as HTMLDivElement;
      conversationEl.scrollTop = conversationEl.scrollHeight;
    }
  }, [items]);

  /**
   * Render the application
   */
  return (
    <RealtimeLayout
      visualizer={
        <Visualizer
          clientCanvasRef={clientCanvasRef}
          serverCanvasRef={serverCanvasRef}
        />
      }
      events={
        <EventList
          events={realtimeEvents}
          expandedEvents={expandedEvents}
          onToggleExpand={(id) => {
            setExpandedEvents(prev => ({
              ...prev,
              [id]: !prev[id]
            }));
          }}
          formatTime={formatTimeWithRef}
        />
      }
      conversation={
        <ConversationList
          items={items}
          onDelete={deleteItem}
        />
      }
      connectButton={
        <Button
          variant={isConnected ? "destructive" : "default"}
          onClick={isConnected ? disconnect : connect}
        >
          {isConnected ? 'Disconnect' : 'Connect'}
        </Button>
      }
    />
  );
}
