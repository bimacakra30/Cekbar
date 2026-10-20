"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Menu, Moon, Sun, LogOut, ChevronDown, Bell, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPageInfo } from "@/lib/navigation";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type SessionUser = {
  id: number;
  username: string;
  email: string;
};

type TopbarProps = {
  onMenuClick: () => void;
  showMenuOnDesktop?: boolean;
};

export function Topbar({ onMenuClick, showMenuOnDesktop }: TopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pageInfo = getPageInfo(pathname);

  useEffect(() => {
    setMounted(true);
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => { if (data.user) setUser(data.user); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = user?.username?.slice(0, 2).toUpperCase() ?? "??";

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 h-16 bg-background/95 backdrop-blur-md border-b border-border">

      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className={cn(
            "p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground",
            showMenuOnDesktop ? "" : "lg:hidden"
          )}
          aria-label="Toggle menu"
        >
          <Menu size={19} />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5 hidden sm:flex">
            <span>Cekbar</span>
            <span>/</span>
            <span className="text-foreground font-medium">{pageInfo.title}</span>
          </div>
          <h1 className="text-base sm:text-lg font-bold text-foreground truncate leading-tight">
            {pageInfo.title}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">

        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Toggle dark mode"
        >
          {mounted ? (
            theme === "dark" ? (
              <Sun size={17} className="text-amber-400" />
            ) : (
              <Moon size={17} />
            )
          ) : (
            <Moon size={17} />
          )}
        </button>

        <div className="h-6 w-px bg-border hidden sm:block" />

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-muted transition-colors"
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-sm"
              style={{ background: "linear-gradient(135deg, #3b82f6, #1d4ed8)" }}
            >
              <span suppressHydrationWarning>{initials}</span>
            </div>

            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-foreground leading-tight" suppressHydrationWarning>
                {user?.username ?? "..."}
              </p>
              <p className="text-[11px] text-muted-foreground leading-tight" suppressHydrationWarning>
                {user?.email ?? ""}
              </p>
            </div>

            <ChevronDown
              size={13}
              className={cn(
                "hidden sm:block text-muted-foreground transition-transform duration-200",
                dropdownOpen && "rotate-180"
              )}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-card border border-border rounded-2xl shadow-xl shadow-black/10 py-2 animate-fade-in overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ background: "linear-gradient(135deg, #3b82f6, #1d4ed8)" }}
                  >
                    <span suppressHydrationWarning>{initials}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate" suppressHydrationWarning>
                      {user?.username}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate" suppressHydrationWarning>
                      {user?.email}
                    </p>
                  </div>
                </div>
              </div>

              <div className="py-1 px-1.5">
                <Link
                  href="/profil"
                  onClick={() => setDropdownOpen(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-foreground hover:bg-muted rounded-xl transition-colors"
                >
                  <User size={15} />
                  Profil Saya
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors"
                >
                  <LogOut size={15} />
                  Keluar dari akun
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
