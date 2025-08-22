"use client";

import { Textarea } from "@/components/ui/textarea";
import { VoiceInputButton } from "@/components/VoiceInputButton";
import { cn } from "@/lib/utils";

interface VoiceTextareaProps {
  id?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  className?: string;
  rows?: number;
}

export function VoiceTextarea({
  id,
  placeholder,
  value,
  onChange,
  className,
  rows = 4,
}: VoiceTextareaProps) {
  const handleVoiceTranscription = (transcript: string) => {
    // Append to existing text or replace if empty
    const newValue = value.trim() ? `${value} ${transcript}` : transcript;

    // Create a synthetic event to maintain compatibility with existing onChange handlers
    const syntheticEvent = {
      target: { value: newValue },
    } as React.ChangeEvent<HTMLTextAreaElement>;

    onChange(syntheticEvent);
  };

  return (
    <div className="relative">
      <Textarea
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={cn("pr-12 min-h-32 resize-none", className)}
        rows={rows}
      />
      <div className="absolute bottom-2 right-2">
        <VoiceInputButton
          onTranscription={handleVoiceTranscription}
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
        />
      </div>
    </div>
  );
}
