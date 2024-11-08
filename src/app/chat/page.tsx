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
import {
  Mic,
  MicOff,
  Send,
  Camera,
  Image as ImageIcon,
  Keyboard,
} from "lucide-react";

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
  const [visualizationData, setVisualizationData] = useState<number[]>([]);

  const startVisualization = () => {
    const interval = setInterval(() => {
      const newData = Array(50)
        .fill(0)
        .map(() => Math.random() * 100);
      setVisualizationData(newData);
    }, 50);

    return () => clearInterval(interval);
  };

  const stopVisualization = () => {
    setVisualizationData([]);
  };

  return { visualizationData, startVisualization, stopVisualization };
};

interface UploadImageResponse {
  imageUrl: string;
}

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
    {
      text: "Hi, my computer is running very slowly. Can you help?",
      sender: "user",
    },
    {
      text: "I understand you're experiencing slow performance. Let's start by checking a few things. First, how long has this been happening?",
      sender: "ai",
    },
    { text: "It's been slow for about a week now.", sender: "user" },
  ]);
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { transcript, startListening, stopListening } = useSpeechRecognition();
  const { visualizationData, startVisualization, stopVisualization } =
    useAudioVisualization();

  useEffect(() => {
    if (transcript) {
      setInputText(transcript);
    }
  }, [transcript]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleSend = async () => {
    if (inputText.trim()) {
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

      const response = await sendMessage(inputText);
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: response, sender: "ai" },
      ]);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
      stopVisualization();
      setIsMuted(false);
    } else {
      startListening();
      startVisualization();
    }
    setIsListening(!isListening);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (!isMuted) {
      stopListening();
      stopVisualization();
    }
  };

  interface FileUploadEvent extends React.ChangeEvent<HTMLInputElement> {}

  const handleFileUpload = async (event: FileUploadEvent) => {
    const file = event.target.files?.[0];
    if (file) {
      const imageUrl = await uploadImage(file);
      const newMessage: Message = { image: imageUrl, sender: "user" };
      setMessages([
        ...messages,
        { ...newMessage, text: newMessage.text || "" },
      ]);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0b] p-4">
      <Card className="flex h-[600px] w-full max-w-md flex-col border-gray-800 bg-[#1a1a1c] text-gray-200">
        <CardHeader className="border-b border-gray-800">
          <CardTitle className="flex items-center justify-between text-lg font-semibold">
            <span>Tech Support</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-full">
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
                            ? "/placeholder-user.jpg"
                            : "/placeholder-ai.jpg"
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
        <CardFooter className="border-t border-gray-800 p-4">
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
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              capture="environment"
              onChange={handleFileUpload}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                fileInputRef.current && fileInputRef.current.click()
              }
              className="border-gray-700 bg-[#2a2a2c] hover:bg-[#323234]"
            >
              <ImageIcon className="h-4 w-4" />
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
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 border-gray-700 bg-[#2a2a2c] text-gray-200 placeholder-gray-500"
              />
            )}

            {isListening && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsListening(false)}
                className="border-gray-700 bg-[#2a2a2c] hover:bg-[#323234]"
              >
                <Keyboard className="h-4 w-4" />
              </Button>
            )}

            <Button
              variant="outline"
              size="icon"
              onClick={isMuted ? toggleMute : toggleListening}
              className={`${isMuted ? "bg-red-900 hover:bg-red-800" : "bg-[#2a2a2c] hover:bg-[#323234]"} border-gray-700`}
            >
              {isMuted ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>

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
  );
}
