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
      {/* Left padding for the desktop sidebar; bottom padding for the mobile nav. */}
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-6 md:pl-64 md:pb-10">
        {children}
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
