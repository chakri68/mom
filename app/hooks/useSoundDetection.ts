import { useState, useEffect, useRef } from "react";

export interface UseSoundDetectionOptions {
  /** Minimum RMS threshold to consider a blow */
  threshold?: number;
  /** Smoothing factor for RMS (0 = no smoothing, 1 = full inertia) */
  smoothingFactor?: number;
  /** Cooldown in ms before detecting another blow */
  cooldownPeriod?: number;
  /** Whether detection is active */
  enabled?: boolean;
}

export interface UseSoundDetectionReturn {
  /** Smoothed strength of detected blow (0 to 1) */
  blowStrength: number;
  /** Whether a blow event is currently active */
  isBlowing: boolean;
  /** Start microphone listening (user gesture required) */
  startListening: () => Promise<void>;
  /** Stop listening and cleanup */
  stopListening: () => void;
}

export function useSoundDetection({
  threshold = 0.15,
  smoothingFactor = 0.7,
  cooldownPeriod = 1000,
  enabled = true,
}: UseSoundDetectionOptions = {}): UseSoundDetectionReturn {
  const [blowStrength, setBlowStrength] = useState(0);
  const [isBlowing, setIsBlowing] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const lastBlowTsRef = useRef<number>(0);

  const detectBlow = () => {
    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;
    const ctx = audioContextRef.current;
    if (!analyser || !dataArray || !ctx) return;

    // Resume if suspended (Chrome autoplay policy)
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    analyser.getByteTimeDomainData(dataArray);
    // Compute RMS
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const v = (dataArray[i] - 128) / 128; // normalize to [-1,1]
      sum += v * v;
    }
    const rms = Math.sqrt(sum / dataArray.length);
    // Smooth the strength
    const smooth = blowStrength * smoothingFactor + rms * (1 - smoothingFactor);
    setBlowStrength(smooth);

    const now = Date.now();
    if (
      smooth > threshold &&
      !isBlowing &&
      now - lastBlowTsRef.current > cooldownPeriod
    ) {
      setIsBlowing(true);
      lastBlowTsRef.current = now;
    } else if (smooth < threshold && isBlowing) {
      setIsBlowing(false);
    }

    animationIdRef.current = requestAnimationFrame(detectBlow);
  };

  const startListening = async () => {
    if (!enabled || audioContextRef.current) return;
    if (typeof window === "undefined") return;

    // @ts-expect-error AudioContext exists in browsers
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    audioContextRef.current = ctx;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = ctx.createMediaStreamSource(stream);

      // --- LOW PASS FILTER SETUP ---
      const lowPassFilter = ctx.createBiquadFilter();
      lowPassFilter.type = "lowpass";
      lowPassFilter.frequency.value = 1000; // Let through low freqs (e.g., breath), cut higher ones
      lowPassFilter.Q.value = 1; // Default is fine for basic cutoff

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;

      // Connect: source → low-pass filter → analyser
      source.connect(lowPassFilter);
      lowPassFilter.connect(analyser);

      analyserRef.current = analyser;
      dataArrayRef.current = new Uint8Array(analyser.fftSize);

      detectBlow();
    } catch (err) {
      console.error("Failed to start audio detection", err);
    }
  };

  const stopListening = () => {
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    audioContextRef.current = null;
    analyserRef.current = null;
    dataArrayRef.current = null;
    animationIdRef.current = null;
    setBlowStrength(0);
    setIsBlowing(false);
  };

  // Cleanup on unmount or when disabled
  useEffect(() => {
    if (!enabled) stopListening();
    return () => stopListening();
  }, [enabled]);

  return { blowStrength, isBlowing, startListening, stopListening };
}
