"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { Home, Users, Plus, Share2, LogOut, type LucideIcon } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  manageOnly?: boolean;
}

const ITEMS: NavItem[] = [
  { href: "/", label: "Lịch sử khám", icon: Home },
  { href: "/profiles", label: "Thành viên", icon: Users, manageOnly: true },
  { href: "/visit/new", label: "Thêm", icon: Plus, manageOnly: true },
  { href: "/share", label: "Chia sẻ", icon: Share2, manageOnly: true },
];

const ADD_HREF = "/visit/new";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function Nav({ canManage }: { canManage: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const { supabase, email } = useAuth();
  const items = ITEMS.filter((i) => !i.manageOnly || canManage);

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  const fab = items.find((i) => i.href === ADD_HREF);
  const linkBarItems = items.filter((i) => i.href !== ADD_HREF);
  // On mobile, the logout action rides in the bottom bar as its own item.
  const barCount = linkBarItems.length + 1; // + logout
  const half = Math.ceil(barCount / 2);

  const barLeft = fab ? linkBarItems.slice(0, half) : linkBarItems;
  const barRight = fab ? linkBarItems.slice(half) : [];

  return (
    <>
      {/* Desktop sidebar (dark) */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col bg-ink-900 px-3 py-6 md:flex">
        <div className="mb-8 flex items-center gap-2.5 px-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.svg"
            alt=""
            className="h-10 w-10 rounded-2xl shadow-fab"
          />
          <span className="text-[15px] font-bold tracking-tight text-white">
            Hồ sơ sức khỏe
          </span>
        </div>

        <nav className="flex flex-col gap-1">
          {items.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 active:scale-[0.98]",
                  active
                    ? "bg-white/10 text-white"
                    : "text-gray-400 hover:bg-white/5 hover:text-white",
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer: user + logout */}
        <div className="mt-auto border-t border-white/10 pt-3">
          {email && (
            <p className="mb-1 truncate px-3 text-xs text-gray-500" title={email}>
              {email}
            </p>
          )}
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-400 transition-all duration-150 hover:bg-white/5 hover:text-white active:scale-[0.98]"
          >
            <LogOut className="h-5 w-5" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Mobile bottom navigation (dark) */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex h-16 items-stretch bg-ink-900 md:hidden">
        <div className="flex flex-1 items-stretch justify-around">
          {barLeft.map((item) => (
            <BottomLink
              key={item.href}
              item={item}
              active={isActive(pathname, item.href)}
            />
          ))}
        </div>

        {fab && (
          <Link
            href={fab.href}
            aria-label={fab.label}
            className="absolute -top-5 left-1/2 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-fab ring-4 ring-[#f4f6fb] transition-transform duration-150 active:scale-90"
          >
            <Plus className="h-7 w-7" />
          </Link>
        )}

        <div className="flex flex-1 items-stretch justify-around">
          {barRight.map((item) => (
            <BottomLink
              key={item.href}
              item={item}
              active={isActive(pathname, item.href)}
            />
          ))}
          <BottomButton icon={LogOut} label="Đăng xuất" onClick={signOut} />
        </div>
      </nav>
    </>
  );
}

function BottomLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={clsx(
        "flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors duration-150 active:scale-90",
        active ? "text-white" : "text-gray-500 hover:text-gray-300",
      )}
    >
      <span
        className={clsx(
          "flex h-7 w-7 items-center justify-center rounded-full transition-colors",
          active && "bg-white/10",
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      {item.label}
    </Link>
  );
}

function BottomButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-gray-500 transition-colors duration-150 hover:text-gray-300 active:scale-90"
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-full">
        <Icon className="h-5 w-5" />
      </span>
      {label}
    </button>
  );
}
