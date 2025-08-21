import Memoir from "@/components/memoir";

export default async function MemoirPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <Memoir id={id} />;
}
