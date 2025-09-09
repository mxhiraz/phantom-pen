"use client";

import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core";
import { useEffect, useRef } from "react";

import { api } from "@/convex/_generated/api";
import { useMutation, useAction } from "convex/react";
import { LoadingSection } from "./whisper-page/LoadingSection";
import { cn } from "@/lib/utils";
import { useFileUpload } from "./hooks/useFileUpload";

export default function BlocknoteEditor({
  initialContent,
  id,
  editable = true,
  markdown = false,
  className,
  editorRef,
}: {
  initialContent: any;
  id: string;
  editable?: boolean;
  markdown?: boolean;
  className?: string;
  editorRef?: any;
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

  useEffect(() => {
    if (editor && editorRef) {
      editorRef.current = editor;
    }
  }, [editor, editorRef]);

  useEffect(() => {
    if (markdown && initialContent && typeof initialContent === "string") {
      editor.tryParseMarkdownToBlocks(initialContent).then((blocks) => {
        editor.replaceBlocks(editor.document, blocks);
      });
    }
  }, [markdown, initialContent, editor]);

  if (!editor) return <LoadingSection />;
  return (
    <BlockNoteView
      className={cn("md:max-w-[800px] md:px-14", className)}
      editor={editor}
      theme="light"
      editable={editable}
    />
  );
}
