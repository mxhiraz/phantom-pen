"use client";
import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "motion/react";

import { TextEffect } from "@/components/ui/text-effect";
import { AnimatedGroup } from "@/components/ui/animated-group";
import HeroHeader from "./Header";
import { useUser } from "@clerk/nextjs";
import { Footer } from "./Footer";

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

const delayedTransitionVariants = {
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
        delay: 1,
      },
    },
  },
};

const valuePoints = [
  {
    image: "/2.png",
    title: "Write",
    description:
      "Write notes, and our ai will automatically make memoir for you",
  },
  {
    image: "/1.png",
    title: "Publish",
    description:
      "Transform your raw content into beautifully structured memoirs",
  },
  {
    image: "/3.png",
    title: "Share",
    description: "Share your memories with loved ones or keep them private",
  },
];

export default function HeroSection() {
  const { isSignedIn } = useUser();
  const [isQRCodeVisible, setIsQRCodeVisible] = useState(true);
  const [isQRCodeCentered, setIsQRCodeCentered] = useState(false);

  const handleQRCodeClick = () => {
    setIsQRCodeCentered(true);
  };

  const handleCloseCentered = () => {
    setIsQRCodeCentered(false);
  };

  return (
    <>
      <HeroHeader />
      <main className="overflow-hidden relative">
        <div
          aria-hidden
          className="absolute inset-0 isolate opacity-65 contain-strict lg:block"
        >
          <div className="w-140 h-320 -translate-y-87.5 absolute left-0 top-0 -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(0,0%,85%,.08)_0,hsla(0,0%,55%,.02)_50%,hsla(0,0%,45%,0)_80%)]" />
          <div className="h-320 absolute left-0 top-0 w-60 -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.06)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)] [translate:5%_-50%]" />
          <div className="h-320 -translate-y-87.5 absolute left-0 top-0 w-60 -rotate-45 bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.04)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)]" />

          <div
            className=" absolute bottom-[-50] left-[-50]  blur-[50px] opacity-20 w-108 md:h-[100px] h-40 bg-gradient-to-r from-purple-700 to-purple-900 
            animate-[blob_8s_infinite_ease-in-out] 
            rounded-[50%_40%_60%_50%_/_50%_60%_40%_50%]"
          ></div>

          <div
            className=" absolute bottom-[-50] right-[-50]  blur-[50px] opacity-20 w-108 md:h-[150px] bg-gradient-to-r from-purple-700 to-purple-900 
            animate-[blob_8s_infinite_ease-in-out] 
            rounded-[50%_40%_60%_50%_/_50%_60%_40%_50%]"
          ></div>
        </div>
        <section>
          <div className="relative pt-32 md:pt-36">
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

            <div
              className=" absolute bottom-[-150] left-[-50]  blur-[50px] opacity-20 w-30 md:h-[400px] h-40 bg-gradient-to-r from-purple-700 to-purple-400 
            animate-[blob_8s_infinite_ease-in-out] 
            rounded-[50%_40%_60%_50%_/_50%_60%_40%_50%]"
            ></div>

            <div
              className=" absolute top-[-50] right-[-50]  blur-[50px] opacity-20 w-80 md:w-108 md:h-[300px] h-40 bg-gradient-to-r from-purple-700 to-purple-200 
            animate-[blob_8s_infinite_ease-in-out] 
            rounded-[50%_40%_60%_50%_/_50%_60%_40%_50%]"
            ></div>
          </div>
        </section>

        {/* Value Points Section */}
        <section className="py-24  bg-gradient-to-b from-transparent to-muted/20 pb-4">
          <div className="mx-auto max-w-7xl px-6">
            <AnimatedGroup
              variants={delayedTransitionVariants}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Write • Publish • Share Your Memories
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                A complete workflow to transform your thoughts into lasting
                memories
              </p>
            </AnimatedGroup>

            <div className="grid md:grid-cols-3 gap-8 mb-20">
              {valuePoints.map((point, index) => (
                <AnimatedGroup
                  key={index}
                  variants={transitionVariants}
                  className="text-center group"
                  whileInView={true}
                  viewport={{ once: true, amount: 0.2 }}
                >
                  <div className="bg-background/50 backdrop-blur-sm border rounded-2xl p-8 min-h-[100px]">
                    <div className=" bg-primary/10 h-[200px] md:aspect-video w-full flex items-center justify-center mx-auto mb-6">
                      <Image
                        src={point.image}
                        alt={point.title}
                        width={500}
                        height={500}
                        className=" h-full w-full object-cover"
                      />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">
                      {point.title}
                    </h3>
                    <p className="text-muted-foreground">{point.description}</p>
                  </div>
                </AnimatedGroup>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center  pb-16">
            <AnimatedGroup
              variants={transitionVariants}
              className="max-w-sm md:max-w-2xl mx-auto"
            >
              <h3 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Start Writing Your Note?
              </h3>
              <p className="text-muted-foreground max-w-lg text-lg mx-auto mb-4">
                Join thousands of users who are already preserving their
                memories with AI
              </p>
              <div className="flex flex-col items-center justify-center gap-2 md:flex-row">
                <div
                  key={3}
                  className="bg-foreground/10 rounded-[calc(var(--radius-xl)+0.125rem)] border p-0.5"
                >
                  <Button
                    asChild
                    size="lg"
                    className="rounded-xl px-5 text-base"
                  >
                    <Link href={isSignedIn ? "/whispers" : "/auth?mode=signup"}>
                      <span className="text-nowrap">Start Writing</span>
                    </Link>
                  </Button>
                </div>
              </div>
            </AnimatedGroup>
          </div>

          <Footer />
        </section>

        {/* QR Code - Bottom Right */}
        <AnimatePresence>
          {isQRCodeVisible && (
            <motion.div
              initial={{ opacity: 0, filter: "blur(12px)", scale: 0.5 }}
              animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
              transition={{
                duration: 0.4,
                delay: 1.7,
                ease: "easeInOut",
                type: "spring" as const,
                bounce: 0.3,
              }}
              layoutId="qr-code"
              className="fixed hidden md:block bottom-8 right-8 z-50 cursor-pointer"
              onClick={handleQRCodeClick}
            >
              <motion.div
                layoutId="qr-code-content"
                className="bg-white rounded-lg p-3  border"
              >
                <Image
                  src="https://us-east-1.tixte.net/uploads/tanmay111-files.tixte.co/qrcode_241727744_c88f1747bbb12a1111e2dcfd4509f907_(1).png"
                  alt="QR Code"
                  width={80}
                  height={80}
                  className="size-32"
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Centered QR Code Modal */}
        <AnimatePresence>
          {isQRCodeCentered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
              onClick={handleCloseCentered}
            >
              <motion.div
                layoutId="qr-code-content"
                className="bg-white rounded-2xl p-8  border max-w-sm mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center">
                  <div className="border p-3 rounded-2xl aspect-square  mb-4">
                    <Image
                      src="https://us-east-1.tixte.net/uploads/tanmay111-files.tixte.co/qrcode_241727744_c88f1747bbb12a1111e2dcfd4509f907_(1).png"
                      alt="QR Code"
                      width={500}
                      height={500}
                      loading="eager"
                      className="w-full h-full"
                    />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Scan QR Code</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Scan this QR code to download the app
                  </p>
                  <Button
                    onClick={handleCloseCentered}
                    variant="outline"
                    className="w-full"
                  >
                    Close
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </>
  );
}
