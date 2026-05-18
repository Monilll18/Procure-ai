import { GlassSignInCard } from "@/components/ui/glass-sign-in-card";

export default function GlassSignInCardDemo() {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-black p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute -top-40 -left-40 h-[28rem] w-[28rem] rounded-full bg-indigo-500/30 blur-[120px]" />
        <div className="absolute top-20 -right-32 h-[26rem] w-[26rem] rounded-full bg-fuchsia-500/25 blur-[120px]" />
        <div className="absolute -bottom-40 left-1/3 h-[24rem] w-[24rem] rounded-full bg-sky-500/25 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(to right, rgba(255,255,255,0.7) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
      </div>
      <GlassSignInCard />
    </div>
  );
}
