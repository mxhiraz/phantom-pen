"use client";

import "@blocknote/shadcn/style.css";
import { BlockNoteView } from "@blocknote/shadcn";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core";
import { useRef } from "react";

import { api } from "@/convex/_generated/api";
import { useMutation, useAction } from "convex/react";
import { LoadingSection } from "./whisper-page/LoadingSection";
import { cn } from "@/lib/utils";
import { useFileUpload } from "./hooks/useFileUpload";

export default function BlocknoteEditor({
  initialContent,
  id,
  editable = true,
  className,
}: {
  initialContent: any;
  id: string;
  editable?: boolean;
  className?: string;
}) {
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const { uploadFile: uploadFileFromHook } = useFileUpload({
    allowedTypes: ["image/"],
    maxSize: 10 * 1024 * 1024, // 10MB for images
  });
  const updateTranscriptionMutation = useMutation(
    api.whispers.updateFullTranscription
  );
  const getFileUrlAction = useAction(api.files.getFileUrlAction);

  // Wrapper function to match BlockNote's expected uploadFile signature
  const uploadFileForBlockNote = async (file: File) => {
    const storageId = await uploadFileFromHook(file);
    if (!storageId) {
      throw new Error("Failed to upload image");
    }

    // Get the file URL from Convex storage using the action
    try {
      const fileUrl = await getFileUrlAction({ storageId: storageId as any });
      if (!fileUrl) {
        throw new Error("Failed to get image URL from storage");
      }
      return fileUrl;
    } catch (error) {
      throw new Error("Failed to get image URL from storage");
    }
  };

  const { audio, table, video, file, ...remainingBlockSpecs } =
    defaultBlockSpecs;

  const schema = BlockNoteSchema.create({
    blockSpecs: {
      ...remainingBlockSpecs,
    },
  });

  const editor = useCreateBlockNote({
    schema,
    ...(typeof initialContent !== "string" && initialContent.length > 0
      ? { initialContent: initialContent }
      : {}),
    uploadFile: uploadFileForBlockNote,
  });

  editor.onChange(async (editor) => {
    const markdown = await editor.blocksToMarkdownLossy(editor.document);

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => {
      updateTranscriptionMutation({
        id: id as any,
        fullTranscription: markdown,
        rawTranscription: editor.document,
      }).catch((e) => {
        console.error(e);
      });
    }, 300);
  });

  if (!editor) return <LoadingSection />;
  return (
    <BlockNoteView
      shadCNComponents={{}}
      className={cn("md:max-w-[800px] md:px-14", className)}
      editor={editor}
      theme="light"
      sideMenu={false}
      editable={editable}
    />
  );
}
