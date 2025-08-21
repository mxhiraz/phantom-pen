import Memoir from "@/components/memoir";
import ProfileHeader from "@/components/ProfileHeader";

export default async function MemoirPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="w-full md:space-y-3 max-w-[727px] mx-auto">
      <ProfileHeader />
      <Memoir id={id} />
    </div>
  );
}
