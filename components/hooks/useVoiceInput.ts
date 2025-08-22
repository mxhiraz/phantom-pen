"use client";

import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";

interface UseVoiceInputProps {
  onTranscriptionComplete: (text: string) => void;
  language?: string;
}

export function useVoiceInput({
  onTranscriptionComplete,
  language = "en-US",
}: UseVoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const startRecording = useCallback(() => {
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      toast.error("Speech recognition is not supported in this browser");
      return;
    }

    try {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsRecording(true);
        setIsProcessing(false);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setIsProcessing(true);
        onTranscriptionComplete(transcript);
        setIsRecording(false);
        setIsProcessing(false);
      };

      recognition.onerror = (event) => {
        setIsRecording(false);
        setIsProcessing(false);
        console.error("Speech recognition error:", event.error);

        switch (event.error) {
          case "no-speech":
            toast.error("No speech detected. Please try again.");
            break;
          case "audio-capture":
            toast.error("Microphone access denied or not available.");
            break;
          case "not-allowed":
            toast.error(
              "Microphone permission denied. Please allow microphone access."
            );
            break;
          case "network":
            toast.error("Network error occurred during speech recognition.");
            break;
          default:
            toast.error("Speech recognition failed. Please try again.");
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
        if (isProcessing) {
          setIsProcessing(false);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (error) {
      console.error("Error starting speech recognition:", error);
      toast.error("Failed to start voice recording");
      setIsRecording(false);
      setIsProcessing(false);
    }
  }, [onTranscriptionComplete, language]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  return {
    isRecording,
    isProcessing,
    startRecording,
    stopRecording,
    toggleRecording,
  };
}

// Global type declarations for Speech Recognition API
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult:
    | ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any)
    | null;
  onerror:
    | ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any)
    | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}
