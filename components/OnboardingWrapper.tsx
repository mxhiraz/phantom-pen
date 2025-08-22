"use client";

import { useState, useEffect } from "react";
import { useOnboarding } from "@/components/hooks/useOnboarding";
import { OnboardingFlow } from "@/components/OnboardingFlow";

interface OnboardingWrapperProps {
  children: React.ReactNode;
}

export function OnboardingWrapper({ children }: OnboardingWrapperProps) {
  const { isOnboardingComplete, isLoading } = useOnboarding();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (isOnboardingComplete === false) {
        setShowOnboarding(true);
      } else if (isOnboardingComplete === true) {
        setShowOnboarding(false);
      }
    }
  }, [isLoading, isOnboardingComplete]);

  return (
    <>
      {children}
      <OnboardingFlow
        open={showOnboarding}
        onOpenChange={(open) => {
          // Only allow closing if onboarding is complete
          if (!open && isOnboardingComplete === false) {
            return; // Prevent closing
          }
          setShowOnboarding(open);
        }}
      />
    </>
  );
}
