"use client";

import { RiskCalculator } from "@/components/RiskCalculator";

export default function Home() {
  return (
    <main className="min-h-screen relative overflow-hidden bg-black text-white px-4 md:px-8 py-12 md:py-24">
      {/* Background Layer Isolated for GPU Masking */}
      {/* Increased opacity so dots are much more visible */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-dot-wave opacity-100" />

      <div className="max-w-7xl mx-auto z-10 relative flex flex-col items-center">
        {/* Header */}
        <header className="mb-12 flex flex-col items-center text-center tracking-tight">
          <div className="inline-block px-4 py-2 border border-white/20 mb-6 bg-black z-10">
            <span className="text-[10px] md:text-xs font-bold tracking-widest text-white/70 font-mono">
              SYS.01 // READY
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-widest mb-4 z-10 drop-shadow-lg uppercase">
            LUCENT
          </h1>
          <p className="text-gray-400 text-xs md:text-sm max-w-md font-medium px-4 z-10 leading-relaxed">
            전체 시드 대비 목표 손실률을 기반으로<br />최적화된 포지션 규모와 추천 레버리지를 계산합니다.
          </p>
        </header>

        {/* Calculator Widget */}
        <div className="w-full z-10">
          <RiskCalculator />
        </div>

        {/* Footer */}
        <footer className="mt-20 text-center flex flex-col items-center justify-center gap-2 z-10">
          <div className="w-16 h-px bg-white/20"></div>
          <div className="text-[10px] text-gray-400 font-bold tracking-widest mt-4">
            LOCAL SECURE MODE
          </div>
        </footer>
      </div>
    </main>
  );
}
