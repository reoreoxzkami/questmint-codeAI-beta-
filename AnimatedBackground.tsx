export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-background">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-blue-900/20 to-cyan-900/20 animate-gradient" />
      <div className="absolute top-0 left-1/4 w-[28rem] h-[28rem] bg-purple-500/30 rounded-full mix-blend-screen blur-3xl opacity-60 animate-blob" />
      <div className="absolute top-1/3 right-1/4 w-[28rem] h-[28rem] bg-cyan-500/25 rounded-full mix-blend-screen blur-3xl opacity-60 animate-blob animation-delay-2000" />
      <div className="absolute bottom-0 left-1/2 w-[28rem] h-[28rem] bg-pink-500/25 rounded-full mix-blend-screen blur-3xl opacity-50 animate-blob animation-delay-4000" />
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
    </div>
  )
}