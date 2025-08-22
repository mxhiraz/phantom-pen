"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { VoiceTextarea } from "@/components/VoiceTextarea";
import {
  useOnboarding,
  OnboardingData,
} from "@/components/hooks/useOnboarding";
import { toast } from "sonner";

interface OnboardingFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OnboardingFlow({ open, onOpenChange }: OnboardingFlowProps) {
  const { submitOnboarding, finishOnboarding } = useOnboarding();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Partial<OnboardingData>>({});

  const steps = [
    {
      title: "Welcome to Phantom Pen!",
      description: "Let's get to know you and your story better.",
      component: "opener",
    },
    {
      title: "Your Story's Impact",
      description: "What do you want readers to take away?",
      component: "feelingIntent",
    },
    {
      title: "Your Voice Style",
      description: "How do you naturally tell stories?",
      component: "voiceStyle",
    },
    {
      title: "Writing Preferences",
      description: "What's your preferred writing style?",
      component: "writingStyle",
    },
    {
      title: "Candor Level",
      description: "How open would you like to be?",
      component: "candorLevel",
    },
    {
      title: "Humor in Your Stories",
      description: "How does humor fit into your narrative?",
      component: "humorStyle",
    },
  ];

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

  const renderStep = () => {
    const step = steps[currentStep];

    switch (step.component) {
      case "opener":
        return (
          <div className="space-y-4">
            <Label htmlFor="opener" className="text-lg font-medium">
              Thanks for trusting me with your story. What brings you to this
              memoir, and who do you hope will read it?
            </Label>
            <VoiceTextarea
              id="opener"
              placeholder="Share your motivation and intended audience..."
              value={formData.opener || ""}
              onChange={(e) => handleInputChange("opener", e.target.value)}
              rows={10}
            />
          </div>
        );

      case "feelingIntent":
        return (
          <div className="space-y-4">
            <Label htmlFor="feelingIntent" className="text-lg font-medium">
              When someone finishes your story, what do you want them to feel or
              understand most?
            </Label>
            <VoiceTextarea
              id="feelingIntent"
              placeholder="Describe the emotional impact you hope to create..."
              value={formData.feelingIntent || ""}
              onChange={(e) =>
                handleInputChange("feelingIntent", e.target.value)
              }
              rows={6}
            />
          </div>
        );

      case "voiceStyle":
        return (
          <div className="space-y-4">
            <Label className="text-lg font-medium">
              When you tell stories, do you like to drop me right into the
              scene, or reflect on what it meant and why?
            </Label>
            <Select
              value={formData.voiceStyle || ""}
              onValueChange={(value) => handleInputChange("voiceStyle", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your preference" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scene-focused">
                  Drop me right into the scene
                </SelectItem>
                <SelectItem value="reflection-focused">
                  Reflect on meaning and why
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        );

      case "writingStyle":
        return (
          <div className="space-y-4">
            <Label className="text-lg font-medium">
              Do you prefer clean, simple lines, or something a bit more musical
              and descriptive?
            </Label>
            <Select
              value={formData.writingStyle || ""}
              onValueChange={(value) =>
                handleInputChange("writingStyle", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your preference" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="clean-simple">
                  Clean, simple lines
                </SelectItem>
                <SelectItem value="musical-descriptive">
                  Musical and descriptive
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        );

      case "candorLevel":
        return (
          <div className="space-y-4">
            <Label className="text-lg font-medium">
              Are you comfortable being fully candid, or would you rather soften
              some details or change names?
            </Label>
            <Select
              value={formData.candorLevel || ""}
              onValueChange={(value) => handleInputChange("candorLevel", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your preference" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fully-candid">Fully candid</SelectItem>
                <SelectItem value="softened-details">
                  Soften some details
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        );

      case "humorStyle":
        return (
          <div className="space-y-4">
            <Label className="text-lg font-medium">
              And when it comes to humor, is it part of how you naturally tell
              stories? Should it appear lightly and in the right moments, or
              should it stay in the background unless it really fits?
            </Label>
            <Select
              value={formData.humorStyle || ""}
              onValueChange={(value) => handleInputChange("humorStyle", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your preference" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="natural-humor">
                  Natural humor in the right moments
                </SelectItem>
                <SelectItem value="background-humor">
                  Stay in the background unless it fits
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    const step = steps[currentStep];

    switch (step.component) {
      case "opener":
        return formData.opener && formData.opener.trim().length > 0;
      case "feelingIntent":
        return (
          formData.feelingIntent && formData.feelingIntent.trim().length > 0
        );
      case "voiceStyle":
        return formData.voiceStyle;
      case "writingStyle":
        return formData.writingStyle;
      case "candorLevel":
        return formData.candorLevel;
      case "humorStyle":
        return formData.humorStyle;
      default:
        return false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className=" overflow-y-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            {steps[currentStep].title}
          </DialogTitle>
          <DialogDescription className="text-lg text-gray-600">
            {steps[currentStep].description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {renderStep()}

          <div className="flex justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              Back
            </Button>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                {currentStep + 1} of {steps.length}
              </span>
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="min-w-[100px]"
              >
                {currentStep === steps.length - 1 ? "Complete" : "Next"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
