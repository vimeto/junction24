"use client";

import { useEffect, useRef, useCallback, useState } from 'react';

import { WavRenderer } from '~/lib/wav_renderer';
import { Button } from '~/components/ui/button';
import { RealtimeLayout } from './Layout';
import { Visualizer } from './Visualizer';
import { EventList } from './EventList';
import { ConversationList } from './ConversationList';
import { formatTime } from '../_utils/formatTime';
import { useConversation } from '../_hooks/useConversation';
import { Message } from '~/app/audits/[id]/_components/auditWindow';
import { Card, CardContent, CardFooter } from "~/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { ScrollArea } from "~/components/ui/scroll-area";
import ReactMarkdown from 'react-markdown';
import { Mic, MicOff, Keyboard, Camera, X } from 'lucide-react';

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
  const [showCamera, setShowCamera] = useState(false);

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
    <div className="mx-auto flex h-screen w-full items-center justify-center">
      <div className="h-full w-full max-w-md max-h-[800px]">
        <Card className="z-0 flex h-full w-full flex-col border-gray-800 bg-[#1a1a1c] text-gray-200">
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full">
              <div className="space-y-4 p-4">
                {items.slice(1).map((item) => (
                  <div
                    key={item.id}
                    className={`flex ${item.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`flex items-end space-x-2 ${item.role === "user" ? "flex-row-reverse space-x-reverse" : "flex-row"}`}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {item.role === "user" ? "U" : "A"}
                        </AvatarFallback>
                        <AvatarImage
                          src={
                            item.role === "user"
                              ? "https://api.dicebear.com/7.x/avataaars/svg?seed=user"
                              : "https://api.dicebear.com/7.x/bottts/svg?seed=ai"
                          }
                        />
                      </Avatar>
                      <div
                        className={`max-w-[80%] rounded-lg p-3 prose prose-invert ${item.role === "user" ? "bg-[#2a2a2c]" : "bg-[#323234]"}`}
                        >
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
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="sticky bottom-0 z-10 w-full border-gray-800 bg-[#1a1a1c] p-4">
            <div className="flex min-h-12 w-full items-center space-x-2">
              <div className="w-full">
                <div className="flex w-full items-center space-x-1">
                  <Button
                    size="icon"
                    onClick={() => setShowCamera(!showCamera)}
                    className={`border-none bg-transparent ${
                      showCamera
                        ? "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                        : "text-white hover:bg-transparent hover:text-neutral-700"
                    }`}
                  >
                    {showCamera ? (
                      <X className="h-4 w-4" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={isConnected ? disconnect : connect}
                    className={`border-none bg-transparent ${
                      !isConnected
                        ? "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                        : "text-white hover:bg-transparent hover:text-neutral-700"
                    }`}
                  >
                    {!isConnected ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>

                  <div className="flex h-10 flex-1">
                    <Visualizer
                      clientCanvasRef={clientCanvasRef}
                      serverCanvasRef={serverCanvasRef}
                    />
                  </div>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      // Add keyboard mode toggle here if needed
                    }}
                    className="border-none bg-transparent p-0 text-white hover:bg-transparent hover:text-neutral-700"
                  >
                    <Keyboard className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
