import NotFound from "./not-found";

import { api } from "@/convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";
import TranscriptionPageClient from "./TranscriptionPageClient";

// export async function generateMetadata({
//   params,
// }: {
//   params: Promise<{ id: string }>;
// }): Promise<Metadata> {
//   const { id } = await params;
//   return {
//     title: `${id} - Phantom Pen`,
//     description: "View and edit your transcription.",
//   };
// }

export default async function TranscriptionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Check if the note exists
  try {
    const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    const note = await client.query(api.whispers.getWhisperWithTracks, {
      id: id as any,
    });

    if (!note) {
      // If it's a random ID format (note-timestamp-random), try to create a new note
      if (id.startsWith("note-") && id.includes("-")) {
        try {
          const newNote = await client.mutation(api.whispers.createBlankNote, {
            title: "Untitled Note",
          });
          // Redirect to the real note
          return <TranscriptionPageClient id={newNote.id} />;
        } catch (createError) {
          // If creation fails, show not found
          return <NotFound />;
        }
      }
      return <NotFound />;
    }

    return <TranscriptionPageClient id={id} />;
  } catch (error) {
    // If there's an error (like invalid ID format), show not found
    return <NotFound />;
  }
}
