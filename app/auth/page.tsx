"use client";

import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/logo";
import { useSignIn, useSignUp, useUser } from "@clerk/nextjs";

import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";

function InputOTPPattern({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex justify-start w-full">
      <InputOTP
        className="w-full"
        maxLength={6}
        pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
        value={value}
        onChange={onChange}
      >
        <InputOTPGroup className=" w-full">
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>
    </div>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn, isLoaded: isSignInLoaded } = useSignIn();
  const { signUp, isLoaded: isSignUpLoaded } = useSignUp();
  const { isSignedIn } = useUser();
  const isLoaded = isSignInLoaded && isSignUpLoaded;
  const router = useRouter();

  // Set initial mode based on URL parameter and handle errors
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get("mode");
    const error = urlParams.get("error");

    if (mode === "signup") {
      setIsSignUpMode(true);
    } else if (mode === "signin") {
      setIsSignUpMode(false);
    }

    // Handle error messages from URL parameters
    if (error) {
      switch (error) {
        case "account_not_found":
          setError("Account not found. Please sign up instead.");

          break;
        case "account_already_exists":
          setError("Account already exists. Please sign in instead.");

          break;
        case "true":
          setError("Authentication failed. Please try again.");
          break;
        default:
          setError("An error occurred. Please try again.");
      }

      // Clear the error from URL
      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  // Redirect authenticated users to /whisper
  useEffect(() => {
    if (isSignedIn) {
      router.push("/whispers");
    }
  }, [isSignedIn, router]);

  // Don't render the form if user is authenticated
  if (isSignedIn) {
    return null;
  }

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError(null); // Clear any previous errors
    if (!isLoaded) return;

    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/auth?error=account_not_found",
        redirectUrlComplete: "/auth",
      });
    } catch (error: any) {
      console.error("Google sign in error:", error);
      setError(
        error?.message || "Failed to sign in with Google. Please try again."
      );
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    setError(null); // Clear any previous errors
    if (!isLoaded) return;

    try {
      await signUp.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/auth?error=account_already_exists",
        redirectUrlComplete: "/auth",
      });
    } catch (error: any) {
      console.error("Google sign up error:", error);
      setError(
        error?.message || "Failed to sign up with Google. Please try again."
      );
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || isEmailLoading) return;

    setError(null); // Clear any previous errors

    if (!isOtpSent) {
      // Send OTP
      setIsEmailLoading(true);
      try {
        if (isSignUpMode) {
          // Create sign-up attempt
          await signUp.create({
            emailAddress: email,
          });

          // Prepare email verification (this handles CAPTCHA)
          await signUp.prepareEmailAddressVerification();
          setIsOtpSent(true);
        } else {
          // Sign in attempt
          await signIn.create({
            identifier: email,
            strategy: "email_code",
          });
          setIsOtpSent(true);
        }
      } catch (error: any) {
        console.error("OTP send error:", error);
        if (isSignUpMode) {
          setError(
            error?.message || "Failed to create account. Please try again."
          );
        } else {
          setError(
            error?.message ||
              "Failed to send verification code. Please try again."
          );
        }
      } finally {
        setIsEmailLoading(false);
      }
    } else {
      // Verify OTP
      setIsEmailLoading(true);
      try {
        if (isSignUpMode) {
          // Verify OTP for sign up
          const result = await signUp.attemptEmailAddressVerification({
            code: otp,
          });
          if (result.status === "complete") {
            window.location.href = "/whispers";
          }
        } else {
          // Verify OTP for sign in
          const result = await signIn.attemptFirstFactor({
            strategy: "email_code",
            code: otp,
          });
          if (result.status === "complete") {
            window.location.href = "/whispers";
          }
        }
      } catch (error: any) {
        console.error("OTP verification error:", error);
        setError(
          error?.message || "Invalid verification code. Please try again."
        );
      } finally {
        setIsEmailLoading(false);
      }
    }
  };
  return (
    <div className="min-h-screen flex flex-col lg:flex-row relative">
      {/* Left Column - Login Form */}
      <div className="flex-1 bg-white flex items-center justify-center p-4 sm:p-6 lg:p-8 ">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <div className="absolute top-3 left-4 sm:top-5 sm:left-8 opacity-30 z-10">
              <Logo />
            </div>
            <img
              src="https://us-east-1.tixte.net/uploads/tanmay111-files.tixte.co/WhatsApp_Image_2025-08-15_at_01.46.49.jpeg"
              className="min-w-5 min-h-5 -mb-7 -ml-3 size-24 sm:size-32 mix-blend-multiply"
            />
          </div>

          {/* Welcome Section */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {isSignUpMode ? "Get Started" : "Welcome Back"}
            </h1>
            <p className="text-sm sm:text-base text-gray-500">
              {isSignUpMode
                ? "Join Phantom Pen to start capturing your memories"
                : "Welcome to Phantom Pen - Login to view your memories"}
            </p>
          </div>

          {/* Google Authentication Buttons */}
          <div className="space-y-3 mb-4">
            {isSignUpMode ? (
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 sm:h-10"
                onClick={handleGoogleSignUp}
                disabled={!isLoaded || isGoogleLoading}
              >
                {isGoogleLoading ? (
                  <div className="flex items-center justify-center">
                    <span className="text-sm sm:text-base">
                      Creating account...
                    </span>
                  </div>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5 mr-2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span className="text-sm sm:text-base">
                      Sign up with Google
                    </span>
                  </>
                )}
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 sm:h-10"
                onClick={handleGoogleSignIn}
                disabled={!isLoaded || isGoogleLoading}
              >
                {isGoogleLoading ? (
                  <div className="flex items-center justify-center">
                    <span className="text-sm sm:text-base">Signing in...</span>
                  </div>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5 mr-2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span className="text-sm sm:text-base">
                      Sign in with Google
                    </span>
                  </>
                )}
              </Button>
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500 -mb-3">or</span>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {!isOtpSent && (
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email
                </label>
                <Input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null); // Clear errors when user types
                  }}
                  placeholder="hi@phantompen.com"
                  className="w-full h-11 sm:h-10"
                  required
                />
              </div>
            )}

            {isOtpSent && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter OTP
                </label>
                <InputOTPPattern
                  value={otp}
                  onChange={(value) => {
                    setOtp(value);
                    setError(null); // Clear errors when user types
                  }}
                />
                <p className="text-xs flex items-center gap-1 text-gray-500 mt-2">
                  Enter the verification code sent to {email}
                  <Pencil onClick={() => setIsOtpSent(false)} size={11} />
                </p>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 sm:h-10"
              disabled={!isLoaded || isEmailLoading}
            >
              {!isLoaded
                ? "Loading..."
                : isEmailLoading
                ? "Processing..."
                : isOtpSent
                ? "Verify"
                : isSignUpMode
                ? "Sign Up"
                : "Sign In"}
            </Button>

            {/* Toggle between sign in and sign up */}
            <div className="text-center">
              <p className="text-sm">
                {isSignUpMode ? (
                  <>
                    <span>Already have an account? </span>
                    <button
                      type="button"
                      className="text-primary underline cursor-pointer"
                      onClick={() => {
                        setIsSignUpMode(false);
                        setIsOtpSent(false);
                        setOtp("");
                        setEmail("");
                        setError(null);

                        // Update URL parameter
                        const url = new URL(window.location.href);
                        url.searchParams.set("mode", "signin");
                        window.history.replaceState({}, "", url.toString());
                      }}
                    >
                      Sign in
                    </button>
                  </>
                ) : (
                  <>
                    <span>Don't have an account? </span>
                    <button
                      type="button"
                      className="text-primary underline cursor-pointer"
                      onClick={() => {
                        setIsSignUpMode(true);
                        setIsOtpSent(false);
                        setOtp("");
                        setEmail("");
                        setError(null);

                        // Update URL parameter
                        const url = new URL(window.location.href);
                        url.searchParams.set("mode", "signup");
                        window.history.replaceState({}, "", url.toString());
                      }}
                    >
                      Sign up
                    </button>
                  </>
                )}
              </p>
            </div>

            {/* CAPTCHA element for Clerk */}
            <div id="clerk-captcha"></div>
          </form>
        </div>
      </div>

      {/* Right Column - Promotional Content */}
      <div className="flex-1 hidden lg:block bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 relative overflow-hidden m-2 sm:m-4 rounded-xl bg-[url('/Background.jpeg')] bg-cover bg-center order-1 lg:order-2 min-h-[200px] sm:min-h-[300px] lg:min-h-0"></div>
    </div>
  );
}
