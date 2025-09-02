"use client";

import React, { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { VoiceInputButtonWithWave } from "@/components/VoiceInputButtonWithWave";
import { AudioWaveform } from "@/components/AudioWaveform";
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
  const [isRecording, setIsRecording] = useState(false);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);

  const handleVoiceTranscription = (transcript: string) => {
    const newValue = value.trim() ? `${value} ${transcript}` : transcript;

    const syntheticEvent = {
      target: { value: newValue },
    } as React.ChangeEvent<HTMLTextAreaElement>;

    onChange(syntheticEvent);
  };

  const handleRecordingStateChange = (
    recording: boolean,
    analyser: AnalyserNode | null
  ) => {
    setIsRecording(recording);
    setAnalyserNode(analyser);
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

      <div className="absolute bottom-2 right-2 flex gap-2">
        {isRecording && analyserNode && (
          <AudioWaveform
            className=" mt-0 h-0"
            analyserNode={analyserNode}
            isPaused={false}
          />
        )}

        <VoiceInputButtonWithWave
          onTranscription={handleVoiceTranscription}
          onRecordingStateChange={handleRecordingStateChange}
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
        />
      </div>
    </div>
  );
}
