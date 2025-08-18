"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, Search } from "lucide-react";
import { RecordingModal } from "@/components/RecordingModal";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import type { Transcription } from "@/app/page";

import { formatNoteTimestamp, stripMarkdown } from "@/lib/utils";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { useMutation as useConvexMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

interface DashboardProps {
  transcriptions: Transcription[];
}

export function Dashboard({ transcriptions }: DashboardProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [showRecordingModal, setShowRecordingModal] = useState(false);
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    noteId: string | null;
    noteTitle: string;
  }>({
    open: false,
    noteId: null,
    noteTitle: "",
  });

  const deleteMutation = useConvexMutation(api.whispers.deleteWhisper);
  const createBlankNoteMutation = useConvexMutation(
    api.whispers.createBlankNote
  );

  // Debounce search query to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Use search API instead of local filtering
  const searchResults = useQuery(api.whispers.searchWhispers, {
    searchQuery: debouncedSearchQuery,
  });

  // Desktop detection (simple window width check)
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768);
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  // Use search results if available, otherwise fall back to local transcriptions
  const filteredTranscriptions = searchResults || transcriptions;

  const handleDelete = async (id: string, title: string) => {
    setDeleteDialog({
      open: true,
      noteId: id,
      noteTitle: title,
    });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.noteId) return;

    try {
      await deleteMutation({ id: deleteDialog.noteId as any });
      // The search results will automatically update due to Convex reactivity
      setDeleteDialog({ open: false, noteId: null, noteTitle: "" });
      toast.success("Note deleted successfully");
    } catch (err) {
      toast.error(
        "Failed to delete. You may not own this Note or there was a network error."
      );
    }
  };

  const handleNewNote = useCallback(async () => {
    try {
      setIsCreatingNote(true);
      // Create a new note through Convex
      const result = await createBlankNoteMutation({ title: "Untitled Note" });

      // Navigate to the new note page
      router.push(`/whispers/${result.id}`);
    } catch (error) {
      console.error("Failed to create note:", error);
      // If Convex fails, create a note with random ID and redirect
      const randomId = `note-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      router.push(`/whispers/${randomId}`);
    } finally {
      setIsCreatingNote(false);
    }
  }, [createBlankNoteMutation, router]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.metaKey &&
        e.shiftKey &&
        (e.code === "Space" || e.key === " " || e.key === "Spacebar")
      ) {
        e.preventDefault();
        handleNewNote();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleNewNote]);

  return (
    <>
      <div className="flex-1 h-full mx-auto w-full">
        <div className="mb-8">
          <div className="mx-auto max-w-[729px] w-full md:rounded-xl px-6 py-5 flex flex-col gap-3 md:my-4 ">
            <h1 className="text-xl font-semibold text-left text-[#101828]">
              Your Notes
            </h1>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search notes by title or content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              {debouncedSearchQuery && searchResults === undefined && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
              )}
            </div>
          </div>

          {/* Empty State or Transcriptions List */}
          {filteredTranscriptions.length === 0 && searchQuery === "" ? (
            <div className="text-center py-16 flex flex-col items-center">
              <h2 className="text-xl font-medium text-left text-black mb-2">
                Welcome, note-taker!
              </h2>
              <p className="max-w-[264px] text-base text-center text-[#364153] mb-8">
                Start by creating a new Note or
                <br />
                creating a voice note for
                <br />
                transcription
              </p>
            </div>
          ) : (
            <div className="flex flex-col justify-start items-start relative space-y-4 mx-auto max-w-[727px]">
              {filteredTranscriptions && filteredTranscriptions.length > 0 ? (
                filteredTranscriptions.map((transcription) =>
                  isDesktop ? (
                    <div key={transcription.id} className="relative w-full">
                      <Link
                        prefetch
                        href={`/whispers/${transcription.id}`}
                        className="self-stretch flex-grow-0 flex-shrink-0 h-[121px] overflow-hidden group border-t-0 border-r-0 border-b-[0.7px] border-l-0 border-gray-200 md:border-[0.7px] md:border-transparent md:rounded-xl focus-within:bg-gray-50 focus-within:border-[#d1d5dc] hover:bg-gray-50 hover:border-[#d1d5dc] transition-all flex flex-col justify-between px-6 py-4 pr-14"
                        tabIndex={0}
                      >
                        <p className="text-base font-medium text-left text-[#101828] mb-2">
                          {transcription.title}
                        </p>
                        <p className="text-sm text-left text-[#4a5565] mb-4 line-clamp-2">
                          {stripMarkdown(transcription.preview)}
                        </p>
                        <p className="text-xs text-left text-[#99a1af] mt-auto">
                          {formatNoteTimestamp(transcription.timestamp)}
                        </p>
                      </Link>
                      <div className="absolute top-4 right-6 z-10">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
                          aria-label="Delete note"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(transcription.id, transcription.title);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div key={transcription.id} className="relative w-full">
                      <Link
                        href={`/whispers/${transcription.id}`}
                        className="self-stretch flex-grow-0 flex-shrink-0 h-[121px] overflow-hidden group border-t-0 border-r-0 border-b-[0.7px] border-l-0 border-gray-200 md:border-[0.7px] md:border-transparent md:rounded-xl focus-within:bg-gray-50 focus-within:border-[#d1d5dc] hover:bg-gray-50 hover:border-[#d1d5dc] transition-all flex flex-col justify-between px-6 py-4 pr-14"
                        tabIndex={0}
                      >
                        <p className="text-base font-medium text-left text-[#101828] mb-2">
                          {transcription.title}
                        </p>
                        <p className="text-sm text-left text-[#4a5565] mb-4 line-clamp-2">
                          {stripMarkdown(transcription.preview)}
                        </p>
                        <p className="text-xs text-left text-[#99a1af] mt-auto">
                          {formatNoteTimestamp(transcription.timestamp)}
                        </p>
                      </Link>
                      <div className="absolute top-4 right-6 z-10">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
                          aria-label="Delete note"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(transcription.id, transcription.title);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )
                )
              ) : (
                // No notes found message
                <div className="w-full text-center py-12">
                  <div className="text-gray-500">
                    {debouncedSearchQuery ? (
                      <>
                        <p className="text-lg font-medium mb-2">
                          No notes found
                        </p>
                        <p className="text-sm">
                          Try adjusting your search terms
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-lg font-medium mb-2">No notes yet</p>
                        <p className="text-sm">
                          Create your first note to get started
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[688px] flex justify-center items-center px-6 pb-4">
          <div className="w-full flex gap-3">
            <Button
              size="lg"
              onClick={() => setShowRecordingModal(true)}
              className="flex-1"
              disabled={isCreatingNote}
            >
              <Mic className="size-4" />
              Voice Note
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={handleNewNote}
              className="flex-1"
              disabled={isCreatingNote}
            >
              {isCreatingNote ? "Creating..." : "Create Note"}
            </Button>
          </div>
        </div>
      </div>

      {/* Recording Modal */}
      {showRecordingModal && (
        <RecordingModal onClose={() => setShowRecordingModal(false)} />
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialog.open}
        onClose={() =>
          setDeleteDialog({ open: false, noteId: null, noteTitle: "" })
        }
        onConfirm={confirmDelete}
        title={`Delete "${deleteDialog.noteTitle}"?`}
        description="This action cannot be undone. This will permanently delete the note and all its associated data."
      />
    </>
  );
}
