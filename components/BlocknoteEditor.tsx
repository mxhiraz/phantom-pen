"use client";
import "@blocknote/mantine/style.css";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core";

export default function BlocknoteEditor() {
  const { audio, image, table, video, file, ...remainingBlockSpecs } =
    defaultBlockSpecs;
  const schema = BlockNoteSchema.create({
    blockSpecs: {
      ...remainingBlockSpecs,
    },
  });

  const editor = useCreateBlockNote({
    schema,
  });
  editor.onChange(async (editor) => {
    const markdown = await editor.blocksToMarkdownLossy(editor.document);
    console.log("Markdown:", markdown);
  });

  return <BlockNoteView editor={editor} theme="light" />;
}
