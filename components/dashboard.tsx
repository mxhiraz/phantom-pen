"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, Search, Globe, Lock } from "lucide-react";
import { RecordingModal } from "@/components/RecordingModal";
import { ActionMenu } from "@/components/ActionMenu";

import { formatNoteTimestamp } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Transcription } from "@/app/whispers/page";
import Memoir from "./memoir";
import { PrivacyTogglePopover } from "./PrivacyTogglePopover";

interface DashboardProps {
  transcriptions: Transcription[];
}

export function Dashboard({ transcriptions }: DashboardProps) {
  console.log(transcriptions);
  const router = useRouter();
  const [showMemoir, setMemoir] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [showRecordingModal, setShowRecordingModal] = useState(false);
  const [isCreatingNote, setIsCreatingNote] = useState(false);

  const createBlankNoteMutation = useMutation(api.whispers.createBlankNote);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get("memoir");

    console.log(mode);

    if (mode === "true") {
      setMemoir(true);
    } else {
      setMemoir(false);
    }
  }, []);

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

  const handleNewNote = useCallback(async () => {
    try {
      setIsCreatingNote(true);
      // Create a new note through Convex
      const result = await createBlankNoteMutation({
        title: "Untitled Voice Note",
      });

      // Navigate to the new note page
      router.push(`/whispers/${result.id}`);
    } catch (error) {
      console.error("Failed to create voice note:", error);
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

  const toggleMode = () => {
    setMemoir((prev) => !prev);
    const url = new URL(window.location.href);
    const mode = url.searchParams.get("memoir");
    if (mode === "true") {
      url.searchParams.delete("memoir");
    } else {
      url.searchParams.set("memoir", "true");
    }

    window.history.replaceState({}, "", url.toString());
  };

  return (
    <>
      <div className="flex-1 h-full mx-auto w-full">
        <div className="mb-14">
          <div className="mx-auto max-w-[729px] w-full md:rounded-xl px-6 py-5 pb-2 flex flex-col gap-3 md:my-4 ">
            <div className="flex justify-between items-start">
              <h1 className="text-xl font-semibold text-left text-[#101828]">
                Your {!showMemoir ? "Voice Notes" : "Memoir"}
              </h1>
              <div className="flex gap-2">
                <PrivacyTogglePopover />
                <Button onClick={toggleMode} variant="outline" size="sm">
                  {showMemoir ? "View Voice Notes" : "View Memoir"}
                </Button>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search voice notes by title or content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              {debouncedSearchQuery && searchResults === undefined && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-primary border-t-muted-foreground rounded-full animate-spin"></div>
                </div>
              )}
            </div>
          </div>

          {!showMemoir ? (
            <>
              {filteredTranscriptions.length === 0 && searchQuery === "" ? (
                <div className="text-center py-16 flex flex-col items-center">
                  <h2 className="text-xl font-medium text-left text-black mb-2">
                    Welcome to Phantom Pen!
                  </h2>
                  <p className="max-w-[264px] text-base text-center text-[#364152] mb-8">
                    Start by recording a voice note or
                    <br />
                    creating a text note for
                    <br />
                    transcription
                  </p>
                </div>
              ) : (
                <div className="flex flex-col justify-start items-start relative space-y-4 mx-auto max-w-[727px]">
                  {filteredTranscriptions &&
                  filteredTranscriptions.length > 0 ? (
                    filteredTranscriptions.map((transcription) =>
                      isDesktop ? (
                        <div key={transcription.id} className="relative w-full">
                          <Link
                            prefetch
                            href={`/whispers/${transcription.id}`}
                            className="self-stretch flex-grow-0 flex-shrink-0 min-h-[100px] max-h-[153px] overflow-hidden group border-t-0 border-r-0 border-b-[0.7px] border-l-0 border-gray-200 md:border-[0.7px] md:border-transparent md:rounded-xl focus-within:bg-gray-50 focus-within:border-[#d1d5dc] hover:bg-gray-50 hover:border-[#d1d5dc] transition-all flex flex-col justify-between px-6 py-4 pr-14"
                            tabIndex={0}
                          >
                            <p className="text-base font-medium text-left text-[#101828] mb-2">
                              {transcription.title}
                              {transcription.public ? (
                                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <Globe className="w-3 h-3 mr-1" />
                                  Public
                                </span>
                              ) : (
                                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                  <Lock className="w-3 h-3 mr-1" />
                                  Private
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-left text-[#4a5565] mb-3 line-clamp-3">
                              {transcription.preview}
                            </p>
                            <p className="text-xs text-left text-[#99a1af] mt-auto">
                              {new Date(
                                transcription.createdAt
                              ).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}{" "}
                              {formatNoteTimestamp(transcription.timestamp)}
                            </p>
                          </Link>
                          <div className="absolute top-4 right-6 z-10">
                            <ActionMenu itemId={transcription.id} />
                          </div>
                        </div>
                      ) : (
                        <div key={transcription.id} className="relative w-full">
                          <Link
                            href={`/whispers/${transcription.id}`}
                            className="self-stretch flex-grow-0 flex-shrink-0 min-h-[100px] max-h-[152px] overflow-hidden group border-t-0 border-r-0 border-b-[0.7px] border-l-0 border-gray-200 md:border-[0.7px] md:border-transparent md:rounded-xl focus-within:bg-gray-50 focus-within:border-[#d1d5dc] hover:bg-gray-50 hover:border-[#d1d5dc] transition-all flex flex-col justify-between px-6 py-4 pr-14"
                            tabIndex={0}
                          >
                            <p className="text-base font-medium text-left text-[#101828] mb-2">
                              {transcription.title}
                              {transcription.public ? (
                                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <Globe className="w-3 h-3 mr-1" />
                                  Public
                                </span>
                              ) : (
                                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                  <Lock className="w-3 h-3 mr-1" />
                                  Private
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-left text-[#4a5565] mb-3 line-clamp-3">
                              {transcription.preview}
                            </p>
                            <p className="text-xs flex items-center gap-1 text-left text-[#99a1af] mt-auto">
                              {new Date(
                                transcription.createdAt
                              ).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}{" "}
                              {formatNoteTimestamp(transcription.timestamp)}
                            </p>
                          </Link>
                          <div className="absolute top-4 right-6 z-10">
                            <ActionMenu itemId={transcription.id} />
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
                              No voice notes found
                            </p>
                            <p className="text-sm">
                              Try adjusting your search terms
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-lg font-medium mb-2">
                              No voice notes yet
                            </p>
                            <p className="text-sm">
                              Record your first voice note to get started
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <Memoir />
          )}
        </div>

        {/* Action Buttons */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[730px] flex justify-center items-center px-6 pb-4">
          <div className="w-full flex gap-3">
            <Button
              size="lg"
              onClick={() => setShowRecordingModal(true)}
              className="flex-1"
              disabled={isCreatingNote}
            >
              <Mic className="size-4" />
              Record Voice Note
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={handleNewNote}
              className="flex-1"
              disabled={isCreatingNote}
            >
              {isCreatingNote ? "Creating..." : "Text Note"}
            </Button>
          </div>
        </div>
      </div>

      {/* Recording Modal */}
      {showRecordingModal && (
        <RecordingModal onClose={() => setShowRecordingModal(false)} />
      )}
    </>
  );
}
