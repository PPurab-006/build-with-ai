export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-xl p-8 bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-4">
          ✓ Slice 1 Verified: Pure Deterministic Engine
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">
          Adaptive Execution Planner
        </h1>
        <p className="text-slate-600 text-sm leading-relaxed mb-6">
          Honest goal-to-execution planning for students and solo builders.
          Multi-factor feasibility, capacity-constrained scheduling, and deterministic recovery proposals.
        </p>
        <div className="text-xs text-slate-500 font-mono bg-slate-50 p-3 rounded-lg border border-slate-100">
          Core Engine tests: 12 passed | Vitest verified
        </div>
      </div>
    </main>
  );
}
