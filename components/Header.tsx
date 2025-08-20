"use client";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import React from "react";
import { cn } from "@/lib/utils";
import { SignedOut } from "@clerk/nextjs";
import { SignedIn } from "@clerk/nextjs";
import { ProfilePopover } from "./ProfilePopover";

export default function HeroHeader() {
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  return (
    <header>
      <nav className="fixed z-20 w-full px-2">
        <div
          className={cn(
            "mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-12",
            isScrolled &&
              "bg-background/50 max-w-4xl rounded-2xl border backdrop-blur-lg lg:px-5"
          )}
        >
          <div className="relative flex items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
            <div className="flex w-auto">
              <Logo />
            </div>

            <div className="flex items-center gap-3">
              <SignedOut>
                <Button asChild variant="outline" size="sm">
                  <Link href="/auth?mode=signin">
                    <span>Login</span>
                  </Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/auth?mode=signup">
                    <span>Sign Up</span>
                  </Link>
                </Button>
              </SignedOut>
              <SignedIn>
                <ProfilePopover />
              </SignedIn>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
