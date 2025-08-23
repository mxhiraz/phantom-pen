"use client";

import { Editor } from "@/components/DynamicEditor";
import ProfileHeader from "@/components/ProfileHeader";
import { Spinner } from "@/components/whisper-page/LoadingSection";
import { api } from "@/convex/_generated/api";
import { formatNoteTimestamp } from "@/lib/utils";
import { useQuery } from "convex/react";

interface EditorProps {
  noteId: string;
  username: string;
  avatarUrl: string;
}

export default function MemoirEditor({
  noteId,
  username,
  avatarUrl,
}: EditorProps) {
  const noteData = useQuery(api.whispers.getPublicWhisper, {
    id: noteId as any,
  });

  if (noteData === undefined) {
    return <Spinner />;
  }

  return (
    <>
      <ProfileHeader
        username={username}
        avatarUrl={avatarUrl}
        defaultTitle={
          !noteData
            ? "Note not found"
            : `Last updated ${formatNoteTimestamp(noteData.updatedAt!)}`
        }
      />

      {!noteData ? (
        <section className="mx-auto max-w-[727px] px-6 pb-1">
          <div className="text-center py-16 flex flex-col items-center">
            <h2 className="text-xl font-medium text-left text-black mb-2">
              Note not found
            </h2>
            <p className="max-w-[264px] text-base text-center text-[#364152] mb-8">
              The note you are looking for does not exist.
            </p>
          </div>
        </section>
      ) : (
        <>
          <div className="flex flex-col gap-0.5 md:px-6 px-7 mt-4">
            <h1 className="text-2xl text-left font-bold">{noteData.title}</h1>
          </div>

          <Editor
            id={noteId}
            initialContent={noteData.rawTranscription || ""}
            editable={false}
            className="md:px-6 px-4"
          />
        </>
      )}
    </>
  );
}
