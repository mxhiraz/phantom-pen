"use client";

import { usePathname } from "next/navigation";
import React from "react";
import { Button } from "@/components//ui/button";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";
import { ProfilePopover } from "@/components/ProfilePopover";
import { Logo } from "@/components/logo";

export function Header() {
  const pathname = usePathname();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isSignInPage = pathname.startsWith("/auth");

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
            loading="eager"
            className="min-w-[14px] min-h-[14px] size-[14px]"
          />
          <span className="text-base font-medium text-[#4A5565]">My Notes</span>
        </Link>
      ) : (
        <Logo />
      )}
      <div className="flex items-center gap-2">
        <SignedOut>
          <Link href="/auth?mode=signin">
            <Button variant="ghost" size="sm">
              Login
            </Button>
          </Link>
          <Link href="/auth?mode=signup">
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
