"use client";

import { useState, useRef, useEffect } from "react";

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

interface Message {
  text?: string;
  role: "user" | "assistant";
  image?: string;
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
    // Add the image message to the chat
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        image: imageUrl,
      },
    ]);

    // process the image using the AI
    await handleSendImage(imageUrl);
  };
  const handleSendImage = async (imageUrl: string) => {
    setMessages((prev) => [
      ...prev,
      {
        text: "Analyzing image...",
        role: "assistant",
      },
    ]);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl: imageUrl,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to analyze image");
      }

      const data = await response.json();

      // Remove loading message and add AI response
      setMessages((prev) => {
        const withoutLoading = prev.slice(0, -1); // Remove loading message
        return [
          ...withoutLoading,
          {
            text: data.response,
            role: "assistant",
          },
        ];
      });
    } catch (error) {
      console.error("Error analyzing image:", error);

      // Remove loading message and add error message
      setMessages((prev) => {
        const withoutLoading = prev.slice(0, -1);
        return [
          ...withoutLoading,
          {
            text: "Sorry, I encountered an error analyzing the image. Please try again.",
            role: "assistant",
          },
        ];
      });
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
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {message.role === "user" ? "U" : "A"}
                        </AvatarFallback>
                        <AvatarImage
                          src={
                            message.role === "user"
                              ? "https://api.dicebear.com/7.x/avataaars/svg?seed=user"
                              : "https://api.dicebear.com/7.x/bottts/svg?seed=ai"
                          }
                        />
                      </Avatar>
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${message.role === "user" ? "bg-[#2a2a2c]" : "bg-[#323234]"}`}
                      >
                        {message.text && <p>{message.text}</p>}
                        {message.image && (
                          <img
                            src={message.image}
                            alt="Uploaded"
                            className="max-w-full rounded"
                          />
                        )}
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
