"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ERROR_MESSAGES } from "@/lib/constants";
import { LoadingSection, Spinner } from "./whisper-page/LoadingSection";

export default function Memoir({
  isPublic = false,
  clerkId,
}: {
  isPublic?: boolean;
  clerkId?: string;
}) {
  const memoirs = isPublic
    ? useQuery(api.memoirs.getPublicMemoirs, {
        limit: 100,
        clerkId: clerkId ?? "",
      })
    : useQuery(api.memoirs.getUserMemoirs, {
        limit: 100,
      });

  if (memoirs == undefined) {
    return isPublic ? (
      <Spinner />
    ) : (
      <div className="flex justify-center items-center h-[500px]">
        <LoadingSection />
      </div>
    );
  }

  if (memoirs === ERROR_MESSAGES.MEMOIRS_NOT_PUBLIC && clerkId) {
    return (
      <section className="mx-auto max-w-[727px] px-6 pb-1">
        <div className="text-center py-16 flex flex-col items-center">
          <h2 className="text-xl font-medium text-left text-black mb-2">
            Memoirs are not public
          </h2>
          <p className="max-w-[264px] text-base text-center text-[#364152] mb-8">
            This user has not made their memoirs public.
          </p>
        </div>
      </section>
    );
  }

  if (!memoirs || memoirs.length === 0) {
    return (
      <section className="mx-auto max-w-[727px] px-6 pb-1">
        <div className="text-center py-16 flex flex-col items-center">
          <h2 className="text-xl font-medium text-left text-black mb-2">
            No memoirs yet
          </h2>
          <p className="max-w-[264px] text-base text-center text-[#364152] mb-8">
            Your memoirs will be automatically created from your voice notes.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-[727px] md:pl-36 px-6 pb-1">
      <div className="container">
        <div className="relative mx-auto max-w-full">
          <Separator
            orientation="vertical"
            className="bg-muted absolute left-2 top-4"
          />
          {Array.isArray(memoirs) &&
            memoirs.map((memoir) => (
              <div key={memoir._id} className="relative mb-10 pl-8">
                <div className="bg-foreground absolute left-0 top-3.5 flex size-4 items-center justify-center rounded-full" />
                <h4 className="rounded-xl py-2 text-xl font-bold tracking-tight xl:mb-4 xl:px-3">
                  {memoir.title}
                </h4>

                <h5 className="text-md -left-28 text-muted-foreground top-3 rounded-xl tracking-tight md:absolute">
                  {memoir.date}
                </h5>
                <Card className="my-5 border-none shadow-none">
                  <CardContent className="px-0 xl:px-2">
                    <div
                      className="prose dark:prose-invert text-foreground"
                      dangerouslySetInnerHTML={{ __html: memoir.content }}
                    />
                  </CardContent>
                </Card>
              </div>
            ))}
        </div>
      </div>
    </section>
  );
}
