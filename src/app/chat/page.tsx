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
import { Mic, MicOff, Send, Camera, Keyboard } from "lucide-react";

const useSpeechRecognition = () => {
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<
    Window["SpeechRecognition"] | Window["webkitSpeechRecognition"] | null
  >(null);

  useEffect(() => {
    if (
      (typeof window !== "undefined" && "SpeechRecognition" in window) ||
      "webkitSpeechRecognition" in window
    ) {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      if (recognitionRef.current) {
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
      }

      recognitionRef.current.onresult = (event: any) => {
        const current: number = event.resultIndex;
        const transcript: string = event.results[current][0].transcript;
        setTranscript(transcript);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  return { transcript, startListening, stopListening };
};

const useAudioVisualization = () => {
  const [visualizationData, setVisualizationData] = useState<number[]>(
    Array(50).fill(0),
  );
  const [isMuted, setIsMuted] = useState(true); // Start with mic muted
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const startVisualization = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 128;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      dataArrayRef.current = dataArray;

      const visualize = () => {
        if (analyserRef.current && dataArrayRef.current) {
          analyserRef.current.getByteFrequencyData(dataArrayRef.current);

          // Display blank line if muted, otherwise show audio levels
          const newData = isMuted
            ? Array(50).fill(0)
            : Array.from(dataArrayRef.current).map((value) =>
                value > 0 ? value : 0,
              );

          setVisualizationData(newData);
        }

        animationRef.current = requestAnimationFrame(visualize);
      };

      visualize();
    } catch (err) {
      console.error("Error accessing the microphone:", err);
    }
  };

  const stopVisualization = () => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    setVisualizationData(Array(50).fill(0)); // Reset to silent line
  };

  const toggleMute = () => {
    if (isMuted) {
      startVisualization(); // Start mic when unmuting
    } else if (mediaStreamRef.current) {
      // Mute mic by stopping the media stream tracks
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsMuted((prev) => !prev);
  };

  return {
    visualizationData,
    startVisualization,
    stopVisualization,
    toggleMute,
    isMuted,
    setIsMuted,
  };
};

const uploadImage = async (file: File): Promise<string> => {
  console.log("Uploading image:", file);
  return URL.createObjectURL(file);
};

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
            sender: "ai" 
          },
        ]);
      }
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
      stopVisualization();
    } else {
      startListening();
      startVisualization();
    }
    setIsListening(!isListening);
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
                onClick={() =>
                  fileInputRef.current && fileInputRef.current.click()
                }
                className="border-gray-700 bg-[#2a2a2c] hover:bg-[#323234]"
              >
                <Camera className="h-4 w-4" />
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
                className={`${isMuted ? "text-red-900 hover:text-red-800" : "bg-[#2a2a2c] hover:bg-[#323234]"} border-gray-700`}
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
                  className="bg-[#3a3a3c] hover:bg-[#454547]"
                >
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
