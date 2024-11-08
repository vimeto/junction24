import React, { useState, useEffect } from "react";
import { Button } from "~/components/ui/button"; // Adjust import paths as needed
import { Camera, Mic, MicOff, Keyboard } from "lucide-react"; // Replace with actual icons

interface AudioVisualizerProps {
  isListening: boolean;
  isMuted: boolean;
  visualizationData: number[];
  toggleMute: () => void;
  setIsListening: (isListening: boolean) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isListening,
  isMuted,
  visualizationData,
  toggleMute,
  setIsListening,
  fileInputRef,
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;

    if (isListening && !isMuted) {
      timer = setInterval(() => {
        setElapsedTime((prevTime) => prevTime + 1);
      }, 1000);
    } else {
      if (timer) clearInterval(timer);
    }

    return () => clearInterval(timer);
  }, [isListening, isMuted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="from-dark-700 to-dark-900 flex min-h-10 w-full items-center rounded-md border border-neutral-600 bg-gradient-to-br">
      <Button
        size="icon"
        onClick={() => fileInputRef.current && fileInputRef.current.click()}
        className="bg-transparent text-white hover:bg-transparent hover:text-neutral-700"
      >
        <Camera className="h-5 w-5" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={() => {
          if (isMuted) {
            setElapsedTime(0);
          }
          toggleMute();
        }}
        className="border-none bg-transparent text-white hover:bg-transparent hover:text-neutral-700"
      >
        {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
      </Button>

      <div className="flex h-10 flex-1 items-center pl-4">
        <span className="mr-4 text-white">{formatTime(elapsedTime)}</span>
        {visualizationData.map((value, index) => (
          <div
            key={index}
            className="mx-px max-h-10 w-0.5 bg-neutral-400"
            style={{ height: `${value * 0.5}%` }}
          ></div>
        ))}
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={() => {
          setIsListening(false);
          if (!isMuted) toggleMute();
        }}
        className="absolute right-3 border-none bg-transparent p-0 text-white hover:bg-transparent hover:text-neutral-700"
      >
        <Keyboard className="h-5 w-5" />
      </Button>
    </div>
  );
};

export default AudioVisualizer;
