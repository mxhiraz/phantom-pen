"use client";

import React from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVoiceInputWithWave } from "@/components/hooks/useVoiceInputWithWave";
import { cn } from "@/lib/utils";

interface VoiceInputButtonWithWaveProps {
  onTranscription: (text: string) => void;
  className?: string;
  size?: "sm" | "lg";
  variant?: "default" | "outline" | "ghost";
  onRecordingStateChange?: (
    isRecording: boolean,
    analyserNode: AnalyserNode | null
  ) => void;
}

export function VoiceInputButtonWithWave({
  onTranscription,
  className,
  size = "sm",
  variant = "outline",
  onRecordingStateChange,
}: VoiceInputButtonWithWaveProps) {
  const { isRecording, isProcessing, analyserNode, toggleRecording } =
    useVoiceInputWithWave({
      onTranscriptionComplete: onTranscription,
    });

  React.useEffect(() => {
    if (onRecordingStateChange) {
      onRecordingStateChange(isRecording, analyserNode);
    }
  }, [isRecording, analyserNode, onRecordingStateChange]);

  const getIcon = () => {
    if (isProcessing) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    if (isRecording) {
      return <MicOff className="h-4 w-4" />;
    }
    return <Mic className="h-4 w-4" />;
  };

  const getTitle = () => {
    if (isProcessing) return "Processing...";
    if (isRecording) return "Stop recording";
    return "Start voice input";
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={toggleRecording}
      disabled={isProcessing}
      title={getTitle()}
      className={cn(
        "flex items-center justify-center",
        isRecording &&
          "bg-red-100 text-red-600 border-red-300 hover:bg-red-200",
        isProcessing && "opacity-75",
        className
      )}
    >
      {getIcon()}
      <span className="sr-only">{getTitle()}</span>
    </Button>
  );
}
