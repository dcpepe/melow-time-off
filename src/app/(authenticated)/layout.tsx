"use client";

import AuthProvider from "@/components/AuthProvider";
import Navbar from "@/components/Navbar";
import ToastContainer from "@/components/Toast";
import { useAuthStore } from "@/lib/store";

function AuthGate({ children }: { children: React.ReactNode }) {
  const loading = useAuthStore((s) => s.loading);
  const user = useAuthStore((s) => s.user);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center animate-pulse">
          <span className="text-bg-primary font-bold text-sm">M</span>
        </div>
      </div>
    );
  }

  if (!user) {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    return null;
  }

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">{children}</main>
    </>
  );
}

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <ToastContainer />
      <AuthGate>{children}</AuthGate>
    </AuthProvider>
  );
}
