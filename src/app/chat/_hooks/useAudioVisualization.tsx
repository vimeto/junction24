import { useState, useRef } from "react";

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

export default useAudioVisualization;
