"use client";

import "@blocknote/shadcn/style.css";
import { BlockNoteView } from "@blocknote/shadcn";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core";
import { useRef } from "react";

import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { LoadingSection } from "./whisper-page/LoadingSection";

export default function BlocknoteEditor({
  initialContent,
  id,
}: {
  initialContent: any;
  id: string;
}) {
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const updateTranscriptionMutation = useMutation(
    api.whispers.updateFullTranscription
  );

  const { audio, image, table, video, file, ...remainingBlockSpecs } =
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
      className="md:max-w-[800px]"
      editor={editor}
      theme="light"
      sideMenu={false}
    />
  );
}
