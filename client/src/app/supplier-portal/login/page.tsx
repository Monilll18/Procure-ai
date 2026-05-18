"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, Lock, Mail, ArrowRight, Loader2 } from "lucide-react";
import { supplierLogin, setSupplierToken, setStoredSupplierUser } from "@/lib/supplier-api";

export default function SupplierLoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    const make = () => ({
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
    window.addEventListener("resize", () => { setSize(); init(); });
    init();
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await supplierLogin(email.trim(), password);
      setSupplierToken(res.access_token);
      setStoredSupplierUser(res.user);
      if (res.user.must_change_password) router.push("/supplier-portal/activate?change=1");
      else router.push("/supplier-portal/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
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
        .card-animate { opacity: 0; transform: translateY(20px); animation: fadeUp 0.8s cubic-bezier(.22,.61,.36,1) 0.4s forwards; }
        @keyframes fadeUp { to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div className="absolute inset-0 pointer-events-none [background:radial-gradient(80%_60%_at_50%_30%,rgba(255,255,255,0.06),transparent_60%)]" />
      <div className="accent-lines">
        <div className="hline" /> <div className="hline" /> <div className="hline" />
        <div className="vline" /> <div className="vline" /> <div className="vline" />
      </div>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-50 mix-blend-screen pointer-events-none" />

      <header className="absolute left-0 right-0 top-0 flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 z-20">
        <span className="text-xs tracking-[0.14em] uppercase text-zinc-400 font-bold">PROCURE AI</span>
        <Button variant="outline" className="h-9 rounded-lg border-zinc-800 bg-zinc-900 text-zinc-50 hover:bg-zinc-900/80">
          <span className="mr-2">Contact</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </header>

      <div className="h-full w-full grid place-items-center px-4 relative z-10">
        <Card className="card-animate w-full max-w-sm border-zinc-800 bg-zinc-900/80 backdrop-blur-xl shadow-2xl relative z-30">
          <CardHeader className="space-y-1.5 pb-6">
            <CardTitle className="text-2xl font-bold text-zinc-50 tracking-tight">Supplier Portal</CardTitle>
            <CardDescription className="text-zinc-400 font-medium">Sign in to manage purchase orders</CardDescription>
          </CardHeader>

          <CardContent className="grid gap-6">
            <form onSubmit={handleLogin} className="grid gap-6">
              <div className="grid gap-2.5">
                <Label htmlFor="email" className="text-zinc-300 font-semibold text-xs uppercase tracking-wider ml-1">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <Input id="email" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="pl-11 bg-zinc-950 border-zinc-800 text-zinc-50 placeholder:text-zinc-700 h-11 rounded-xl focus:ring-2 focus:ring-zinc-700/50" />
                </div>
              </div>

              <div className="grid gap-2.5">
                <Label htmlFor="password" title="Password" className="text-zinc-300 font-semibold text-xs uppercase tracking-wider ml-1">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="pl-11 pr-11 bg-zinc-950 border-zinc-800 text-zinc-50 placeholder:text-zinc-700 h-11 rounded-xl" />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-zinc-500 hover:text-zinc-300" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && <div className="px-4 py-2 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium text-center">{error}</div>}

              <div className="flex items-center justify-between px-1 text-sm">
                <div className="flex items-center gap-2">
                  <Checkbox id="remember" className="border-zinc-700 data-[state=checked]:bg-zinc-50 data-[state=checked]:text-zinc-900" />
                  <Label htmlFor="remember" className="text-zinc-400">Remember me</Label>
                </div>
                <a href="/supplier-portal/reset-password" onClick={() => router.push("/supplier-portal/reset-password")} className="text-xs text-zinc-300 hover:text-zinc-50 hover:underline">Forgot password?</a>
              </div>

              <Button type="submit" disabled={loading} className="w-full h-11 rounded-xl bg-zinc-50 text-zinc-950 hover:bg-zinc-200 font-bold transition-all active:scale-[0.98]">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
              </Button>
            </form>

            <div className="relative py-2">
              <Separator className="bg-zinc-800" />
              <span className="absolute left-1/2 -translate-x-1/2 -top-1.5 bg-zinc-900 px-3 text-[10px] uppercase tracking-widest text-zinc-600 font-black">OR</span>
            </div>

            <div className="grid gap-3 pt-1">
              <a href="/supplier-portal/activate" className="text-xs font-semibold text-zinc-400 hover:text-zinc-50 flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-zinc-600" /> Activate account
              </a>
            </div>
          </CardContent>

          <CardFooter className="flex items-center justify-center text-[10px] text-zinc-600 pb-8 uppercase tracking-[0.2em] font-bold">Secure Authentication Portal</CardFooter>
        </Card>
      </div>
    </section>
  );
}
