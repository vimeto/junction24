"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from 'react-markdown';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}
import { Card, CardContent, CardFooter } from "~/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { ScrollArea } from "~/components/ui/scroll-area";
import useSpeechRecognition from "../_hooks/useSpeechRecognition";
import useAudioVisualization from "../_hooks/useAudioVisualization";
import { InlineCamera } from "../camera";
import AudioBar from "../audioBar";
import TextInput from "../textBar";
import { getCurrentLocation } from "~/utils/getLocation";

export interface Message {
  id?: number;
  text?: string;
  role: "user" | "assistant";
  image?: string;
  isLoading?: boolean;
}

interface PageProps {
  params: {
    id: string;
    initialMessages: Message[];
  };
}


export default function AuditWindow({ params }: PageProps) {
  const auditUuid = params.id;
  const initialMessages = params.initialMessages;

  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { transcript, startListening, stopListening } = useSpeechRecognition();
  const {
    visualizationData,
    startVisualization,
    stopVisualization,
    toggleMute,
    isMuted,
  } = useAudioVisualization();
  const [isListening, setIsListening] = useState(true); // Start in audio mode by default
  const [inputText, setInputText] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const endOfChatsRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isListening && !isMuted) {
      startVisualization();
    } else {
      stopVisualization();
    }
  }, [isListening]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (isListening) {
      setIsListening(false); // Switch to chat mode and mute mic on typing
    }
  };

  const handleImageUpload = async (imageUrl: string) => {
    // Generate unique ID for message pair
    const messageId = Date.now();

    // Immediately show image with loading state
    setMessages(prev => [
      ...prev,
      {
        id: messageId,
        role: "user",
        image: imageUrl
      },
      {
        id: messageId + 1,
        role: "assistant",
        text: "Analyzing image...",
        isLoading: true
      }
    ]);

    try {
      const location = await getCurrentLocation();
      const body = JSON.stringify({
        imageUrl,
        location,
        auditUuid
      });

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body
      });

      if (!response.ok) {
        throw new Error("Failed to analyze image");
      }

      const data = await response.json();

      // Update only the assistant message
      setMessages(prev => prev.map(msg =>
        msg.id === messageId + 1
          ? { ...msg, text: data.response, isLoading: false }
          : msg
      ));

    } catch (error) {
      // Update error state while keeping the image
      setMessages(prev => prev.map(msg =>
        msg.id === messageId + 1
          ? { ...msg, text: "Error analyzing image. Please try again.", isLoading: false }
          : msg
      ));
    }
  };

  useEffect(() => {
    if (transcript) {
      setInputText(transcript);
    }
  }, [transcript]);

  // Helper function to add metadata to user message
  interface Metadata {
    latitude: number;
    longitude: number;
    [key: string]: any;
  }

  const addMetadata = (
    metadata: Metadata = { latitude: 0, longitude: 0 },
  ): string => {
    let metadataText = "\n\nMetadata";
    for (const [key, value] of Object.entries(metadata)) {
      metadataText += `\n\t-${key}: ${value}`;
    }
    return `${metadataText}`;
  };

  // Modified sendMessage function
  const handleSend = async () => {
    if (inputText.trim() && !isLoading) {
      try {
        setIsLoading(true);
        // Get user location
        const location = await getCurrentLocation();

        const previousMessages = messages.map(msg => ({
          role: msg.role,
          content: msg.text || ""
        }));

        // Add user message immediately
        const newMessage = { text: inputText, sender: "user" };
        setMessages([
          ...messages,
          {
            ...newMessage,
            text: newMessage.text || "",
            role: newMessage.sender as "user" | "assistant",
          },
        ]);
        setInputText("");

        // Call the API route
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: inputText,
            location: location,
            previousMessages,
            auditUuid: auditUuid
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to get response");
        }

        const data = await response.json();

        // Add AI response
        setMessages((prevMessages) => [
          ...prevMessages,
          { text: data.response, role: "assistant" },
        ]);
      } catch (error) {
        console.error("Error sending message:", error);
        // Add error message
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            text: "Sorry, I encountered an error. Please try again.",
            role: "assistant",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const scrollAreaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (
      scrollAreaRef.current &&
      messagesContainerRef.current &&
      endOfChatsRef.current
    ) {
      const messagesContainer = messagesContainerRef.current;
      // Total height of all messages
      const messagesHeight = messagesContainer.scrollHeight;
      // Determine if content overflows
      const isOverflowing = messagesHeight > screen.height;

      if (isOverflowing) {
        // Scroll to the bottom
        endOfChatsRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [messages]);
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <>
      <div className="flex h-full items-center justify-center">
        <Card className="z-0 flex h-full w-full flex-col border-gray-800 bg-[#1a1a1c] text-gray-200">
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full" ref={scrollAreaRef}>
              <div className="space-y-4 p-4" ref={messagesContainerRef}>
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`flex items-end space-x-2 ${message.role === "user" ? "flex-row-reverse space-x-reverse" : "flex-row"}`}
                    >
                      <Avatar className="h-10 w-10">
                        {message.role === "user" ? (
                          <>
                            <AvatarFallback>U</AvatarFallback>
                            <AvatarImage
                              src="data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cdefs%3E%3ClinearGradient id='grad1' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23FFFFFF;stop-opacity:1' /%3E%3Cstop offset='40%25' style='stop-color:%23BBBBBB;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%23303030;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath fill='url(%23grad1)' d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E"
                            />
                          </>
                        ) : (
                          <AvatarImage src="/logit.jpg" />
                        )}
                      </Avatar>
                      <div
                        className={`min-w-[200px] max-w-[80%] rounded-lg p-3 prose prose-invert ${
                          message.role === "user" ? "bg-[#2a2a2c]" : "bg-[#323234]"
                        }`}
                      >
                        <div className="overflow-hidden break-words hyphens-auto [hyphens:auto] [-webkit-hyphens:auto] [-ms-hyphens:auto]">
                          {message.text && (
                            <>
                              <ReactMarkdown
                                components={{
                                  p: ({ children }) => {
                                    const formattedText = children?.toString().replace(/:\s*(\S)/g, ': $1');
                                    return (
                                      <p className="m-0 whitespace-pre-wrap break-words overflow-wrap-anywhere leading-relaxed min-w-[180px] max-w-[65ch] hyphens-auto [hyphens:auto] [-webkit-hyphens:auto] [-ms-hyphens:auto]">
                                        {formattedText}
                                      </p>
                                    );
                                  },
                                  pre: ({ children }) => (
                                    <pre className="overflow-x-auto p-2 bg-[#1a1a1c] rounded whitespace-pre-wrap break-all min-w-[180px]">
                                      {children}
                                    </pre>
                                  ),
                                  code: ({ children }) => (
                                    <code className="bg-[#1a1a1c] px-1 rounded break-all">
                                      {children}
                                    </code>
                                  ),
                                }}
                              >
                                {message.text}
                              </ReactMarkdown>
                              {message.isLoading && (
                                <div className="animate-pulse mt-2">
                                  <div className="h-2 bg-gray-700 rounded w-16"></div>
                                </div>
                              )}
                            </>
                          )}
                          {message.image && (
                            <img
                              src={message.image}
                              alt="Uploaded"
                              className="max-w-full rounded transition-opacity duration-300"
                              loading="lazy"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={endOfChatsRef} />
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="sticky bottom-0 z-10 w-full border-gray-800 bg-[#1a1a1c] p-4">
            <div className="flex min-h-12 w-full items-center space-x-2">
              {isListening ? (
                <AudioBar
                  isListening={isListening}
                  isMuted={isMuted}
                  visualizationData={visualizationData}
                  toggleMute={toggleMute}
                  setIsListening={setIsListening}
                  fileInputRef={fileInputRef}
                  showCamera={showCamera}
                  setShowCamera={setShowCamera}
                  handleImageUpload={handleImageUpload}
                />
              ) : (
                <TextInput
                  inputText={inputText}
                  setInputText={setInputText}
                  handleSend={handleSend}
                  handleInputChange={handleInputChange}
                  isListening={isListening}
                  isMuted={isMuted}
                  toggleMute={toggleMute}
                  setIsListening={setIsListening}
                  showCamera={showCamera}
                  setShowCamera={setShowCamera}
                  isLoading={isLoading}
                />
              )}
            </div>
            {showCamera && (
              <div className="fixed inset-0 z-50 bg-black">
                <InlineCamera
                  onClose={() => setShowCamera(false)}
                  onImageUploaded={(imageUrl) => handleImageUpload(imageUrl)}
                />
              </div>
            )}
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
