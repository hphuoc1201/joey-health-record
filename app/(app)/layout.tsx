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
      {/* Clear the fixed desktop sidebar (240px); bottom padding for mobile nav. */}
      <main className="px-4 pb-24 pt-6 md:pb-10 md:pl-60">
        <div className="mx-auto max-w-5xl">{children}</div>
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
