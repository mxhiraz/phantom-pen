"use client";

import { Editor } from "@/components/DynamicEditor";
import ProfileHeader from "@/components/ProfileHeader";
import { Spinner } from "@/components/whisper-page/LoadingSection";
import { api } from "@/convex/_generated/api";
import { formatNoteTimestamp } from "@/lib/utils";
import { useQuery } from "convex/react";
import { notFound } from "next/navigation";

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

  if (!noteData) {
    return notFound();
  }

  return (
    <>
      <ProfileHeader
        username={username}
        avatarUrl={avatarUrl}
        defaultTitle={`Last updated ${formatNoteTimestamp(
          noteData.updatedAt!
        )}`}
      />

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
  );
}
