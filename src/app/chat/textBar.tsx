import React from "react";
import { Textarea } from "~/components/ui/textarea";
import { Button } from "~/components/ui/button";
import { Mic, Send, Camera } from "lucide-react"; // Replace with the actual Send icon component

interface TextInputProps {
  inputText: string;
  setInputText: React.Dispatch<React.SetStateAction<string>>;
  handleSend: () => void;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
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
  textareaRef,
  isListening,
  isMuted,
  toggleMute,
  setIsListening,
}) => {
  return (
    <div className="bg-dark-700 flex w-full items-center border-none">
      <Button
        size="icon"
        className="bg-transparent text-white hover:bg-transparent hover:text-neutral-700"
      >
        <Camera className="h-5 w-5" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={() => {
          toggleMute();
          setIsListening(true);
        }}
        className="border-none bg-transparent p-0 text-white hover:bg-transparent hover:text-neutral-700"
      >
        <Mic className="h-5 w-5" />
      </Button>
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
        className="h-5 flex-1 border-none bg-transparent placeholder-neutral-500"
        rows={1}
        style={{ height: "auto", overflowY: "hidden" }}
      />

      <Button
        onClick={handleSend}
        className="border-none bg-transparent px-2 text-white hover:bg-transparent hover:text-neutral-700"
      >
        <Send className="h-5 w-5" />
      </Button>
    </div>
  );
};

export default TextInput;
