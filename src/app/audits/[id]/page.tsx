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
import useSpeechRecognition from "./_hooks/useSpeechRecognition";
import useAudioVisualization from "./_hooks/useAudioVisualization";
import { InlineCamera } from "./camera";
import AudioBar from "./audioBar";
import TextInput from "./textBar";
import { getCurrentLocation } from "~/utils/getLocation";

interface Message {
  text?: string;
  sender: "user" | "ai";
  image?: string;
}

export default function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "Welcome to Tech Maintenance Support. How can I assist you today?",
      sender: "ai",
    },
  ]);
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
        sender: "user",
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
        sender: "ai",
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
            sender: "ai",
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
            sender: "ai",
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
    if (inputText.trim()) {
      try {
        // Get user location
        const location = await getCurrentLocation();

        // Define metadata (can be dynamically set in the future)
        const metadata = {
          latitude: location.latitude,
          longitude: location.longitude,
          // additional metadata fields can be added here
        };

        // Add metadata to the user message
        const textMetadata = addMetadata(metadata);

        // Add user message immediately
        const newMessage = { text: inputText, sender: "user" };
        setMessages([
          ...messages,
          {
            ...newMessage,
            text: newMessage.text || "",
            sender: newMessage.sender as "user" | "ai",
          },
        ]);
        setInputText("");

        // Call the API route
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: inputText, metadata: textMetadata }),
        });

        if (!response.ok) {
          throw new Error("Failed to get response");
        }

        const data = await response.json();

        // Add AI response
        setMessages((prevMessages) => [
          ...prevMessages,
          { text: data.response, sender: "ai" },
        ]);
      } catch (error) {
        console.error("Error getting location or sending message:", error);
        // Add error message
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            text: "Sorry, I encountered an error. Please try again.",
            sender: "ai",
          },
        ]);
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
      <div className="flex items-center justify-center">
        <Card className="z-0 flex min-h-screen w-full max-w-md flex-col border-gray-800 bg-[#1a1a1c] text-gray-200">
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-full" ref={scrollAreaRef}>
              <div className="space-y-4 p-4" ref={messagesContainerRef}>
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`flex items-end space-x-2 ${message.sender === "user" ? "flex-row-reverse space-x-reverse" : "flex-row"}`}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {message.sender === "user" ? "U" : "A"}
                        </AvatarFallback>
                        <AvatarImage
                          src={
                            message.sender === "user"
                              ? "https://api.dicebear.com/7.x/avataaars/svg?seed=user"
                              : "https://api.dicebear.com/7.x/bottts/svg?seed=ai"
                          }
                        />
                      </Avatar>
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${message.sender === "user" ? "bg-[#2a2a2c]" : "bg-[#323234]"}`}
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
                />
              )}
            </div>
            {showCamera && (
              <div className="absolute bottom-full left-0 right-0">
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
