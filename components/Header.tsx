"use client";

import { usePathname } from "next/navigation";
import React from "react";
import { Button } from "./ui/button";
import { SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { ProfilePopover } from "@/components/ProfilePopover";

export function Header() {
  const pathname = usePathname();
  const { user } = useUser();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isSignInPage = pathname.startsWith("/signin");

  // /whispers/1234567890
  const isSingleWhisperPage =
    pathname.startsWith("/whispers/") && pathname.length > 11;

  if (!mounted) {
    // Optionally, you can return a skeleton or null while mounting
    return (
      <div className="h-[63px] w-full bg-gray-50 border-b border-gray-200" />
    );
  }

  if (isSignInPage) {
    return null;
  }

  return (
    <header className="min-h-[63px] flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
      {isSingleWhisperPage ? (
        <Link href="/whispers/" className="flex items-center gap-2">
          <img
            src="/back.svg"
            className="min-w-[14px] min-h-[14px] size-[14px]"
          />
          <span className="text-base font-medium text-[#4A5565]">My Notes</span>
        </Link>
      ) : (
        <Link
          href={user?.id ? "/whispers/" : "/"}
          className="flex items-center gap-2"
        >
          <img
            src="https://us-east-1.tixte.net/uploads/tanmay111-files.tixte.co/WhatsApp_Image_2025-08-15_at_01.46.49.jpeg"
            className="min-w-5 min-h-5 size-9 mix-blend-multiply"
          />
          <span className="-ml-2">Phantom Pen</span>
        </Link>
      )}
      <div className="flex items-center gap-2">
        <SignedOut>
          <Link href="/signin">
            <Button variant="ghost" size="sm">
              Login
            </Button>
          </Link>
          <Link href="/signin">
            <Button size="sm" className="font-medium">
              Sign up
            </Button>
          </Link>
        </SignedOut>
        <SignedIn>
          <ProfilePopover />
        </SignedIn>
      </div>
    </header>
  );
}
