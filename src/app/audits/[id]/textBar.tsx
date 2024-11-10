import React, { useState, useEffect, useRef } from "react";
import { Textarea } from "~/components/ui/textarea";
import { Button } from "~/components/ui/button";
import { Mic, Send, Camera, X } from "lucide-react"; // Replace with actual icons
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
  showCamera: boolean;
  setShowCamera: React.Dispatch<React.SetStateAction<boolean>>;
  isLoading: boolean;
}

const TextInput: React.FC<TextInputProps> = ({
  inputText,
  setInputText,
  handleSend,
  handleInputChange,
  isListening,
  toggleMute,
  setIsListening,
  showCamera,
  setShowCamera,
  isLoading,
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
      {(isFocused || inputText.length != 0) && (
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
          size="icon"
          onClick={() => {
            toggleMute();
            setIsListening(!isListening);
          }}
          className="bg-transparent text-white hover:bg-transparent hover:text-neutral-700"
        >
          <Mic className="h-4 w-4" />
        </Button>
        {!isFocused && inputText.length == 0 ? (
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
          disabled={isLoading || !inputText.trim()}
          className={`bg-transparent text-white transition-opacity duration-200
            ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-transparent hover:text-neutral-700'}`}
        >
          <Send className={`h-4 w-4 ${isLoading ? 'animate-pulse' : ''}`} />
        </Button>
      </div>
    </div>
  );
};

export default TextInput;
