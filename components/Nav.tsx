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
  const barCount = linkBarItems.length + 1; // + logout
  const half = Math.ceil(barCount / 2);
  const barLeft = fab ? linkBarItems.slice(0, half) : linkBarItems;
  const barRight = fab ? linkBarItems.slice(half) : [];

  return (
    <>
      {/* Desktop: MD3 navigation drawer (light surface). */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col bg-surface-container px-3 py-6 lg:flex">
        <div className="mb-6 flex items-center gap-3 px-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="" className="h-10 w-10 rounded-md-md" />
          <span className="text-[15px] font-medium tracking-tight text-on-surface">
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
                  "flex h-14 items-center gap-3 rounded-full px-4 text-sm font-medium tracking-[.1px] transition-colors duration-150",
                  active
                    ? "bg-secondary-container text-on-secondary-container"
                    : "text-on-surface-variant hover:bg-surface-high hover:text-on-surface",
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-outline-variant pt-3">
          {email && (
            <p
              className="mb-1 truncate px-4 text-xs text-on-surface-variant"
              title={email}
            >
              {email}
            </p>
          )}
          <button
            onClick={signOut}
            className="flex h-14 w-full items-center gap-3 rounded-full px-4 text-sm font-medium tracking-[.1px] text-on-surface-variant transition-colors duration-150 hover:bg-surface-high hover:text-on-surface"
          >
            <LogOut className="h-5 w-5" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Mobile + tablet: MD3 navigation bar (bottom). */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex h-20 items-stretch border-t border-outline-variant bg-surface-container lg:hidden">
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
            className="absolute -top-4 left-1/2 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-md-lg bg-primary-container text-on-primary-container shadow-fab transition-transform duration-150 active:scale-90"
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
      className="flex flex-1 flex-col items-center justify-center gap-1 pt-1 text-[12px] font-medium transition-colors duration-150 active:scale-95"
    >
      {/* MD3 active indicator: a pill behind the icon. */}
      <span
        className={clsx(
          "flex h-8 w-16 items-center justify-center rounded-full transition-colors",
          active
            ? "bg-secondary-container text-on-secondary-container"
            : "text-on-surface-variant",
        )}
      >
        <Icon className="h-6 w-6" strokeWidth={active ? 2.4 : 2} />
      </span>
      <span className={active ? "text-on-surface" : "text-on-surface-variant"}>
        {item.label}
      </span>
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
      className="flex flex-1 flex-col items-center justify-center gap-1 pt-1 text-[12px] font-medium text-on-surface-variant transition-colors duration-150 active:scale-95"
    >
      <span className="flex h-8 w-16 items-center justify-center rounded-full">
        <Icon className="h-6 w-6" />
      </span>
      {label}
    </button>
  );
}
