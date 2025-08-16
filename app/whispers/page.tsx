"use client";

import { useRouter } from "next/navigation";
import { Dashboard } from "@/components/dashboard";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect, useState } from "react";

export interface Transcription {
  id: string;
  title: string;
  content: string;
  preview: string;
  timestamp: string;
  duration?: string;
}

function Spinner() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "80vh",
      }}
    >
      <img
        src="/spinner.svg"
        alt="Loading..."
        className="w-8 h-8 animate-spin"
      />
    </div>
  );
}

// Separate component for the authenticated content
function AuthenticatedContent() {
  const transcriptions = useQuery(api.whispers.listWhispers);

  if (transcriptions === undefined) {
    return <Spinner />;
  }

  if (transcriptions === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Unable to load notes
        </h2>
        <p className="text-gray-600">
          Please try refreshing the page or contact support.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Refresh Page
        </button>
      </div>
    );
  }

  return <Dashboard transcriptions={transcriptions} />;
}

export default function WhispersPage() {
  const router = useRouter();
  const { user, isLoaded, isSignedIn } = useUser();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      setIsRedirecting(true);
      router.push("/");
    }
  }, [isSignedIn, isLoaded, router]);

  // Add a small delay to ensure auth token is properly set
  useEffect(() => {
    if (isSignedIn && isLoaded) {
      const timer = setTimeout(() => {
        setAuthReady(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isSignedIn, isLoaded]);

  // Show loading while Clerk is loading or while redirecting
  if (!isLoaded || isRedirecting || !authReady) {
    return <Spinner />;
  }

  // If not signed in after loading, show loading (will redirect)
  if (!isSignedIn) {
    return <Spinner />;
  }

  // Only render the authenticated content when auth is ready
  return <AuthenticatedContent />;
}
