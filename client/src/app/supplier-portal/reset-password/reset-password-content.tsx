"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Mail, ArrowRight, ArrowLeft, Loader2, CheckCircle, KeyRound, Lock } from "lucide-react";
import { toast } from "sonner";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Props {
  tokenFromUrl: string;
}

export function ResetPasswordContent({ tokenFromUrl }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<"request" | "reset">(tokenFromUrl ? "reset" : "request");
  const [email, setEmail] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [resetUrl, setResetUrl] = useState("");
  const [token, setToken] = useState(tokenFromUrl || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetting, setResetting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Particles effect
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const setSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setSize();

    type P = { x: number; y: number; v: number; o: number };
    let ps: P[] = [];
    let raf = 0;

    const make = (): P => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      v: Math.random() * 0.25 + 0.05,
      o: Math.random() * 0.35 + 0.15,
    });

    const init = () => {
      ps = [];
      const count = Math.floor((canvas.width * canvas.height) / 9000);
      for (let i = 0; i < count; i++) ps.push(make());
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ps.forEach((p) => {
        p.y -= p.v;
        if (p.y < 0) {
          p.x = Math.random() * canvas.width;
          p.y = canvas.height + Math.random() * 40;
          p.v = Math.random() * 0.25 + 0.05;
          p.o = Math.random() * 0.35 + 0.15;
        }
        ctx.fillStyle = `rgba(250,250,250,${p.o})`;
        ctx.fillRect(p.x, p.y, 0.7, 2.2);
      });
      raf = requestAnimationFrame(draw);
    };

    const onResize = () => {
      setSize();
      init();
    };

    window.addEventListener("resize", onResize);
    init();
    raf = requestAnimationFrame(draw);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
  }, []);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setRequesting(true);
    try {
      const res = await fetch(`${API_BASE}/api/supplier-auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (data.reset_url) {
        setResetUrl(data.reset_url);
        setToken(data.token);
        toast.success("Reset link generated!");
      } else {
        toast.info(data.message || "If that email exists, a reset link has been sent.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to request reset");
    } finally {
      setRequesting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast.error("Passwords do not match"); return; }
    if (newPassword.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setResetting(true);
    try {
      const res = await fetch(`${API_BASE}/api/supplier-auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: newPassword }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.detail || "Reset failed"); }
      const data = await res.json();
      if (data.access_token && data.user) {
        localStorage.setItem("supplier_token", data.access_token);
        localStorage.setItem("supplier_user", JSON.stringify(data.user));
      }
      setSuccess(true);
      toast.success("Password reset successfully!");
      setTimeout(() => router.push("/supplier-portal/dashboard"), 2000);
    } catch (err: any) {
      toast.error(err.message || "Failed to reset password");
    } finally {
      setResetting(false);
    }
  };

  return (
    <section className="fixed inset-0 bg-zinc-950 text-zinc-50 overflow-hidden">
      <style>{`
        .accent-lines{position:absolute;inset:0;pointer-events:none;opacity:.7}
        .hline,.vline{position:absolute;background:#27272a;will-change:transform,opacity}
        .hline{left:0;right:0;height:1px;transform:scaleX(0);transform-origin:50% 50%;animation:drawX .8s cubic-bezier(.22,.61,.36,1) forwards}
        .vline{top:0;bottom:0;width:1px;transform:scaleY(0);transform-origin:50% 0%;animation:drawY .9s cubic-bezier(.22,.61,.36,1) forwards}
        .hline:nth-child(1){top:18%;animation-delay:.12s}
        .hline:nth-child(2){top:50%;animation-delay:.22s}
        .hline:nth-child(3){top:82%;animation-delay:.32s}
        .vline:nth-child(4){left:22%;animation-delay:.42s}
        .vline:nth-child(5){left:50%;animation-delay:.54s}
        .vline:nth-child(6){left:78%;animation-delay:.66s}
        @keyframes drawX{0%{transform:scaleX(0);opacity:0}60%{opacity:.95}100%{transform:scaleX(1);opacity:.7}}
        @keyframes drawY{0%{transform:scaleY(0);opacity:0}60%{opacity:.95}100%{transform:scaleY(1);opacity:.7}}
        
        .card-animate {
          opacity: 0;
          transform: translateY(20px);
          animation: fadeUp 0.8s cubic-bezier(.22,.61,.36,1) 0.4s forwards;
        }
        @keyframes fadeUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* Subtle vignette */}
      <div className="absolute inset-0 pointer-events-none [background:radial-gradient(80%_60%_at_50%_30%,rgba(255,255,255,0.06),transparent_60%)]" />

      {/* Animated accent lines */}
      <div className="accent-lines">
        <div className="hline" />
        <div className="hline" />
        <div className="hline" />
        <div className="vline" />
        <div className="vline" />
        <div className="vline" />
      </div>

      {/* Particles */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full opacity-50 mix-blend-screen pointer-events-none"
      />

      {/* Header */}
      <header className="absolute left-0 right-0 top-0 flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 z-20">
        <span className="text-xs tracking-[0.14em] uppercase text-zinc-400 font-bold">
          PROCURE AI
        </span>
        <Button
          variant="outline"
          onClick={() => router.push("/supplier-portal/login")}
          className="h-9 rounded-lg border-zinc-800 bg-zinc-900 text-zinc-50 hover:bg-zinc-900/80"
        >
          <span className="mr-2">Back to Login</span>
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </header>

      {/* Centered Card */}
      <div className="h-full w-full grid place-items-center px-4 relative z-10">
        <Card className="card-animate w-full max-w-sm border-zinc-800 bg-zinc-900/80 backdrop-blur-xl shadow-2xl relative z-30">
          <CardHeader className="space-y-1.5 pb-6">
            <CardTitle className="text-2xl font-bold text-zinc-50 tracking-tight">
              {success ? "Success!" : step === "request" ? "Forgot password?" : "Reset password"}
            </CardTitle>
            <CardDescription className="text-zinc-400 font-medium">
              {success ? "Your password has been updated."
                : step === "request" ? "Enter your email and we’ll send you a reset link"
                  : "Enter your new password below"}
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-6">
            {success ? (
              <div className="text-center py-6">
                <CheckCircle className="h-16 w-16 text-zinc-50 mx-auto mb-4" />
                <p className="text-zinc-50 font-semibold">Redirecting to dashboard...</p>
              </div>
            ) : step === "request" ? (
              <form 
                onSubmit={(e) => {
                  console.log("Form submitted");
                  handleRequestReset(e);
                }} 
                className="grid gap-6"
              >
                <div className="grid gap-2.5">
                  <Label htmlFor="email" className="text-zinc-300 font-semibold text-xs uppercase tracking-wider ml-1">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-11 bg-zinc-950 border-zinc-800 text-zinc-50 placeholder:text-zinc-700 h-11 rounded-xl focus:ring-2 focus:ring-zinc-700/50 transition-all"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={requesting}
                  className="w-full h-11 rounded-xl bg-zinc-50 text-zinc-950 hover:bg-zinc-200 transition-all font-bold shadow-lg shadow-white/5 active:scale-[0.98]"
                >
                  {requesting ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-zinc-950" />
                      <span>Sending...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <span>Send reset link</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  )}
                </Button>

                {resetUrl && (
                  <div 
                    className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-3 shadow-inner"
                    style={{ animation: 'fadeUp 0.4s cubic-bezier(.22,.61,.36,1) forwards' }}
                  >
                    <p className="font-semibold text-zinc-50 text-sm flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                      Link generated!
                    </p>
                    <Button 
                      variant="outline" 
                      type="button"
                      className="w-full h-10 border-zinc-800 bg-zinc-900 text-zinc-50 hover:bg-zinc-800"
                      onClick={() => setStep("reset")}
                    >
                      <KeyRound className="mr-2 h-4 w-4" /> Reset Password Now
                    </Button>
                  </div>
                )}
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="grid gap-6">
                <div className="grid gap-2.5">
                  <Label htmlFor="new-password" title="New Password" className="text-zinc-300 font-semibold text-xs uppercase tracking-wider ml-1">
                    New Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="Min 8 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                      className="pl-11 bg-zinc-950 border-zinc-800 text-zinc-50 placeholder:text-zinc-700 h-11 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid gap-2.5">
                  <Label htmlFor="confirm-password" title="Confirm Password" className="text-zinc-300 font-semibold text-xs uppercase tracking-wider ml-1">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                      className="pl-11 bg-zinc-950 border-zinc-800 text-zinc-50 placeholder:text-zinc-700 h-11 rounded-xl"
                    />
                  </div>
                </div>

                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-500 font-bold ml-1">Passwords do not match</p>
                )}

                <Button
                  type="submit"
                  disabled={resetting || newPassword !== confirmPassword || newPassword.length < 8}
                  className="w-full h-11 rounded-xl bg-zinc-50 text-zinc-950 hover:bg-zinc-200 transition-all font-bold shadow-lg active:scale-[0.98]"
                >
                  {resetting ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-zinc-950" />
                      <span>Updating...</span>
                    </div>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </form>
            )}

            <div className="relative py-2">
              <Separator className="bg-zinc-800" />
              <span className="absolute left-1/2 -translate-x-1/2 -top-1.5 bg-zinc-900 px-3 text-[10px] uppercase tracking-widest text-zinc-600 font-black">
                OR
              </span>
            </div>

            <div className="grid gap-3 pt-1">
              <button 
                onClick={() => setStep("request")}
                className="text-xs font-semibold text-zinc-400 hover:text-zinc-50 transition-colors text-left flex items-center gap-2"
              >
                <div className="h-1 w-1 rounded-full bg-zinc-600" />
                Request new link
              </button>
              <a href="/supplier-portal/activate" className="text-xs font-semibold text-zinc-400 hover:text-zinc-50 transition-colors flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-zinc-600" />
                Activate account
              </a>
            </div>
          </CardContent>

          <CardFooter className="flex items-center justify-center text-[10px] text-zinc-600 pb-8 uppercase tracking-[0.2em] font-bold">
            Secure Authentication Portal
          </CardFooter>
        </Card>
      </div>
    </section>
  );
}
