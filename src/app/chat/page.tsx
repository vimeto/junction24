"use client";

import { useState, useRef, useEffect } from "react";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { Card, CardContent, CardFooter } from "~/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Mic, MicOff, Send, Camera, Keyboard } from "lucide-react";
import useSpeechRecognition from "./_hooks/useSpeechRecognition";
import useAudioVisualization from "./_hooks/useAudioVisualization";
import AudioBar from "./audioBar";
import TextInput from "./textBar";

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
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

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

  const handleInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "1px";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`; // Adjust height to fit content
    }
  };

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
          <CardFooter className="sticky bottom-0 z-10 w-full border-none p-2">
            <div className="from-dark-700 to-dark-900 flex min-h-10 w-full items-center rounded-md bg-slate-800 bg-gradient-to-br p-2 shadow-lg">
              {isListening ? (
                <AudioBar
                  isListening={isListening}
                  isMuted={isMuted}
                  visualizationData={visualizationData}
                  toggleMute={toggleMute}
                  setIsListening={setIsListening}
                  fileInputRef={fileInputRef}
                />
              ) : (
                <TextInput
                  inputText={inputText}
                  setInputText={setInputText}
                  handleSend={handleSend}
                  handleInputChange={handleInputChange}
                  textareaRef={textareaRef}
                  isListening={isListening}
                  isMuted={isMuted}
                  toggleMute={toggleMute}
                  setIsListening={setIsListening}
                />
              )}
            </div>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
