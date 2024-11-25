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
import remarkGfm from 'remark-gfm';
import { Mic, MicOff, Keyboard, Camera, X, MicOff as MicMuted } from 'lucide-react';
import { Input } from "~/components/ui/input";

interface RealtimeWindowProps {
  id: string;
  initialMessages: Message[];
}

const ReactMarkdownComponent: React.FC<{ message: string | undefined }> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="overflow-x-auto">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => (
            <p className="m-0 whitespace-pre-wrap break-words overflow-wrap-anywhere leading-relaxed max-w-[65ch] hyphens-auto [hyphens:auto] [-webkit-hyphens:auto] [-ms-hyphens:auto]">
              {children}
            </p>
          ),
          pre: ({ children }) => (
            <pre className="overflow-x-auto p-2 bg-[#1a1a1c] rounded whitespace-pre-wrap break-all">
              {children}
            </pre>
          ),
          code: ({ children }) => (
            <code className="bg-[#1a1a1c] px-1 rounded break-all">{children}</code>
          ),
        }}
      >
        {message}
      </ReactMarkdown>
    </div>
  );
};

export default function RealtimeWindow({ id, initialMessages }: RealtimeWindowProps) {
  const clientCanvasRef = useRef<HTMLCanvasElement>(null);
  const serverCanvasRef = useRef<HTMLCanvasElement>(null);
  const eventsScrollHeightRef = useRef(0);
  const eventsScrollRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<string>(new Date().toISOString());
  const [showCamera, setShowCamera] = useState(false);
  const [isKeyboardMode, setIsKeyboardMode] = useState(false);
  const [textInput, setTextInput] = useState("");

  const {
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

  useEffect(() => {
    const scrollToBottom = () => {
      const viewport = document.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTo({
          top: viewport.scrollHeight,
          behavior: 'smooth'
        });
      } else {
        console.error("Could not find viewport element");
      }
    };

    // Add a small delay to ensure content is rendered
    const timeoutId = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timeoutId);
  }, [items]);

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || !isConnected) return;

    const client = clientRef.current;
    await client.sendUserMessageContent([
      {
        type: "input_text",
        text: textInput,
      },
    ]);
    setTextInput("");
  };

  /**
   * Render the application
   */
  return (
    <div className="mx-auto flex corrected-h-screen w-full items-center justify-center">
      <div className="h-full w-full max-w-md max-h-[800px]">
        <Card className="z-0 flex h-full w-full flex-col border-gray-800 bg-[#1a1a1c] text-gray-200">
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full">
              <div className="space-y-4 p-4" ref={scrollAreaRef}>
                {items.slice(1).map((item) => (
                  <div
                    key={item.id}
                    className={`flex ${item.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`flex items-end space-x-2 ${item.role === "user" ? "flex-row-reverse space-x-reverse" : "flex-row"}`}
                    >
                      <Avatar className="h-8 w-8 rounded-full">
                        <AvatarFallback>
                          {item.role === "user" ? "U" : "A"}
                        </AvatarFallback>
                        <AvatarImage
                          src={
                            item.role === "user"
                              ? "https://uploads.commoninja.com/searchengine/wordpress/user-avatar-reloaded.png"
                              : "https://st5.depositphotos.com/72897924/62255/v/450/depositphotos_622556394-stock-illustration-robot-web-icon-vector-illustration.jpg"
                          }
                        />
                      </Avatar>
                      <div
                        className={`max-w-[80%] rounded-lg p-3 prose prose-invert ${item.role === "user" ? "bg-[#2a2a2c]" : "bg-[#323234]"}`}
                        >
                        {/* Tool response */}
                        {item.type === 'function_call_output' && (
                          <ReactMarkdownComponent message={item.formatted.output} />
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
                            <ReactMarkdownComponent message={item.formatted.transcript ||
                                (item.formatted.audio?.length
                                  ? '(awaiting transcript)'
                                  : item.formatted.text ||
                                    '(item sent)')
                              }
                            />
                          </div>
                        )}

                        {/* Assistant message */}
                        {!item.formatted.tool && item.role === 'assistant' && (
                          <div className="text-sm">
                            <ReactMarkdownComponent message={item.formatted.transcript ||
                              item.formatted.text ||
                              (item.content && item.content[0]?.transcript) ||
                              '(truncated)'}
                            />
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
            <div className="flex min-h-12 w-full flex-col space-y-2">
              {/* Controls Row */}
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
                  {showCamera ? <X className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
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

                {isConnected && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleMute}
                    className={`border-none bg-transparent ${
                      isMuted
                        ? "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20"
                        : "text-white hover:bg-transparent hover:text-neutral-700"
                    }`}
                  >
                    {isMuted ? (
                      <MicMuted className="h-4 w-4" />
                    ) : (
                      <Mic className="h-4 w-4 text-green-500" />
                    )}
                  </Button>
                )}

                <div className="flex h-10 flex-1">
                  <Visualizer
                    clientCanvasRef={clientCanvasRef}
                    serverCanvasRef={serverCanvasRef}
                  />
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsKeyboardMode(!isKeyboardMode)}
                  className={`border-none bg-transparent ${
                    isKeyboardMode
                      ? "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
                      : "text-white hover:bg-transparent hover:text-neutral-700"
                  }`}
                >
                  <Keyboard className="h-4 w-4" />
                </Button>
              </div>

              {/* Text Input Row */}
              {isKeyboardMode && isConnected && (
                <form onSubmit={handleTextSubmit} className="flex w-full space-x-2">
                  <Input
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-[#2a2a2c] border-gray-800 text-gray-200 focus:ring-blue-500"
                  />
                  <Button
                    type="submit"
                    variant="outline"
                    className="border-gray-800 bg-[#2a2a2c] text-gray-200 hover:bg-[#323234]"
                    disabled={!textInput.trim()}
                  >
                    Send
                  </Button>
                </form>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
