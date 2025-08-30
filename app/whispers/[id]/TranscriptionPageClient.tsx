"use client";

import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { Spinner } from "@/components/whisper-page/LoadingSection";
import { Button } from "@/components/ui/button";
import { RecordingModal } from "../../../components/RecordingModal";
import { Editor } from "@/components/DynamicEditor";
import { stripMarkdown } from "@/lib/utils";
import { ActionMenu } from "@/components/ActionMenu";
import Link from "next/link";

export default function TranscriptionPageClient({ id }: { id: string }) {
  const router = useRouter();
  const whisper = useQuery(api.whispers.getWhisper, {
    id: id as any,
  });
  const isLoading = whisper === undefined;
  const isNotFound = whisper === null;

  const [showRecordingModal, setShowRecordingModal] = useState(false);

  const [editorRefreshKey, setEditorRefreshKey] = useState(0);
  const titleDebounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const updateTitleMutation = useMutation(api.whispers.updateTitle);

  const formatLastUpdated = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60)
      return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
    if (diffInMinutes < 1440)
      return `${Math.floor(diffInMinutes / 60)} hour${
        Math.floor(diffInMinutes / 60) > 1 ? "s" : ""
      } ago`;
    return `${Math.floor(diffInMinutes / 1440)} day${
      Math.floor(diffInMinutes / 1440) > 1 ? "s" : ""
    } ago`;
  };

  // Show not found message when whisper is null
  if (isNotFound) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Voice note not found</h1>
          <p className="text-gray-600 mb-4">
            The voice note you're looking for doesn't exist or has been deleted.
          </p>
          <Link href="/whispers" className="text-blue-600 hover:underline">
            Back to Voice Notes
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Spinner />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-60px)] max-h-[calc(100vh-60px)] overflow-y-hidden">
      <header className="bg-slate-50 border-b border-slate-200 px-3 py-4">
        <div className="mx-auto max-w-[688px] w-full flex items-start justify-between">
          <div className="w-full">
            <input
              className="text-xl w-full font-semibold bg-transparent border-none outline-none flex-1"
              defaultValue={whisper?.title || ""}
              onChange={(e) => {
                const value = e.target.value;
                if (titleDebounceTimeout.current) {
                  clearTimeout(titleDebounceTimeout.current);
                }

                titleDebounceTimeout.current = setTimeout(() => {
                  updateTitleMutation({ id: id as any, title: value }).catch(
                    (e) => {
                      console.error(e);
                    }
                  );
                }, 300);
              }}
              placeholder="Untitled Voice Note"
            />
            {whisper?.updatedAt && (
              <p className="text-xs text-gray-500">
                Last updated {formatLastUpdated(whisper.updatedAt)}
              </p>
            )}
          </div>
          <div className="flex items-start justify-between">
            <ActionMenu itemId={id} />
          </div>
        </div>
      </header>

      <main className="py-4 md:max-h-[calc(100vh-230px)] max-h-[calc(100vh-250px)] overflow-y-auto mx-auto w-full">
        <div className="mb-11 md:max-w-[800px] mx-auto">
          <Editor
            key={`${id}-${editorRefreshKey}`}
            initialContent={whisper?.rawTranscription || ""}
            id={id}
          />
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 w-full md:left-1/2 md:-translate-x-1/2 border-t md:border-none md:rounded-md border-slate-50 backdrop-blur-2xl px-4 bg-white py-3 z-50 max-w-[730px] md:mb-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 w-full max-w-md md:max-w-none mx-auto">
          <Button
            size="sm"
            onClick={() => setShowRecordingModal(true)}
            className="w-full  col-span-2 md:col-span-1"
          >
            <img src="/microphone.svg" className="size-5 min-w-5 min-h-5" />
            <span>Speak</span>
          </Button>
          <Button
            size="sm"
            onClick={async () => {
              await navigator.clipboard.writeText(
                stripMarkdown(whisper?.fullTranscription || "")
              );
              toast.success("Copied to clipboard!");
            }}
            className="w-full"
          >
            <span>Copy</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push("/whispers")}
            className="w-full"
          >
            <span>New</span>
          </Button>
        </div>
      </footer>

      {/* Recording Modal */}
      {showRecordingModal && (
        <RecordingModal
          onClose={() => {
            setShowRecordingModal(false);
            setEditorRefreshKey((prev) => prev + 1);
          }}
          whisperId={id}
        />
      )}
    </div>
  );
}
