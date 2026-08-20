"use client";

export type Period = "week" | "month" | "year";

const PERIODS: { value: Period; label: string }[] = [
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "year", label: "This Year" },
];

interface PeriodFilterProps {
  selected: Period;
  onSelect: (period: Period) => void;
}

export function PeriodFilter({ selected, onSelect }: PeriodFilterProps) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-xl bg-white/5 border border-white/10 p-1.5 backdrop-blur-sm">
      {PERIODS.map((p) => {
        const isActive = selected === p.value;

        return (
          <button
            key={p.value}
            onClick={() => onSelect(p.value)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
              isActive
                ? "bg-gradient-to-r from-purple-500/30 to-blue-500/30 border border-purple-400/20 text-purple-300 shadow-[0_0_12px_rgba(139,92,246,0.15)]"
                : "border border-transparent text-muted-foreground hover:text-foreground/80 hover:bg-white/5"
            }`}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
