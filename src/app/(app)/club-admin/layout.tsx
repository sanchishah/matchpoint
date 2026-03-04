import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getClubForAdmin } from "@/lib/club-analytics";
import { ClubAdminNav } from "@/components/club-admin/nav";

export default async function ClubAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const club = await getClubForAdmin(session.user.id);
  if (!club) redirect("/dashboard");

  return (
    <div className="py-8">
      <div className="mx-auto max-w-6xl px-6">
        <ClubAdminNav clubName={club.name} />
        {children}
      </div>
    </div>
  );
}
