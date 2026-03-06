interface KPICardProps {
  title: string;
  value: string;
  sub?: string;
  accent?: "amber" | "sage" | "danger" | "muted";
  icon?: string;
}

const accentStyles: Record<string, { bg: string; color: string; iconColor: string }> = {
  amber:  { bg: "var(--amber-pale)",   color: "var(--amber)",  iconColor: "var(--amber)" },
  sage:   { bg: "var(--sage-light)",   color: "var(--sage)",   iconColor: "var(--sage)" },
  danger: { bg: "var(--danger-light)", color: "var(--danger)", iconColor: "var(--danger)" },
  muted:  { bg: "var(--cream-dark)",   color: "var(--muted)",  iconColor: "var(--muted)" },
};

export function KPICard({ title, value, sub, accent = "amber", icon }: KPICardProps) {
  const s = accentStyles[accent];
  return (
    <div className="card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: "var(--muted)", fontFamily: "var(--font-body)" }}
        >
          {title}
        </span>
        {icon && (
          <span
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
            style={{ background: s.bg, color: s.iconColor }}
          >
            {icon}
          </span>
        )}
      </div>
      <div>
        <span
          className="text-3xl font-semibold leading-none"
          style={{ color: "var(--espresso)", fontFamily: "var(--font-display)" }}
        >
          {value}
        </span>
        {sub && (
          <p className="text-xs mt-1.5" style={{ color: "var(--muted)" }}>
            {sub}
          </p>
        )}
      </div>
      <div className="h-0.5 rounded-full w-8" style={{ background: s.bg }} />
    </div>
  );
}
