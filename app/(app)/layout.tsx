"use client";

import { Loader2 } from "lucide-react";
import { Providers } from "@/app/providers";
import { useAuth } from "@/lib/auth-context";
import { Nav } from "@/components/Nav";

function Shell({ children }: { children: React.ReactNode }) {
  const { session, canManage, loading } = useAuth();

  // While the session loads (or after redirecting to /login), show a splash.
  if (loading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Nav canManage={canManage} />
      {/* lg:pl-60 only *clears* the fixed 240px sidebar; the inner wrapper owns
          the horizontal gutter (px-4 / lg:px-8) so content never butts up
          against the sidebar. Bottom padding leaves room for the bottom nav. */}
      <main className="pb-24 pt-6 lg:pb-10 lg:pl-60">
        <div className="mx-auto max-w-5xl px-4 lg:px-8">{children}</div>
      </main>
    </div>
  );
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <Shell>{children}</Shell>
    </Providers>
  );
}
