"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Menu, Moon, Sun, LogOut, ChevronDown, Bell, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAdminPageInfo } from "@/lib/admin-navigation";
import { useEffect, useRef, useState } from "react";

type SessionUser = {
  id: number;
  username: string;
  email: string;
  role?: string;
};

type AdminTopbarProps = {
  onMenuClick: () => void;
  showMenuOnDesktop?: boolean;
};

export function AdminTopbar({ onMenuClick, showMenuOnDesktop }: AdminTopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pageInfo = getAdminPageInfo(pathname);

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
  const isSuperadmin = user?.role === "superadmin";

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-xl border-b border-border/50">
      <div className="flex items-center justify-between gap-4 px-5 sm:px-7 h-16">

        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={onMenuClick}
            className={cn(
              "p-2 rounded-xl hover:bg-muted/80 transition-all text-muted-foreground hover:text-foreground",
              showMenuOnDesktop ? "" : "lg:hidden"
            )}
          >
            <Menu size={18} />
          </button>

          <div className="min-w-0">
            <h1 className="text-base font-semibold text-foreground truncate tracking-tight">
              {pageInfo.title}
            </h1>
            {pageInfo.subtitle && (
              <p className="text-[11px] text-muted-foreground truncate leading-tight hidden sm:block">
                {pageInfo.subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button className="hidden md:flex p-2 rounded-xl hover:bg-muted/80 transition-all text-muted-foreground hover:text-foreground">
            <Search size={17} />
          </button>

          <button className="relative p-2 rounded-xl hover:bg-muted/80 transition-all text-muted-foreground hover:text-foreground">
            <Bell size={17} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 border border-background" />
          </button>

          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-xl hover:bg-muted/80 transition-all text-muted-foreground hover:text-foreground"
          >
            {mounted ? (
              theme === "dark"
                ? <Sun size={17} className="text-amber-400" />
                : <Moon size={17} />
            ) : (
              <Moon size={17} />
            )}
          </button>

          <div className="hidden sm:block w-px h-7 bg-border/60 mx-1" />

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-muted/80 transition-all"
            >
              <div className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white text-[11px] font-bold shadow-sm",
                isSuperadmin
                  ? "bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/20"
                  : "bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/20"
              )}>
                {initials}
              </div>
              <div className="hidden sm:flex flex-col items-start leading-tight">
                <span className="text-[13px] font-semibold text-foreground leading-none">
                  {user?.username ?? "..."}
                </span>
                <span className={cn(
                  "text-[10px] font-semibold leading-none mt-0.5",
                  isSuperadmin ? "text-amber-500" : "text-blue-500"
                )}>
                  {isSuperadmin ? "Superadmin" : "Admin"}
                </span>
              </div>
              <ChevronDown size={13} className={cn(
                "hidden sm:block text-muted-foreground transition-transform duration-200",
                dropdownOpen && "rotate-180"
              )} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/30 py-1.5 animate-fade-in overflow-hidden">
                <div className="px-4 py-3 border-b border-border/60">
                  <p className="text-sm font-semibold text-foreground">{user?.username}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{user?.email}</p>
                </div>
                <div className="p-1.5">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-colors"
                  >
                    <LogOut size={15} />
                    Keluar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
