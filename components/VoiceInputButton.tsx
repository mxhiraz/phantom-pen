"use client";

import { Mic, MicOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVoiceInput } from "@/components/hooks/useVoiceInput";
import { cn } from "@/lib/utils";

interface VoiceInputButtonProps {
  onTranscription: (text: string) => void;
  className?: string;
  size?: "sm" | "lg";
  variant?: "default" | "outline" | "ghost";
}

export function VoiceInputButton({
  onTranscription,
  className,
  size = "sm",
  variant = "outline",
}: VoiceInputButtonProps) {
  const { isRecording, isProcessing, toggleRecording } = useVoiceInput({
    onTranscriptionComplete: onTranscription,
  });

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
