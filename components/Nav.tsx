"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  Home,
  Users,
  Plus,
  Share2,
  User,
  HeartPulse,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  manageOnly?: boolean; // visible to admin + manager
}

const ITEMS: NavItem[] = [
  { href: "/", label: "Lịch sử khám", icon: Home },
  { href: "/profiles", label: "Thành viên", icon: Users, manageOnly: true },
  { href: "/visit/new", label: "Thêm", icon: Plus, manageOnly: true },
  { href: "/share", label: "Chia sẻ", icon: Share2, manageOnly: true },
  { href: "/account", label: "Tài khoản", icon: User },
];

const ADD_HREF = "/visit/new";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function Nav({ canManage }: { canManage: boolean }) {
  const pathname = usePathname();
  const items = ITEMS.filter((i) => !i.manageOnly || canManage);

  // On mobile, the "Thêm" action becomes a raised center FAB; the rest split
  // around it.
  const fab = items.find((i) => i.href === ADD_HREF);
  const barItems = items.filter((i) => i.href !== ADD_HREF);
  const half = Math.ceil(barItems.length / 2);
  const left = fab ? barItems.slice(0, half) : barItems;
  const right = fab ? barItems.slice(half) : [];

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-gray-200/70 bg-white/80 px-3 py-6 backdrop-blur md:flex">
        <div className="mb-8 flex items-center gap-2.5 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-fab">
            <HeartPulse className="h-5 w-5" />
          </div>
          <span className="text-[15px] font-bold tracking-tight">
            Hồ sơ sức khỏe
          </span>
        </div>
        <nav className="flex flex-col gap-1">
          {items.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            const isAdd = item.href === ADD_HREF;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 active:scale-[0.98]",
                  isAdd && !active
                    ? "bg-brand-50 text-brand-700 hover:bg-brand-100"
                    : active
                      ? "bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex h-16 items-stretch border-t border-gray-200/70 bg-white/90 backdrop-blur md:hidden">
        <div className="flex flex-1 items-stretch justify-around">
          {left.map((item) => (
            <BottomItem key={item.href} item={item} active={isActive(pathname, item.href)} />
          ))}
        </div>

        {fab && (
          <Link
            href={fab.href}
            aria-label={fab.label}
            className="absolute -top-5 left-1/2 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-fab ring-4 ring-[#f7f7fb] transition-transform duration-150 active:scale-90"
          >
            <Plus className="h-7 w-7" />
          </Link>
        )}

        {fab && (
          <div className="flex flex-1 items-stretch justify-around">
            {right.map((item) => (
              <BottomItem
                key={item.href}
                item={item}
                active={isActive(pathname, item.href)}
              />
            ))}
          </div>
        )}
      </nav>
    </>
  );
}

function BottomItem({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={clsx(
        "flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors duration-150 active:scale-90",
        active ? "text-brand-600" : "text-gray-400 hover:text-gray-600",
      )}
    >
      <span
        className={clsx(
          "flex h-7 w-7 items-center justify-center rounded-full transition-colors",
          active && "bg-brand-50",
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      {item.label}
    </Link>
  );
}
