"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { useTheme } from "@/lib/theme";
import { useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { theme, toggle: toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const isAdmin = user.role === "ADMIN";

  const navItems = [
    { href: "/calendar", label: "Calendar" },
    { href: "/my-time-off", label: "My Time Off" },
    ...(isAdmin
      ? [
          { href: "/admin", label: "Team" },
          { href: "/admin/pending", label: "Pending" },
        ]
      : []),
  ];

  return (
    <nav className="border-b border-border bg-bg-surface sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/calendar" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center">
              <span className="text-bg-primary font-bold text-sm">M</span>
            </div>
            <span className="font-bold text-text-primary tracking-tight">
              Melow
            </span>
            <span className="text-text-muted font-normal">Time Off</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  pathname === item.href
                    ? "bg-gold/10 text-gold"
                    : "text-text-muted hover:text-text-primary hover:bg-bg-hover"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <Link
              href="/request"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gold text-bg-primary text-sm font-semibold hover:bg-gold-dark transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Request Time Off
            </Link>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="w-7 h-7 rounded-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>

            {/* User avatar */}
            <div className="flex items-center gap-2">
              <Link
                href="/settings"
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-bg-primary hover:ring-2 hover:ring-gold/50 transition-all"
                style={{ backgroundColor: user.color }}
                title="Settings"
              >
                {user.name.charAt(0).toUpperCase()}
              </Link>
              <button
                onClick={logout}
                className="text-text-dim hover:text-text-muted text-xs hidden sm:block"
              >
                Log out
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-1 text-text-muted hover:text-text-primary"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {mobileOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </>
                ) : (
                  <>
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-bg-surface px-4 py-3">
          <div className="flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`px-3 py-2 rounded-md text-sm ${
                  pathname === item.href
                    ? "bg-gold/10 text-gold"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/request"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2 rounded-md text-sm text-gold font-semibold"
            >
              + Request Time Off
            </Link>
            <Link
              href="/settings"
              onClick={() => setMobileOpen(false)}
              className={`px-3 py-2 rounded-md text-sm ${
                pathname === "/settings"
                  ? "bg-gold/10 text-gold"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              Settings
            </Link>
            <button
              onClick={logout}
              className="px-3 py-2 rounded-md text-sm text-text-dim text-left hover:text-text-muted"
            >
              Log out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
