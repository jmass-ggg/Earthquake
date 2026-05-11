import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { requestOtp, verifyOtp } from "@/lib/api";
import { saveAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Login — QuakeGuard" },
      { name: "description", content: "Login to QuakeGuard disaster alert app." },
    ],
  }),
});

const IS_DEV = import.meta.env.DEV;

function LoginPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleRequestOtp(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setInfo(null);
    if (!phone.trim()) return setError("Enter your phone number");
    setLoading(true);
    try {
      const res = await requestOtp(phone.trim());
      setStep("otp");
      setInfo("OTP has been sent to your phone number.");
      if (IS_DEV && res.dev_otp) setDevOtp(res.dev_otp);
    } catch (err: any) {
      setError(err?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    if (!otp.trim()) return setError("Enter the OTP");
    setLoading(true);
    try {
      const res = await verifyOtp(phone.trim(), otp.trim(), "web-browser");
      saveAuth(res);
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      setError(err?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-gradient-to-b from-background to-secondary">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-xl p-6 sm:p-8 border">
        <div className="text-center mb-6">
          <div className="text-3xl">🛡️</div>
          <h1 className="text-2xl font-bold mt-2">QuakeGuard</h1>
          <p className="text-sm text-muted-foreground">Disaster Alert & Emergency Response</p>
        </div>

        {step === "phone" && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium">Phone number</span>
              <input
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9800000000"
                className="mt-1 w-full rounded-lg border bg-background px-3 py-3 text-base outline-none focus:ring-2 focus:ring-primary"
                disabled={loading}
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary text-primary-foreground py-3 font-semibold disabled:opacity-60"
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Sent to <span className="font-medium text-foreground">{phone}</span>{" "}
              <button
                type="button"
                onClick={() => {
                  setStep("phone");
                  setOtp("");
                  setDevOtp(null);
                  setInfo(null);
                }}
                className="ml-1 text-primary underline"
              >
                Change
              </button>
            </div>

            {info && <div className="text-sm text-green-700 bg-green-50 rounded-md p-2">{info}</div>}
            {IS_DEV && devOtp && (
              <div className="text-sm bg-yellow-50 text-yellow-800 rounded-md p-2 border border-yellow-200">
                Development OTP: <span className="font-mono font-bold">{devOtp}</span>
              </div>
            )}

            <label className="block">
              <span className="text-sm font-medium">Enter OTP</span>
              <input
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                maxLength={8}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-3 text-base tracking-widest text-center outline-none focus:ring-2 focus:ring-primary"
                disabled={loading}
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary text-primary-foreground py-3 font-semibold disabled:opacity-60"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>

            <button
              type="button"
              onClick={() => handleRequestOtp()}
              disabled={loading}
              className="w-full rounded-lg border py-3 font-medium"
            >
              Resend OTP
            </button>
          </form>
        )}

        {error && (
          <div className="mt-4 text-sm bg-red-50 text-red-700 border border-red-200 rounded-md p-2">
            {error}
          </div>
        )}

        <div className="text-center text-xs text-muted-foreground mt-6">
          <Link to="/">Back to home</Link>
        </div>
      </div>
    </div>
  );
}
