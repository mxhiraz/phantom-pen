"use client";
import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

import { TextEffect } from "@/components/ui/text-effect";
import { AnimatedGroup } from "@/components/ui/animated-group";
import HeroHeader from "./Header";
import { useUser } from "@clerk/nextjs";

const transitionVariants = {
  item: {
    hidden: {
      opacity: 0,
      filter: "blur(12px)",
      y: 12,
    },
    visible: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: {
        type: "spring" as const,
        bounce: 0.3,
        duration: 1.5,
      },
    },
  },
};

export default function HeroSection() {
  const { isSignedIn } = useUser();
  return (
    <>
      <HeroHeader />
      <main className="overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 isolate hidden opacity-65 contain-strict lg:block"
        >
          <div className="w-140 h-320 -translate-y-87.5 absolute left-0 top-0 -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(0,0%,85%,.08)_0,hsla(0,0%,55%,.02)_50%,hsla(0,0%,45%,0)_80%)]" />
          <div className="h-320 absolute left-0 top-0 w-60 -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.06)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)] [translate:5%_-50%]" />
          <div className="h-320 -translate-y-87.5 absolute left-0 top-0 w-60 -rotate-45 bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.04)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)]" />

          <div
            className=" absolute bottom-[-50] left-[-50]  blur-[50px] opacity-20 w-108 h-72 bg-gradient-to-r from-purple-700 to-purple-900 
            animate-[blob_8s_infinite_ease-in-out] 
            rounded-[50%_40%_60%_50%_/_50%_60%_40%_50%]"
          ></div>

          <div
            className=" absolute bottom-[-50] right-[-50]  blur-[50px] opacity-20 w-108 h-72 bg-gradient-to-r from-purple-700 to-purple-900 
            animate-[blob_8s_infinite_ease-in-out] 
            rounded-[50%_40%_60%_50%_/_50%_60%_40%_50%]"
          ></div>
        </div>
        <section>
          <div className="relative pt-32 md:pt-36">
            <div className="absolute inset-0 -z-10 size-full [background:radial-gradient(125%_125%_at_50%_100%,transparent_0%,var(--color-background)_75%)]"></div>
            <div className="mx-auto max-w-7xl px-6">
              <div className="text-center sm:mx-auto lg:mr-auto lg:mt-0">
                <AnimatedGroup variants={transitionVariants}>
                  <Link
                    href="#link"
                    className="hover:bg-background dark:hover:border-t-border bg-muted group mx-auto flex w-fit items-center gap-4 rounded-full border p-1 pl-4  transition-colors duration-300 dark:border-t-white/5 "
                  >
                    <span className="text-foreground text-sm">
                      Introducing Version 1:0
                    </span>
                    <span className="dark:border-background block h-4 w-0.5 border-l bg-white dark:bg-zinc-700"></span>

                    <div className="bg-background group-hover:bg-muted size-6 overflow-hidden rounded-full duration-500">
                      <div className="flex w-12 -translate-x-1/2 duration-500 ease-in-out group-hover:translate-x-0">
                        <span className="flex size-6">
                          <ArrowRight className="m-auto size-3" />
                        </span>
                        <span className="flex size-6">
                          <ArrowRight className="m-auto size-3" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </AnimatedGroup>

                <TextEffect
                  preset="fade-in-blur"
                  speedSegment={0.3}
                  as="h1"
                  className="mt-8 text-balance text-5xl md:text-7xl lg:mt-16 xl:text-[5.25rem] font-bold italic
                                    "
                >
                  Phantom Pen AI-Powered Memoir
                </TextEffect>
                <TextEffect
                  per="line"
                  preset="fade-in-blur"
                  speedSegment={0.3}
                  delay={0.5}
                  as="p"
                  className="mx-auto mt-8 max-w-3xl text-balance text-lg"
                >
                  Turn your journal entries, voice recordings, and ideas into
                  beautifully structured memoirs that you'll never lose track
                  of.
                </TextEffect>

                <AnimatedGroup
                  variants={{
                    container: {
                      visible: {
                        transition: {
                          staggerChildren: 0.05,
                          delayChildren: 0.75,
                        },
                      },
                    },
                    item: {
                      hidden: {
                        opacity: 0,
                        filter: "blur(12px)",
                        y: 12,
                      },
                      visible: {
                        opacity: 1,
                        filter: "blur(0px)",
                        y: 0,
                        transition: {
                          type: "spring" as const,
                          bounce: 0.3,
                          duration: 1.5,
                        },
                      },
                    },
                  }}
                  className="mt-12 flex flex-col items-center justify-center gap-2 md:flex-row"
                >
                  <div
                    key={1}
                    className="bg-foreground/10 rounded-[calc(var(--radius-xl)+0.125rem)] border p-0.5"
                  >
                    <Button
                      asChild
                      size="lg"
                      className="rounded-xl px-5 text-base"
                    >
                      <Link
                        href={isSignedIn ? "/whispers" : "/auth?mode=signup"}
                      >
                        <span className="text-nowrap">Make Memories</span>
                      </Link>
                    </Button>
                  </div>
                </AnimatedGroup>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
