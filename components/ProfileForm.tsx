"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

function generateNtfyTopic(): string {
  const bytes = new Uint8Array(9);
  crypto.getRandomValues(bytes);
  const base64url = btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `duenext-${base64url}`;
}

export interface ProfileFormValues {
  name: string;
  ntfyServerUrl: string;
  ntfyTopic: string;
  ntfyAccessToken: string;
  notifyByEmail: boolean;
  notifyByNtfy: boolean;
}

export default function ProfileForm({
  initial,
  defaultNtfyUrl,
}: {
  initial: ProfileFormValues;
  defaultNtfyUrl: string | null;
}) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [ntfyServerUrl, setNtfyServerUrl] = useState(initial.ntfyServerUrl || defaultNtfyUrl || "");
  const [ntfyTopic, setNtfyTopic] = useState(initial.ntfyTopic);
  const [ntfyAccessToken, setNtfyAccessToken] = useState(initial.ntfyAccessToken);
  const [notifyByEmail, setNotifyByEmail] = useState(initial.notifyByEmail);
  const [notifyByNtfy, setNotifyByNtfy] = useState(initial.notifyByNtfy);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [testNtfyStatus, setTestNtfyStatus] = useState<
    { type: "sending" } | { type: "success" } | { type: "error"; message: string } | null
  >(null);

  async function handleTestNtfy() {
    if (!ntfyTopic.trim()) {
      setTestNtfyStatus({ type: "error", message: "Enter a topic first" });
      return;
    }

    setTestNtfyStatus({ type: "sending" });

    try {
      const res = await fetch("/api/profile/test-ntfy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ntfyServerUrl, ntfyTopic, ntfyAccessToken }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setTestNtfyStatus({ type: "error", message: data.error ?? "Failed to send" });
        return;
      }

      setTestNtfyStatus({ type: "success" });
    } catch {
      setTestNtfyStatus({ type: "error", message: "Failed to send" });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setSubmitting(true);

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        ntfyServerUrl,
        ntfyTopic,
        ntfyAccessToken,
        notifyByEmail,
        notifyByNtfy,
        ...(newPassword ? { currentPassword, newPassword } : {}),
      }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong");
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}
      {saved && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
          Saved
        </p>
      )}

      <div>
        <label className="mb-1 block text-sm text-slate-600 dark:text-slate-400">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-950"
        />
      </div>

      <fieldset className="rounded-md border border-slate-200 p-4 dark:border-slate-800">
        <legend className="px-1 text-sm font-medium">Notifications</legend>
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={notifyByEmail}
              onChange={(e) => setNotifyByEmail(e.target.checked)}
              className="h-auto w-auto"
            />
            Email me reminders
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={notifyByNtfy}
              onChange={(e) => setNotifyByNtfy(e.target.checked)}
              className="h-auto w-auto"
            />
            Send reminders via Ntfy
          </label>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                Ntfy server URL
              </label>
              <input
                type="text"
                value={ntfyServerUrl}
                onChange={(e) => setNtfyServerUrl(e.target.value)}
                placeholder="https://ntfy.example.com"
                className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-950"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Topic</label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={ntfyTopic}
                  onChange={(e) => setNtfyTopic(e.target.value)}
                  placeholder="duenext-..."
                  className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-950"
                />
                <button
                  type="button"
                  onClick={() => setNtfyTopic(generateNtfyTopic())}
                  title="Generate a new random topic"
                  className="h-9 shrink-0 rounded-md border border-slate-300 px-2 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  New
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Anyone who knows this topic can read (and publish to) it, so keep it
                private and prefer a random one over a guessable name.
              </p>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
              Access token (optional, for protected topics)
            </label>
            <input
              type="password"
              value={ntfyAccessToken}
              onChange={(e) => setNtfyAccessToken(e.target.value)}
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-950"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleTestNtfy}
              disabled={testNtfyStatus?.type === "sending"}
              className="h-8 shrink-0 rounded-md border border-slate-300 px-3 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              {testNtfyStatus?.type === "sending" ? "Sending…" : "Send test notification"}
            </button>
            {testNtfyStatus?.type === "success" && (
              <span className="text-xs text-green-700 dark:text-green-400">
                Sent - check your device.
              </span>
            )}
            {testNtfyStatus?.type === "error" && (
              <span className="text-xs text-red-600 dark:text-red-400">
                {testNtfyStatus.message}
              </span>
            )}
          </div>
        </div>
      </fieldset>

      <fieldset className="rounded-md border border-slate-200 p-4 dark:border-slate-800">
        <legend className="px-1 text-sm font-medium">Change password</legend>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
              Current password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-950"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
              New password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-950"
            />
          </div>
        </div>
      </fieldset>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="h-9 rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
        >
          Save changes
        </button>
      </div>
    </form>
  );
}
