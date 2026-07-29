"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import clsx from "clsx";
import type { Profile } from "@/lib/types";

export function MemberFilter({ profiles }: { profiles: Profile[] }) {
  const params = useSearchParams();
  const active = params.get("profile");

  if (profiles.length === 0) return null;

  return (
    <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1">
      <Chip href="/" label="Tất cả" active={!active} />
      {profiles.map((p) => (
        <Chip
          key={p.id}
          href={`/?profile=${p.id}`}
          label={p.full_name}
          active={active === p.id}
        />
      ))}
    </div>
  );
}

function Chip({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={clsx(
        "whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium transition",
        active
          ? "border-brand-600 bg-brand-600 text-white"
          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300",
      )}
    >
      {label}
    </Link>
  );
}
