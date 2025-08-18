import TranscriptionPageClient from "./TranscriptionPageClient";

export default async function TranscriptionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <TranscriptionPageClient id={id} />;
}
