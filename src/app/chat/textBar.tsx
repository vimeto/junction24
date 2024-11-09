import React, { useState, useEffect, useRef } from "react";
import { Textarea } from "~/components/ui/textarea";
import { Button } from "~/components/ui/button";
import { Mic, Send, Camera } from "lucide-react"; // Replace with actual icons
import { set } from "zod";

interface TextInputProps {
  inputText: string;
  setInputText: React.Dispatch<React.SetStateAction<string>>;
  handleSend: () => void;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  isMuted: boolean;
  isListening: boolean;
  toggleMute: () => void;
  setIsListening: React.Dispatch<React.SetStateAction<boolean>>;
}

const TextInput: React.FC<TextInputProps> = ({
  inputText,
  setInputText,
  handleSend,
  handleInputChange,
  isListening,
  isMuted,
  toggleMute,
  setIsListening,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const handleInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "30px";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };
  useEffect(() => {
    handleInput();
  }, [inputText]);
  useEffect(() => {
    if (isFocused && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = "30px";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [isFocused]);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center space-y-2 border-none bg-transparent">
      {isFocused && (
        <div className="max-h-64 w-full overflow-y-auto">
          <Textarea
            ref={textareaRef}
            placeholder="Type a message..."
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              } else if (e.key === "Enter" && e.shiftKey) {
                setInputText((prevText) => prevText + "\n");
              }
            }}
            onBlur={() => setIsFocused(false)}
            className="w-full flex-1 resize-none rounded-md bg-transparent p-2 placeholder-neutral-500 focus:outline-none"
            style={{ height: "auto", overflowY: "hidden" }}
          />
        </div>
      )}

      <div className="flex w-full items-center space-x-2">
        <Button
          size="icon"
          className="bg-transparent text-white hover:bg-transparent hover:text-neutral-700"
        >
          <Camera className="h-5 w-5" />
        </Button>
        <Button
          size="icon"
          onClick={() => {
            toggleMute();
            setIsListening(!isListening);
          }}
          className="bg-transparent text-white hover:bg-transparent hover:text-neutral-700"
        >
          <Mic className="h-5 w-5" />
        </Button>
        {!isFocused ? (
          <Textarea
            ref={textareaRef}
            placeholder="Type a message..."
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              } else if (e.key === "Enter" && e.shiftKey) {
                setInputText((prevText) => prevText + "\n");
              }
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="h-5 flex-1 resize-none border-none bg-transparent placeholder-neutral-500"
            rows={1}
          />
        ) : (
          // Empty placeholder div to keep button positions fixed
          <div className="h-5 flex-1"></div>
        )}

        <Button
          onClick={() => {
            setIsFocused(false);
            handleSend();
          }}
          className="bg-transparent text-white hover:bg-transparent hover:text-neutral-700"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default TextInput;
