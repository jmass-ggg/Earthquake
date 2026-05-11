import { createFileRoute, useNavigate, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { isLoggedIn } from "@/lib/auth";
import { respondToEmergency } from "@/lib/api";
import {
  startEmergencyAlarm,
  stopEmergencyAlarm,
  retryAlarmAfterTap,
  getStoredEmergency,
  clearStoredEmergency,
  getCurrentPosition,
} from "@/services/emergencyAlarm";
import type { AlertPayload } from "@/services/alertSocket";

export const Route = createFileRoute("/emergency")({
  component: EmergencyPage,
  head: () => ({
    meta: [{ title: "Emergency — QuakeGuard" }],
  }),
});

function EmergencyPage() {
  const navigate = useNavigate();
  const [alert, setAlert] = useState<AlertPayload | null>(null);
  const [needsTap, setNeedsTap] = useState(false);
  const [busy, setBusy] = useState<null | "SAFE" | "NEED_HELP">(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = getStoredEmergency();
    if (!stored) return;
    setAlert(stored);
    (async () => {
      const ok = await startEmergencyAlarm(stored);
      if (!ok) setNeedsTap(true);
    })();
    return () => {
      // do not stop alarm on unmount — only stops on successful response
    };
  }, []);

  if (!isLoggedIn()) return <Navigate to="/login" />;
  if (!alert) return <Navigate to="/dashboard" />;

  async function startAlarmTap() {
    const ok = await retryAlarmAfterTap();
    if (ok) setNeedsTap(false);
  }

  async function handleRespond(response: "SAFE" | "NEED_HELP") {
    if (!alert) return;
    setBusy(response);
    setError(null);
    try {
      const { latitude, longitude } = await getCurrentPosition();
      await respondToEmergency({
        alert_id: alert.alert_id,
        response,
        latitude,
        longitude,
      });
      stopEmergencyAlarm();
      clearStoredEmergency();
      navigate({ to: "/dashboard" });
    } catch (e: any) {
      setError(e?.message || "Failed to send response");
      setBusy(null);
    }
  }

  return (
    <div className="min-h-screen bg-red-700 text-white flex flex-col items-center justify-between px-5 py-8">
      <div className="w-full max-w-md text-center mt-4 animate-pulse">
        <div className="text-6xl">🚨</div>
        <h1 className="text-3xl font-extrabold mt-2">Emergency Alert</h1>
      </div>

      <div className="w-full max-w-md bg-red-800/60 rounded-2xl p-5 my-6 space-y-3 border border-red-400/40">
        <h2 className="text-2xl font-bold">{alert.title || "Earthquake Alert"}</h2>
        <p className="text-base">{alert.message}</p>
        <div className="grid grid-cols-2 gap-3 pt-2">
          {alert.magnitude !== undefined && (
            <Stat label="Magnitude" value={String(alert.magnitude)} />
          )}
          {alert.risk_level && <Stat label="Risk Level" value={alert.risk_level} />}
        </div>
        <p className="text-sm text-red-100 pt-2">
          Please respond immediately. Alarm will continue until you respond.
        </p>
      </div>

      <div className="w-full max-w-md space-y-3">
        {needsTap && (
          <button
            onClick={startAlarmTap}
            className="w-full rounded-xl bg-white text-red-700 py-4 text-lg font-bold"
          >
            Tap to Start Alarm
          </button>
        )}

        <button
          onClick={() => handleRespond("SAFE")}
          disabled={busy !== null}
          className="w-full rounded-xl bg-green-500 text-white py-4 text-lg font-bold disabled:opacity-60"
        >
          {busy === "SAFE" ? "Sending..." : "I Am Safe"}
        </button>
        <button
          onClick={() => handleRespond("NEED_HELP")}
          disabled={busy !== null}
          className="w-full rounded-xl bg-zinc-900 text-white py-4 text-lg font-bold disabled:opacity-60"
        >
          {busy === "NEED_HELP" ? "Sending..." : "Need Help"}
        </button>
        {error && (
          <div className="text-sm bg-white/10 rounded-md p-2 text-white">{error}</div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-red-900/40 rounded-lg p-3">
      <div className="text-xs uppercase tracking-wide text-red-100">{label}</div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
}
