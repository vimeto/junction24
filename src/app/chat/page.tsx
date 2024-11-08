"use client";

import { useState, useRef, useEffect } from "react";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "~/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Mic, MicOff, Send, Camera, Keyboard, X } from "lucide-react";
import useSpeechRecognition from "./_hooks/useSpeechRecognition";
import useAudioVisualization from "./_hooks/useAudioVisualization";
import { InlineCamera } from "./camera";

interface Message {
  text?: string;
  sender: "user" | "ai";
  image?: string;
}

interface SendMessageResponse {
  text: string;
}

const sendMessage = async (text: string): Promise<string> => {
  console.log("Sending message:", text);
  const responses: string[] = [
    "Based on your description, it sounds like the issue might be related to the system's cooling fan. Have you checked if it's running properly?",
    "I recommend checking the device's power supply. Can you verify if all cables are securely connected?",
    "It seems like there might be a software conflict. Let's try running a system diagnostic. Can you open the command prompt and type 'sfc /scannow'?",
    "The symptoms you're describing could indicate a hard drive issue. When was the last time you ran a disk check?",
    "Have you recently installed any new hardware or software? This could be causing compatibility issues with your system.",
  ];
  return (
    responses[Math.floor(Math.random() * responses.length)] ||
    "Sorry, I couldn't generate a response."
  );
};

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
    setIsMuted,
  } = useAudioVisualization();
  const [isListening, setIsListening] = useState(true); // Start in audio mode by default
  const [inputText, setInputText] = useState("");
  const [showCamera, setShowCamera] = useState(false);

  useEffect(() => {
    if (isListening) {
      startVisualization();
    } else {
      stopVisualization();
      setIsMuted(true); // Mute the mic automatically if switching to chat mode
    }
  }, [isListening]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (isListening) {
      setIsListening(false); // Switch to chat mode and mute mic on typing
    }
  };

  useEffect(() => {
    if (transcript) {
      setInputText(transcript);
    }
  }, [transcript]);

  const handleSend = async () => {
    if (inputText.trim()) {
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

      try {
        // Call the API route
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: inputText }),
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
        console.error("Error sending message:", error);
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
              <div className="space-y-4 p-4">
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
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="sticky bottom-0 z-10 w-full border-gray-800 bg-[#1a1a1c] p-4">
            <div className="flex w-full items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowCamera(!showCamera)}
                className={`border-gray-700 ${
                  showCamera 
                    ? "bg-red-500/10 hover:bg-red-500/20 text-red-500" 
                    : "bg-[#2a2a2c] hover:bg-[#323234]"
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
                onClick={() => {
                  if (isListening) {
                    toggleMute(); // Only toggle mute if in audio mode
                  } else {
                    setIsListening(true);
                    toggleMute(); // Switch back to audio mode
                  }
                }}
                className={`border-gray-700 bg-[#2a2a2c] hover:bg-[#323234]`}
              >
                {isMuted ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>

              {isListening ? (
                <div className="flex h-10 flex-1 items-center overflow-hidden rounded-md bg-[#2a2a2c] px-2">
                  {visualizationData.map((value, index) => (
                    <div
                      key={index}
                      className="mx-px w-0.5 bg-gray-400"
                      style={{ height: `${value}%` }}
                    ></div>
                  ))}
                </div>
              ) : (
                <Input
                  placeholder="Type a message..."
                  value={inputText}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      if (e.shiftKey) {
                        setInputText((prev) => prev + "\n"); // Shift+Enter for new line
                      } else {
                        e.preventDefault();
                        // Send message logic here
                        setInputText("");
                      }
                    }
                  }}
                  className="flex-1 border-gray-700 bg-[#2a2a2c] text-gray-200 placeholder-gray-500"
                />
              )}

              {isListening && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setIsListening(false);
                    setIsMuted(true);
                  }}
                  className="border-gray-700 bg-[#2a2a2c] hover:bg-[#323234]"
                >
                  <Keyboard className="h-4 w-4" />
                </Button>
              )}

              {!isListening && (
                <Button
                  onClick={handleSend}
                  className="bg-[#3a3a3c] text-white hover:bg-[#454547]"
                >
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </div>
            {showCamera && (
              <div className="absolute bottom-full left-0 right-0">
                <InlineCamera onClose={() => setShowCamera(false)} />
              </div>
            )}
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
