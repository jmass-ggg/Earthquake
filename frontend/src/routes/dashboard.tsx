import { createFileRoute, useNavigate, Navigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { getCurrentUser, isLoggedIn, logout } from "@/lib/auth";
import { enableEmergencyNotifications } from "@/services/pushNotifications";
import { connectAlertSocket, type AlertPayload, type SocketStatus } from "@/services/alertSocket";
import { WS_URL, respondToEmergency } from "@/lib/api";
import {
  storeEmergency,
  getStoredEmergency,
  getCurrentPosition,
  clearStoredEmergency,
} from "@/services/emergencyAlarm";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "Dashboard — QuakeGuard" },
      { name: "description", content: "QuakeGuard dashboard." },
    ],
  }),
});

function Dashboard() {
  const navigate = useNavigate();
  const [user] = useState(() => getCurrentUser());
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default",
  );
  const [notifMsg, setNotifMsg] = useState<string | null>(null);
  const [wsStatus, setWsStatus] = useState<SocketStatus>("reconnecting");
  const [busy, setBusy] = useState<null | "SAFE" | "NEED_HELP">(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!isLoggedIn()) return;
    // Resume emergency on load
    if (getStoredEmergency()) {
      navigate({ to: "/emergency" });
      return;
    }

    cleanupRef.current = connectAlertSocket(
      WS_URL,
      (alert: AlertPayload) => {
        storeEmergency(alert);
        navigate({ to: "/emergency" });
      },
      setWsStatus,
    );
    return () => cleanupRef.current?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isLoggedIn()) return <Navigate to="/login" />;

  async function handleEnableNotifications() {
    setNotifMsg(null);
    const res = await enableEmergencyNotifications();
    setNotifPermission(res.permission);
    setNotifMsg(res.message);
  }

  async function handleRespond(response: "SAFE" | "NEED_HELP") {
    setActionMsg(null);
    setBusy(response);
    try {
      const stored = getStoredEmergency();
      const { latitude, longitude } = await getCurrentPosition();
      await respondToEmergency({
        alert_id: stored?.alert_id ?? null,
        response,
        latitude,
        longitude,
      });
      clearStoredEmergency();
      setActionMsg(
        response === "SAFE" ? "Marked as safe." : "Emergency help request sent.",
      );
    } catch (e: any) {
      setActionMsg(e?.message || "Failed to send response");
    } finally {
      setBusy(null);
    }
  }

  const wsLabel =
    wsStatus === "connected" ? "Connected" : wsStatus === "reconnecting" ? "Reconnecting..." : "Disconnected";
  const wsColor =
    wsStatus === "connected" ? "bg-green-500" : wsStatus === "reconnecting" ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className="min-h-screen bg-secondary px-4 py-6">
      <div className="max-w-md mx-auto space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">🛡️ QuakeGuard</h1>
            <p className="text-xs text-muted-foreground">Stay alert. Stay safe.</p>
          </div>
          <button
            onClick={() => {
              logout();
              navigate({ to: "/login" });
            }}
            className="text-sm text-muted-foreground underline"
          >
            Logout
          </button>
        </header>

        <Card title="User">
          <div className="text-sm">Phone: <span className="font-medium">{user?.phone_number}</span></div>
          <div className="text-sm">Status: {user?.is_verified ? "✅ Verified" : "Unverified"}</div>
        </Card>

        <Card title="Notification Status">
          <div className="text-sm mb-3">
            Permission:{" "}
            <span className="font-medium">
              {notifPermission === "granted" ? "Granted" : notifPermission === "denied" ? "Denied" : "Not set"}
            </span>
          </div>
          <button
            onClick={handleEnableNotifications}
            className="w-full rounded-lg bg-primary text-primary-foreground py-3 font-semibold"
          >
            Enable Emergency Notifications
          </button>
          {notifPermission === "denied" && (
            <p className="text-xs text-red-700 mt-2">
              Permission was denied. Enable notifications in your browser settings.
            </p>
          )}
          {notifMsg && <p className="text-xs text-muted-foreground mt-2">{notifMsg}</p>}
        </Card>

        <Card title="Alert Connection">
          <div className="flex items-center gap-2 text-sm">
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${wsColor}`} />
            <span>{wsLabel}</span>
          </div>
        </Card>

        <Card title="Emergency">
          <div className="text-sm text-muted-foreground mb-3">
            {getStoredEmergency()
              ? "Active alert detected."
              : "No active alert. Buttons send a manual response."}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleRespond("SAFE")}
              disabled={busy !== null}
              className="rounded-lg bg-green-600 text-white py-3 font-semibold disabled:opacity-60"
            >
              {busy === "SAFE" ? "Sending..." : "I Am Safe"}
            </button>
            <button
              onClick={() => handleRespond("NEED_HELP")}
              disabled={busy !== null}
              className="rounded-lg bg-zinc-900 text-white py-3 font-semibold disabled:opacity-60"
            >
              {busy === "NEED_HELP" ? "Sending..." : "I Need Help"}
            </button>
          </div>
          {actionMsg && <p className="text-xs mt-2 text-muted-foreground">{actionMsg}</p>}
        </Card>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-card rounded-2xl shadow-sm border p-4">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        {title}
      </h2>
      {children}
    </section>
  );
}
