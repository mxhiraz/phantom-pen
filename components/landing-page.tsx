"use client";

import { Button } from "@/components/ui/button";
import { SignInButton, useUser } from "@clerk/nextjs";
import Link from "next/link";

export function LandingPage() {
  const { user } = useUser();

  // Shared CTA button
  const CTAButton = (
    <Button size="lg">
      <img src="/microphone.svg" className="size-5 min-w-5" />
      Start Note-Taking
    </Button>
  );

  return (
    <>
      {/* Main Content */}
      <main className="container mx-auto px-6 py-16 text-center">
        <div className="flex flex-col items-center">
          {/* <a
            href="https://console.groq.com/"
            rel="noopener noreferrer"
            target="_blank"
            className="w-[225px] h-[30px] relative rounded-[100px] bg-gradient-to-r from-neutral-100 to-white border border-gray-200 flex items-center justify-center gap-1 mb-6"
          >
            <span className="text-sm text-left text-[#4a5565]">
              Made & powered by{" "}
            </span>
            <img
              src="/togetherai.svg"
              className="min-w-[70px] min-h-[11px] mt-0.5"
            />
          </a> */}
          <h1 className="text-[40px] md:text-[60px] font-medium text-center text-[#101828] mb-6 leading-tight">
            Phantom Pen
            <br />
            AI-Powered Note-Taking
          </h1>
          <p className="text-base text-center text-[#4a5565] max-w-[323px] mx-auto mb-8">
            Transform your voice into organized text with Phantom Pen.
          </p>
          {user ? (
            <Link href="/whispers" className="w-[190px] h-[36px]">
              {CTAButton}
            </Link>
          ) : (
            <Link href="/signin">{CTAButton}</Link>
          )}

          <img
            src="https://us-east-1.tixte.net/uploads/tanmay111-files.tixte.co/WhatsApp_Image_2025-08-15_at_01.46.49.jpeg"
            className="mt-12 max-w-[323px] ml-[-40px] md:hidden"
          />
          <img
            src="https://us-east-1.tixte.net/uploads/tanmay111-files.tixte.co/WhatsApp_Image_2025-08-15_at_01.46.49.jpeg"
            className="hidden md:block max-w-[784px] mt-12"
          />
        </div>
      </main>
    </>
  );
}
