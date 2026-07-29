import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/auth";
import { Nav } from "@/components/Nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionContext();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen">
      <Nav isAdmin={session.isAdmin} />
      {/* Left padding for the desktop sidebar; bottom padding for the mobile nav. */}
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-6 md:pl-64 md:pb-10">
        {children}
      </main>
    </div>
  );
}
