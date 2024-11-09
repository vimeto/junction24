import { useState, useRef, useEffect } from "react";

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

export default useSpeechRecognition;
