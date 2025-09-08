"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { VoiceTextarea } from "@/components/VoiceTextarea";
import {
  useOnboarding,
  OnboardingData,
} from "@/components/hooks/useOnboarding";
import { toast } from "sonner";
import { Volume2 } from "lucide-react";

interface OnboardingFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OnboardingFlow({ open, onOpenChange }: OnboardingFlowProps) {
  const { submitOnboarding, finishOnboarding } = useOnboarding();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Partial<OnboardingData>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopAudio = () => {
    const audio = audioRef.current;
    if (audio) {
      try {
        audio.pause();
      } catch {}
      audio.currentTime = 0;
      // Clearing src helps some browsers release the stream immediately
      // but keep it set so we can replay without reassigning unless needed.
    }
  };

  const steps = [
    {
      title: "Welcome to Phantom Pen!",
      description:
        "Hi, I'm Phantom the Ghostwriter - I'm looking forward to working with you on writing your memoirs! First, can you tell me your name, where you were born, and when that was?",
      field: "question1",
      audioFile:
        "/audio/ElevenLabs_2025-08-29T14_21_33_Mark - Natural Conversations_pvc_sp94_s37_sb75_se0_b_m2.mp3",
    },
    {
      title: "Tell me about yourself",
      description:
        "Great, thanks so much! Now, please tell me a little bit more about yourself. I want to get a feel for your voice, so feel free to speak as little or as much as you'd like -- whatever feels natural.",
      field: "question2",
      audioFile:
        "/audio/ElevenLabs_2025-08-29T14_21_51_Mark - Natural Conversations_pvc_sp94_s37_sb75_se0_b_m2.mp3",
    },
    {
      title: "Your loved ones",
      description:
        "Awesome! I think I'm getting a good grasp of who you are and where you come from. Can you tell me about your loved ones? Who are they? What are they like? What do they mean to you?",
      field: "question3",
      audioFile:
        "/audio/ElevenLabs_2025-08-29T14_22_04_Mark - Natural Conversations_pvc_sp94_s37_sb75_se0_b_m2.mp3",
    },
    {
      title: "Your interests and career",
      description:
        "Lastly, could you share some of your personal and professional interests? Are there any career moments that stand out to you right away? Don’t worry about recalling every important story right now—this is just to help me get a better understanding of you and your life.",
      field: "question4",
      audioFile:
        "/audio/ElevenLabs_2025-08-31T16_56_44_Mark - Natural Conversations_pvc_sp94_s37_sb75_se0_b_m2.mp3",
    },
  ];

  const playAudio = (audioFile: string) => {
    if (audioRef.current) {
      audioRef.current.src = audioFile;
      audioRef.current.play().catch((error) => {
        console.error("Error playing audio:", error);
      });
    }
  };

  const handleInputChange = (field: keyof OnboardingData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = async () => {
    if (currentStep === steps.length - 1) {
      // Final step - complete onboarding
      try {
        await submitOnboarding(formData as OnboardingData);
        await finishOnboarding();
        onOpenChange(false);
      } catch (error) {
        toast.error("Failed to complete onboarding");
      }
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  // Auto-play audio when step changes
  useEffect(() => {
    if (open && steps[currentStep]?.audioFile) {
      playAudio(steps[currentStep].audioFile);
    }
  }, [currentStep, open]);

  // Stop audio when dialog closes and on unmount
  useEffect(() => {
    if (!open) {
      stopAudio();
    }
    return () => {
      stopAudio();
    };
  }, [open]);

  const renderStep = () => {
    const step = steps[currentStep];
    const currentValue = formData[step.field as keyof OnboardingData] || "";

    return (
      <div className="space-y-4">
        <div className="space-y-3">
          <Label htmlFor={step.field} className="text-base font-medium block">
            {step.description}
          </Label>
          <div className="flex justify-start">
            <Button
              variant="outline"
              size="sm"
              onClick={() => playAudio(step.audioFile)}
              className="flex items-center gap-2"
            >
              <Volume2 className="h-4 w-4" />
              <span className=" sm:inline">Listen again?</span>
            </Button>
          </div>
        </div>
        <VoiceTextarea
          id={step.field}
          placeholder="Share your thoughts..."
          value={currentValue}
          onChange={(e) =>
            handleInputChange(
              step.field as keyof OnboardingData,
              e.target.value
            )
          }
          rows={8}
        />
      </div>
    );
  };

  const currentStepData = steps[currentStep];
  const canProceed =
    formData[currentStepData.field as keyof OnboardingData]?.trim();

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      stopAudio();
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent
        showCloseButton={false}
        className=" max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-start">
            {currentStepData.title}
          </DialogTitle>
          <DialogDescription className="text-start text-sm">
            Step {currentStep + 1} of {steps.length}
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 pt-0">{renderStep()}</div>

        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            Back
          </Button>

          <div className="flex gap-2">
            {currentStep < steps.length - 1 ? (
              <Button onClick={handleNext} disabled={!canProceed}>
                Next
              </Button>
            ) : (
              <Button onClick={handleNext} disabled={!canProceed}>
                Continue
              </Button>
            )}
          </div>
        </div>
      </DialogContent>

      {/* Hidden audio element */}
      <audio ref={audioRef} preload="auto" />
    </Dialog>
  );
}
