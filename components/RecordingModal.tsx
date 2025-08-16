"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
// import { RecordingBasics } from "./RecordingBasics"; // Commented out - no longer needed

import { AudioWaveform } from "./AudioWaveform";
import { useAudioRecording } from "./hooks/useAudioRecording";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import {
  useMutation as useConvexMutation,
  useAction as useConvexAction,
} from "convex/react";
import { api } from "@/convex/_generated/api";

interface RecordingModalProps {
  onClose: () => void;
  title?: string;
  whisperId?: string; // Optional: if provided, add recording to existing whisper
}

// Extend the Window interface
declare global {
  interface Window {
    currentMediaRecorder: MediaRecorder | undefined;
    currentStream: MediaStream | undefined;
  }
}

export function RecordingModal({ onClose, whisperId }: RecordingModalProps) {
  // const [language, setLanguage] = useLocalStorage("language", "en"); // Commented out - language now auto-detected

  const {
    recording,
    paused,
    audioBlob,
    analyserNode,
    duration,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
  } = useAudioRecording();

  const router = useRouter();
  const generateUploadUrl = useConvexMutation(api.files.generateUploadUrl);
  const transcribeFromStorage = useConvexAction(
    api.transcribe.transcribeFromStorage
  );

  const [isProcessing, setIsProcessing] = useState<
    "idle" | "uploading" | "transcribing"
  >("idle");
  const [pendingSave, setPendingSave] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStartRecording = async () => {
    try {
      await startRecording();
    } catch (error) {
      if (error instanceof Error && error.name === "NotAllowedError") {
        toast.error(
          "Microphone permission denied. Please enable it in your browser settings to record audio."
        );
      } else {
        toast.error("Failed to start recording. Please try again.");
      }
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith("audio/")) {
      toast.error("Please select an audio file");
      return;
    }

    setIsProcessing("uploading");
    try {
      // Generate upload URL from Convex
      const uploadUrl = await generateUploadUrl();

      // Upload to Convex storage
      const response = await fetch(uploadUrl, {
        method: "POST",
        body: file,
      });

      if (!response.ok) {
        throw new Error("Failed to upload file");
      }

      const { storageId } = await response.json();

      setIsProcessing("transcribing");

      // Use Convex backend for transcription
      const result = await transcribeFromStorage({
        storageId: storageId as any,
        whisperId: whisperId as any,
        durationSeconds: 0, // We don't know duration for uploaded files
      });

      if (whisperId) {
        onClose();
      } else {
        // If creating new whisper, redirect to whisper page
        router.push(`/whispers/${result.id}`);
      }
    } catch (err) {
      toast.error("Failed to transcribe audio file. Please try again.");
      setIsProcessing("idle");
    }
  };

  const handleSaveRecording = async () => {
    if (!audioBlob) {
      toast.error("No audio to save. Please record something first.");
      return;
    }
    setIsProcessing("uploading");
    try {
      // Generate upload URL from Convex
      const uploadUrl = await generateUploadUrl();

      // Create file and upload to Convex storage
      const file = new File([audioBlob], `recording-${Date.now()}.webm`, {
        type: "audio/webm",
      });

      // Upload to Convex storage
      const response = await fetch(uploadUrl, {
        method: "POST",
        body: file,
      });

      if (!response.ok) {
        throw new Error("Failed to upload file");
      }

      const { storageId } = await response.json();

      setIsProcessing("transcribing");

      // Use Convex backend for transcription
      const result = await transcribeFromStorage({
        storageId: storageId as any,
        whisperId: whisperId as any,
        durationSeconds: duration,
      });

      if (whisperId) {
        onClose();
      } else {
        // If creating new whisper, redirect to whisper page
        router.push(`/whispers/${result.id}`);
      }
    } catch (err) {
      toast.error("Failed to transcribe audio. Please try again.");
      setIsProcessing("idle");
    }
  };

  // Wait for audioBlob to be set after stopping before saving
  useEffect(() => {
    if (pendingSave && audioBlob) {
      setPendingSave(false);
      handleSaveRecording();
    }
  }, [pendingSave, audioBlob]);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent
        showCloseButton={false}
        className="!max-w-[352px] !p-0 border border-gray-200 rounded-tl-xl rounded-tr-xl  overflow-hidden gap-0"
      >
        <DialogHeader className="p-0">
          <DialogTitle className="sr-only">Recording Modal</DialogTitle>
        </DialogHeader>

        {isProcessing !== "idle" ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 p-4">
            <img
              src="/loading.svg"
              alt="Loading"
              className="w-8 h-8 animate-spin"
            />
            <p className="text-gray-500">
              {isProcessing === "uploading"
                ? "Uploading audio recording"
                : "Transcribing audio..."}
              <span className="animate-pulse">...</span>
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center w-full">
            {!recording ? (
              <>
                {/* Language auto-detection message */}
                <div className="w-full flex flex-col px-5 py-6 border-b border-gray-200">
                  <div className="text-center">
                    <p className="text-base text-gray-600">
                      Language will be automatically detected from your speech
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-row gap-8 mt-8">
                {/* X Button: Reset recording */}
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-6 bg-[#FFEEEE] p-2.5 rounded-xl"
                  onClick={resetRecording}
                  aria-label="Reset voice note"
                >
                  <img src="/X.svg" className="size-5 min-w-5" />
                </Button>

                <div className="flex flex-col gap-1">
                  <p className="text-base text-center  text-[#364153]">
                    {formatTime(duration)}
                  </p>
                  <AudioWaveform
                    analyserNode={analyserNode}
                    isPaused={paused}
                  />
                </div>

                {/* Pause/Resume Button */}
                {paused ? (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-6  bg-[#364153] p-2.5 rounded-xl"
                    onClick={resumeRecording}
                    aria-label="Resume speaking"
                  >
                    <img src="/microphone.svg" className="size-5 min-w-5" />
                  </Button>
                ) : (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-6 bg-[#364153] p-2.5 rounded-xl"
                    onClick={pauseRecording}
                    aria-label="Pause speaking"
                  >
                    <img src="/pause.svg" className="size-5 min-w-5" />
                  </Button>
                )}
              </div>
            )}

            <Button
              size="sm"
              className={cn(
                recording ? "bg-[#5d146d]" : "",
                "w-[300px] h-[70px] rounded-xl flex flex-row gap-3 items-center justify-center my-5"
              )}
              onClick={async () => {
                if (recording) {
                  stopRecording();
                  setPendingSave(true);
                } else {
                  await handleStartRecording();
                }
              }}
              disabled={isProcessing !== "idle"}
            >
              {recording ? (
                <>
                  <img
                    src="/stop.svg"
                    className="min-w-7 min-h-7 size-7 text-white"
                  />
                  <p>Stop Speaking</p>
                </>
              ) : (
                <img
                  src="/microphone.svg"
                  className="min-w-9 min-h-9 size-9 text-white"
                />
              )}
            </Button>

            {/* File Upload Section - Now below recording */}
            <div className="w-full flex flex-col px-5 py-4 border-t border-gray-200">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-3">
                  Or upload an audio file
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-10 border-dashed border-2 border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100"
                >
                  <img src="/upload.svg" className="w-4 h-4 mr-2" />
                  Choose Audio File
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileUpload(file);
                    }
                  }}
                  className="hidden"
                />
              </div>
            </div>

            {/* No Save button, processing is automatic */}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
