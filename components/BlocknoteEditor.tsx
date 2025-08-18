"use client";

import "@blocknote/shadcn/style.css";
import { BlockNoteView } from "@blocknote/shadcn";
import { useCreateBlockNote } from "@blocknote/react";
import {
  BlockNoteSchema,
  defaultBlockSpecs,
  defaultStyleSpecs,
} from "@blocknote/core";
import { useEffect, useRef } from "react";

import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";

export default function BlocknoteEditor({
  initialContent,
  id,
  editorRef,
}: {
  initialContent: any;
  id: string;
  editorRef: React.RefObject<any>;
}) {
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const updateTranscriptionMutation = useMutation(
    api.whispers.updateFullTranscription
  );

  const { audio, image, table, video, file, ...remainingBlockSpecs } =
    defaultBlockSpecs;
  defaultStyleSpecs;
  const schema = BlockNoteSchema.create({
    blockSpecs: {
      ...remainingBlockSpecs,
    },
  });

  const editor = useCreateBlockNote({
    schema,
    ...(typeof initialContent !== "string"
      ? { initialContent: initialContent }
      : {}),
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

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
