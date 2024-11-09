import { useState, useRef, useEffect } from "react";

const useAudioVisualization = () => {
  const [visualizationData, setVisualizationData] = useState<number[]>(
    Array(50).fill(1), // Default visualization to constant 1 when muted
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

      setIsMuted(false); // Mark mic as unmuted
    } catch (err) {
      console.error("Error accessing the microphone:", err);
    }
  };

  const stopVisualization = () => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    setIsMuted(true); // Mark mic as muted
  };

  const toggleMute = () => {
    if (isMuted) {
      startVisualization();
    } else {
      stopVisualization();
    }
  };

  useEffect(() => {
    const visualize = () => {
      if (isMuted) {
        // When muted, show a constant 1 across the visualization
        setVisualizationData(Array(44).fill(1));
      } else if (analyserRef.current && dataArrayRef.current) {
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);

        // Map the data array for visualization if mic is unmuted
        const newData = Array.from(dataArrayRef.current).map((value) =>
          value > 0 ? value : 0,
        );

        setVisualizationData(newData.slice(0, 44));
      }

      animationRef.current = requestAnimationFrame(visualize);
    };

    visualize();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isMuted]); // Rerun visualization logic if `isMuted` changes

  return {
    visualizationData,
    startVisualization,
    stopVisualization,
    toggleMute,
    isMuted,
  };
};

export default useAudioVisualization;
