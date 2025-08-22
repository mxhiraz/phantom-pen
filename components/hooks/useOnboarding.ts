import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useEffect } from "react";

export interface OnboardingData {
  opener: string;
  feelingIntent: string;
  voiceStyle: "scene-focused" | "reflection-focused";
  writingStyle: "clean-simple" | "musical-descriptive";
  candorLevel: "fully-candid" | "softened-details";
  humorStyle: "natural-humor" | "background-humor";
}

export function useOnboarding() {
  const { user, isLoaded } = useUser();
  const [isOnboardingComplete, setIsOnboardingComplete] = useState<
    boolean | null
  >(null);

  const userData = useQuery(
    api.users.getUser,
    user ? { clerkId: user.id } : "skip"
  );

  const createUser = useMutation(api.users.createUser);
  const updateOnboarding = useMutation(api.users.updateOnboarding);
  const completeOnboarding = useMutation(api.users.completeOnboarding);

  useEffect(() => {
    if (isLoaded && user && !userData) {
      // Create user if they don't exist
      createUser({
        clerkId: user.id,
        email: user.emailAddresses[0]?.emailAddress,
      });
    }
  }, [isLoaded, user, userData, createUser]);

  useEffect(() => {
    if (userData) {
      setIsOnboardingComplete(userData.onboardingCompleted);
    }
  }, [userData]);

  const submitOnboarding = async (data: OnboardingData) => {
    if (!user) return;

    try {
      await updateOnboarding({
        clerkId: user.id,
        ...data,
        onboardingCompleted: false,
      });
    } catch (error) {
      console.error("Error updating onboarding:", error);
      throw error;
    }
  };

  const finishOnboarding = async () => {
    if (!user) return;

    try {
      await completeOnboarding({ clerkId: user.id });
      setIsOnboardingComplete(true);
    } catch (error) {
      console.error("Error completing onboarding:", error);
      throw error;
    }
  };

  return {
    isOnboardingComplete,
    userData,
    submitOnboarding,
    finishOnboarding,
    isLoading: !isLoaded || isOnboardingComplete === null,
  };
}
