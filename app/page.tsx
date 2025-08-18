"use client";

import { LandingPage } from "@/components/landing-page";

export interface Transcription {
  id: string;
  title: string;
  content: string;
  preview: string;
  timestamp: number;
  duration?: string;
}

export default function Home() {
  return <LandingPage />;
}
