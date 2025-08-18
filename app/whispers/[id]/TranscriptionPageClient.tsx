"use client";

import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Spinner } from "@/components/whisper-page/LoadingSection";
import { Button } from "@/components/ui/button";
import { RecordingModal } from "../../../components/RecordingModal";
import { Editor } from "@/components/DynamicEditor";
import { BlockNoteEditor } from "@blocknote/core";

export default function TranscriptionPageClient({ id }: { id: string }) {
  const router = useRouter();
  const whisper = useQuery(api.whispers.getWhisper, {
    id: id,
  });
  const isLoading = whisper === undefined; // Check if query is still loading
  const isNotFound = whisper === null; // Check if whisper was not found

  const [whipserData, setWhipserData] = useState(whisper);

  useEffect(() => {
    setWhipserData(whisper);
  }, [whisper]);

  const editorRef = useRef<BlockNoteEditor>(null);
  const [showRecordingModal, setShowRecordingModal] = useState(false);
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const titleDebounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const titleAbortController = useRef<AbortController | null>(null);
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
          <h1 className="text-2xl font-bold mb-2">Note not found</h1>
          <p className="text-gray-600 mb-4">
            The note you're looking for doesn't exist or has been deleted.
          </p>
          <Button size="sm" onClick={() => router.push("/whispers")}>
            Back to Notes
          </Button>
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
    <div className="min-h-[calc(100vh-60px)]">
      <header className="bg-slate-50 border-b border-slate-200 px-3 py-4">
        <div className="mx-auto max-w-[688px] w-full flex items-start justify-between">
          <div className="w-full">
            <input
              className="text-xl w-full font-semibold bg-transparent border-none outline-none flex-1"
              value={whipserData?.title || ""}
              onChange={(e) => {
                const value = e.target.value;
                setWhipserData({ ...whipserData, title: value } as any);
                if (titleDebounceTimeout.current) {
                  clearTimeout(titleDebounceTimeout.current);
                }
                // Cancel previous request if any
                if (titleAbortController.current) {
                  titleAbortController.current.abort();
                }
                titleAbortController.current = new AbortController();
                titleDebounceTimeout.current = setTimeout(() => {
                  setIsSavingTitle(true);
                  updateTitleMutation({ id: id as any, title: value })
                    .then(() => {
                      setIsSavingTitle(false);
                    })
                    .catch(() => {
                      toast.error("Failed to save title");
                      setIsSavingTitle(false);
                    });
                }, 1000); // 1 second debounce
              }}
              placeholder="Untitled Note"
            />
            {whipserData?.updatedAt && (
              <p className="text-xs text-gray-500">
                Last updated {formatLastUpdated(whipserData.updatedAt)}
              </p>
            )}
          </div>
          <div className="flex items-start justify-between">
            {(isSavingTitle || isSaving) && (
              <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                <div className="size-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="py-4 pb-10 mx-auto w-full">
        <div className="mb-6 md:max-w-[800px] mx-auto">
          <Editor
            initialContent={whisper?.rawTranscription || ""}
            id={id}
            setIsSaving={setIsSaving}
            editorRef={editorRef}
          />
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 w-full md:left-1/2 md:-translate-x-1/2 border-t md:border md:rounded-xl border-slate-200 px-4 py-3 z-50 max-w-[730px] md:mb-4">
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
                String(whipserData?.fullTranscription || "")
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
          }}
          whisperId={id}
        />
      )}
    </div>
  );
}
