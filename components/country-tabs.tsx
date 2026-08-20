"use client";

const COUNTRY_FLAGS: Record<string, string> = {
  Romania: "\u{1F1F7}\u{1F1F4}",
  Ukraine: "\u{1F1FA}\u{1F1E6}",
  India: "\u{1F1EE}\u{1F1F3}",
  "United Kingdom": "\u{1F1EC}\u{1F1E7}",
  "Sri Lanka": "\u{1F1F1}\u{1F1F0}",
  "United States": "\u{1F1FA}\u{1F1F8}",
};

const SHORT_NAMES: Record<string, string> = {
  "United Kingdom": "UK",
  "Sri Lanka": "Sri Lanka",
  "United States": "US",
};

interface CountryTabsProps {
  countries: string[];
  selected: string;
  onSelect: (country: string) => void;
}

export function CountryTabs({ countries, selected, onSelect }: CountryTabsProps) {
  const allItems = ["All", ...countries];

  return (
    <div className="flex flex-wrap justify-center items-center gap-1.5 rounded-xl bg-white/5 border border-white/10 p-1.5 backdrop-blur-sm">
      {allItems.map((c) => {
        const isActive = selected === c;
        const flag = c === "All" ? "\u{1F30D}" : COUNTRY_FLAGS[c] || "";
        const label = c === "All" ? "All" : SHORT_NAMES[c] || c;

        return (
          <button
            key={c}
            onClick={() => onSelect(c)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
              isActive
                ? "bg-gradient-to-r from-purple-500/30 to-blue-500/30 border border-purple-400/20 text-purple-300 shadow-[0_0_12px_rgba(139,92,246,0.15)]"
                : "border border-transparent text-muted-foreground hover:text-foreground/80 hover:bg-white/5"
            }`}
          >
            <span className="text-base leading-none">{flag}</span>
            {label}
          </button>
        );
      })}
    </div>
  );
}
