import { type ReactNode } from "react";
import { phaseInfo } from "@/lib/constants";

export function Heart({ className = "" }: { className?: string }) {
  return <span className={`text-rose ${className}`}>♥</span>;
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
      className={`rounded-2xl border border-grayLt bg-white p-5 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function PhaseBanner({
  phase,
  title,
  subtitle,
}: {
  phase: string;
  title: string;
  subtitle?: string;
}) {
  const { color, name } = phaseInfo(phase);
  return (
    <div
      className="rounded-2xl px-5 py-4 text-white shadow-sm"
      style={{ backgroundColor: color }}
    >
      <p className="text-xs font-medium uppercase tracking-wide opacity-90">
        {name}
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

export function Badge({
  children,
  tone = "rose",
}: {
  children: ReactNode;
  tone?: "rose" | "teal" | "pink" | "green" | "gold" | "gray";
}) {
  const tones: Record<string, string> = {
    rose: "bg-rose/10 text-rose",
    teal: "bg-teal/10 text-teal",
    pink: "bg-pink/10 text-pink",
    green: "bg-green/10 text-green",
    gold: "bg-gold/10 text-gold",
    gray: "bg-grayLt/60 text-gray",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
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
    <div className="rounded-2xl border border-dashed border-grayLt bg-white/60 px-5 py-8 text-center">
      <Heart className="mb-2 inline-block text-lg" />
      <p className="font-medium text-ink">{title}</p>
      <p className="mt-1 text-sm text-gray">{body}</p>
    </div>
  );
}
