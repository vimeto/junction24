import React, { useState, useEffect } from "react";
import { Button } from "~/components/ui/button"; // Adjust import paths as needed
import { Camera, Mic, MicOff, Keyboard, X } from "lucide-react"; // Replace with actual icons
import CameraMenu from "./cameraMenu";
import { useUploadThing } from "~/utils/uploadthing";
import { toast } from "sonner";

interface AudioVisualizerProps {
  isListening: boolean;
  isMuted: boolean;
  visualizationData: number[];
  toggleMute: () => void;
  setIsListening: (isListening: boolean) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  showCamera: boolean;
  setShowCamera: React.Dispatch<React.SetStateAction<boolean>>;
  handleImageUpload: (imageUrl: string) => void;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isListening,
  isMuted,
  visualizationData,
  toggleMute,
  setIsListening,
  fileInputRef,
  showCamera,
  setShowCamera,
  handleImageUpload,
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showCameraMenu, setShowCameraMenu] = useState(false);

  const { startUpload } = useUploadThing("imageUploader", {
    onClientUploadComplete(result) {
      toast.dismiss("upload-begin");
      toast("Upload complete!");
      if (result && result[0]) {
        handleImageUpload(result[0].url);
      }
    },
    onUploadError(error) {
      toast.dismiss("upload-begin");
      toast.error("Upload failed");
    },
    onUploadBegin() {
      toast("Uploading...", {
        duration: 100000,
        id: "upload-begin",
      });
    },
  });

  const handleFileChange = async (file: File) => {
    if (file) {
      const result = await startUpload([file]);
      if (result && result[0]) {
        const imageUrl = result[0].url;
        handleImageUpload(imageUrl);
      }
    }
  };

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
    <div className="flex w-full items-center space-x-1 rounded-md">
      <div className="relative">
        <Button
          size="icon"
          onClick={() => setShowCameraMenu(!showCameraMenu)}
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
        {showCameraMenu && (
          <CameraMenu
            onTakePhoto={() => {
              setShowCamera(true);
              setShowCameraMenu(false);
            }}
            onDownloadPhoto={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*';
              input.onchange = async (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = async (event) => {
                    if (event.target?.result) {
                      setShowCamera(false);
                      setShowCameraMenu(false);
                      // Convert the file to base64 string
                      const base64String = event.target.result.toString();
                      // Create a File object from the base64 string
                      const newFile = new File([file], file.name, { type: file.type });
                      handleFileChange(newFile);
                    }
                  };
                  reader.readAsDataURL(file);
                }
              };
              input.click();
              setShowCameraMenu(false);
            }}
          />
        )}
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={() => {
          if (isMuted) {
            setElapsedTime(0);
          }
          toggleMute();
        }}
        className={`border-none bg-transparent ${
          isMuted
            ? "bg-red-500/10 text-red-500 hover:bg-red-500/20"
            : "text-white hover:bg-transparent hover:text-neutral-700"
        }`}
      >
        {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
      </Button>

      <div className="flex h-10 flex-1 items-center">
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
        className="border-none bg-transparent p-0 text-white hover:bg-transparent hover:text-neutral-700"
      >
        <Keyboard className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default AudioVisualizer;
