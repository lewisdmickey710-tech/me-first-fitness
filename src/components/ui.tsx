import { type ReactNode } from "react";
import { phaseInfo } from "@/lib/constants";
import { makeT, type Locale } from "@/lib/i18n";

export function Heart({ className = "" }: { className?: string }) {
  return <span className={`text-rose ${className}`}>♥</span>;
}

export function Collapsible({
  label,
  children,
  className = "",
  defaultOpen = false,
  labelClassName = "text-sm font-medium text-rose",
}: {
  label: ReactNode;
  children: ReactNode;
  className?: string;
  defaultOpen?: boolean;
  labelClassName?: string;
}) {
  return (
    <details className={`group ${className}`} open={defaultOpen}>
      <summary className={`cursor-pointer list-none ${labelClassName}`}>
        <span className="inline-flex items-center gap-1">
          {label}
          <span className="text-xs transition-transform group-open:rotate-180">
            ▾
          </span>
        </span>
      </summary>
      <div className="mt-2">{children}</div>
    </details>
  );
}

export function Sparkline({
  values,
  color = "#E75480",
}: {
  values: number[];
  color?: string;
}) {
  if (values.length < 2) return null;
  const w = 280;
  const h = 56;
  const pad = 6;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values
    .map((v, i) => {
      const x = pad + (i * (w - pad * 2)) / (values.length - 1);
      const y = h - pad - ((v - min) / range) * (h - pad * 2);
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-14 w-full">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// A compact circular progress indicator for a "goal so far" number (e.g.
// sessions this week) -- meant to read at a glance without a sentence of
// explanation, unlike a plain "3/5" stat line. Passing overflowPercent
// draws a second, smaller ring nested inside the first -- for a goal
// that's already full but still has more to show (e.g. logging a snack
// beyond the day's meal goal), rather than just capping the outer ring.
export function ProgressRing({
  percent,
  label,
  sublabel,
  color = "#E75480",
  overflowPercent,
  overflowColor = "#D4A24C",
}: {
  percent: number;
  label: string;
  sublabel: string;
  color?: string;
  overflowPercent?: number;
  overflowColor?: string;
}) {
  const size = 72;
  const stroke = 7;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = circumference * (1 - clamped / 100);

  const hasOverflow = overflowPercent != null && overflowPercent > 0;
  const innerStroke = stroke - 2;
  const innerRadius = radius - stroke;
  const innerCircumference = 2 * Math.PI * innerRadius;
  const clampedOverflow = Math.max(0, Math.min(100, overflowPercent ?? 0));
  const innerOffset = innerCircumference * (1 - clampedOverflow / 100);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#EFEAE6"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
        {hasOverflow ? (
          <>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={innerRadius}
              fill="none"
              stroke="#EFEAE6"
              strokeWidth={innerStroke}
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={innerRadius}
              fill="none"
              stroke={overflowColor}
              strokeWidth={innerStroke}
              strokeDasharray={innerCircumference}
              strokeDashoffset={innerOffset}
              strokeLinecap="round"
            />
          </>
        ) : null}
      </svg>
      <div className="text-center leading-tight">
        <p className="text-sm font-semibold text-ink">{label}</p>
        <p className="text-[11px] text-gray">{sublabel}</p>
      </div>
    </div>
  );
}

export function DeltaField({
  label,
  value,
  previous,
  unit,
}: {
  label: string;
  value: number | null;
  previous: number | null;
  unit: string;
}) {
  if (value == null) return null;
  const delta = previous != null ? value - previous : null;
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-gray/70">
        {label}
      </dt>
      <dd className="text-ink">
        {value} {unit}
        {delta != null && delta !== 0 ? (
          <span className="ml-1 text-xs text-gray">
            ({delta > 0 ? "+" : ""}
            {delta})
          </span>
        ) : null}
      </dd>
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-grayLt bg-pink/10 p-5 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function PhaseBanner({
  phase,
  title,
  subtitle,
  locale,
}: {
  phase: string;
  title: string;
  subtitle?: string;
  locale?: Locale;
}) {
  const { color, name } = phaseInfo(phase);
  const t = makeT(locale);
  return (
    <div
      className="rounded-2xl px-5 py-4 text-white shadow-sm"
      style={{ backgroundColor: color }}
    >
      <p className="text-xs font-medium uppercase tracking-wide opacity-90">
        {t(name)}
      </p>
      <h2 className="text-lg font-semibold">
        <Heart className="mr-1 text-white/80" />
        {title}
      </h2>
      {subtitle ? <p className="mt-1 text-sm opacity-90">{subtitle}</p> : null}
    </div>
  );
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const styles: Record<string, string> = {
    primary: "bg-rose text-white hover:opacity-90",
    secondary: "bg-white text-ink border border-grayLt hover:bg-bg",
    ghost: "text-gray hover:text-ink",
    danger: "bg-white text-pink border border-pink/40 hover:bg-pink/5",
  };
  return (
    <button
      className={`rounded-xl px-4 py-2 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-grayLt bg-white px-3 py-2 text-sm text-ink placeholder:text-gray/60 focus:border-rose focus:outline-none focus:ring-1 focus:ring-rose ${props.className ?? ""}`}
    />
  );
}

export function Textarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>
) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-xl border border-grayLt bg-white px-3 py-2 text-sm text-ink placeholder:text-gray/60 focus:border-rose focus:outline-none focus:ring-1 focus:ring-rose ${props.className ?? ""}`}
    />
  );
}

export function Select({
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-xl border border-grayLt bg-white px-3 py-2 text-sm text-ink focus:border-rose focus:outline-none focus:ring-1 focus:ring-rose ${props.className ?? ""}`}
    >
      {children}
    </select>
  );
}

export function StarRatingInput({
  name,
  defaultValue,
  form,
}: {
  name: string;
  defaultValue?: number;
  form?: string;
}) {
  return (
    <div className="flex gap-3">
      {[1, 2, 3, 4, 5].map((n) => (
        <label
          key={n}
          className="flex cursor-pointer flex-col items-center gap-0.5"
        >
          <input
            type="radio"
            name={name}
            value={n}
            required
            form={form}
            defaultChecked={defaultValue === n}
            className="peer sr-only"
          />
          <span className="text-2xl text-grayLt peer-checked:text-gold">
            ★
          </span>
          <span className="text-xs text-gray peer-checked:text-ink">{n}</span>
        </label>
      ))}
    </div>
  );
}

export function Checkbox({
  label,
  name,
  value,
  defaultChecked,
  required,
}: {
  label: string;
  name: string;
  value?: string;
  defaultChecked?: boolean;
  required?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-ink">
      <input
        type="checkbox"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        required={required}
        className="h-4 w-4 rounded border-grayLt text-rose focus:ring-1 focus:ring-rose"
      />
      {label}
    </label>
  );
}

export function Badge({
  children,
  tone = "rose",
}: {
  children: ReactNode;
  tone?: "rose" | "teal" | "pink" | "green" | "gold" | "gray" | "purple";
}) {
  const tones: Record<string, string> = {
    rose: "bg-rose/10 text-rose",
    teal: "bg-teal/10 text-teal",
    pink: "bg-pink/10 text-pink",
    green: "bg-green/10 text-green",
    gold: "bg-gold/10 text-gold",
    gray: "bg-grayLt/60 text-gray",
    purple: "bg-purple/10 text-purple",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

function renderInline(line: string, keyPrefix: string) {
  const parts = line.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={`${keyPrefix}-${i}`}>{part.slice(2, -2)}</strong>
    ) : (
      <span key={`${keyPrefix}-${i}`}>{part}</span>
    )
  );
}

// Renders legal-document bodies written with a light markup convention:
// blank-line-separated blocks, "## " for a section heading, "- " for a
// bullet list (a block where every line starts with "- "), "**text**" for
// inline bold. Deliberately not full markdown -- just enough structure so a
// contract typed into a plain textarea still reads like a real document.
export function DocumentBody({ text }: { text: string }) {
  const blocks = text.trim().split(/\n\s*\n/);

  return (
    <div className="space-y-3 text-sm text-ink">
      {blocks.map((block, i) => {
        const lines = block.split("\n").filter((l) => l.trim() !== "");
        if (lines.length === 0) return null;

        if (lines[0].startsWith("## ")) {
          return (
            <p key={i} className="pt-2 font-semibold text-ink first:pt-0">
              {renderInline(lines[0].slice(3), `${i}-h`)}
            </p>
          );
        }

        if (lines.every((l) => l.startsWith("- "))) {
          return (
            <ul key={i} className="list-disc space-y-1 pl-5">
              {lines.map((l, j) => (
                <li key={j}>{renderInline(l.slice(2), `${i}-${j}`)}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={i} className="whitespace-pre-wrap">
            {lines.map((l, j) => (
              <span key={j}>
                {renderInline(l, `${i}-${j}`)}
                {j < lines.length - 1 ? <br /> : null}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

export function EmptyState({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-grayLt bg-pink/5 px-5 py-8 text-center">
      <Heart className="mb-2 inline-block text-lg" />
      <p className="font-medium text-ink">{title}</p>
      <p className="mt-1 text-sm text-gray">{body}</p>
    </div>
  );
}
