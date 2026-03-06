"use client";

import { useState } from "react";
import { useAuthStore } from "@/lib/store";
import { showToast } from "@/components/Toast";

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [saving, setSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email) {
      showToast("Name and email are required", "error");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });

      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        showToast("Profile updated", "success");
      } else {
        showToast(data.error || "Failed to update", "error");
      }
    } catch {
      showToast("Failed to update profile", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      showToast("All password fields are required", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("New passwords don't match", "error");
      return;
    }
    if (newPassword.length < 6) {
      showToast("Password must be at least 6 characters", "error");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast("Password updated", "success");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        showToast(data.error || "Failed to update password", "error");
      }
    } catch {
      showToast("Failed to update password", "error");
    } finally {
      setSavingPassword(false);
    }
  }

  if (!user) return null;

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold tracking-tight mb-6">Settings</h1>

      {/* Profile Section */}
      <div className="bg-bg-surface border border-border rounded-lg p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-bg-primary"
            style={{ backgroundColor: user.color }}
          >
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold">{user.name}</div>
            <div className="text-sm text-text-muted">{user.email}</div>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                user.role === "ADMIN"
                  ? "bg-gold/10 text-gold"
                  : "bg-border text-text-muted"
              }`}
            >
              {user.role.toLowerCase()}
            </span>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
            Profile
          </h2>
          <div>
            <label className="block text-sm text-text-muted mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-bg-primary border border-border rounded-md text-sm text-text-primary focus:outline-none focus:border-gold/50"
            />
          </div>
          <div>
            <label className="block text-sm text-text-muted mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-bg-primary border border-border rounded-md text-sm text-text-primary focus:outline-none focus:border-gold/50"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-gold text-bg-primary rounded-md text-sm font-semibold hover:bg-gold-dark transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </div>

      {/* Password Section */}
      <div className="bg-bg-surface border border-border rounded-lg p-6">
        <form onSubmit={handleChangePassword} className="space-y-4">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
            Change Password
          </h2>
          <div>
            <label className="block text-sm text-text-muted mb-1">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 bg-bg-primary border border-border rounded-md text-sm text-text-primary focus:outline-none focus:border-gold/50"
            />
          </div>
          <div>
            <label className="block text-sm text-text-muted mb-1">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 bg-bg-primary border border-border rounded-md text-sm text-text-primary focus:outline-none focus:border-gold/50"
            />
          </div>
          <div>
            <label className="block text-sm text-text-muted mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 bg-bg-primary border border-border rounded-md text-sm text-text-primary focus:outline-none focus:border-gold/50"
            />
          </div>
          <button
            type="submit"
            disabled={savingPassword}
            className="px-4 py-2 bg-gold text-bg-primary rounded-md text-sm font-semibold hover:bg-gold-dark transition-colors disabled:opacity-50"
          >
            {savingPassword ? "Updating..." : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
