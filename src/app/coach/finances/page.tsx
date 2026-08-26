import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { updateBusinessFinanceSettings } from "@/app/coach/actions";
import { Button, Card, Heart, Input } from "@/components/ui";
import { nowInBusinessTz } from "@/lib/timezone";
import type { BusinessFinanceSettings } from "@/lib/types";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default async function FinancesPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const { year: yearParam } = await searchParams;
  const now = nowInBusinessTz();
  const currentYear = now.getUTCFullYear();
  const year =
    yearParam && /^\d{4}$/.test(yearParam) ? Number(yearParam) : currentYear;

  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;

  const supabase = await createClient();

  const [{ data: settingsRow }, { data: payments }, { data: sessions }, { data: clients }] =
    await Promise.all([
      supabase
        .from("business_finance_settings")
        .select("*")
        .eq("id", true)
        .single() as unknown as Promise<{ data: BusinessFinanceSettings | null }>,
      supabase
        .from("payments")
        .select("client_id, amount, paid_on")
        .not("paid_on", "is", null)
        .gte("paid_on", yearStart)
        .lte("paid_on", yearEnd) as unknown as Promise<{
        data: { client_id: string | null; amount: number; paid_on: string }[] | null;
      }>,
      supabase
        .from("sessions")
        .select("client_id, date")
        .gte("date", yearStart)
        .lte("date", yearEnd) as unknown as Promise<{
        data: { client_id: string; date: string }[] | null;
      }>,
      supabase
        .from("clients")
        .select("id, pro_bono, pro_bono_rate, is_test") as unknown as Promise<{
        data:
          | { id: string; pro_bono: boolean; pro_bono_rate: number | null; is_test: boolean }[]
          | null;
      }>,
    ]);

  // Test profiles' payments/sessions are excluded so QA/demo activity never
  // shows up as real income or pro bono value.
  const testClientIds = new Set(
    (clients ?? []).filter((c) => c.is_test).map((c) => c.id)
  );
  const proBonoRateByClientId = new Map(
    (clients ?? [])
      .filter((c) => c.pro_bono && !c.is_test)
      .map((c) => [c.id, c.pro_bono_rate ?? 0])
  );

  const incomeByMonth = Array(12).fill(0) as number[];
  for (const p of payments ?? []) {
    if (p.client_id && testClientIds.has(p.client_id)) continue;
    const month = Number(p.paid_on.slice(5, 7)) - 1;
    incomeByMonth[month] += Number(p.amount);
  }

  const proBonoByMonth = Array(12).fill(0) as number[];
  for (const s of sessions ?? []) {
    const rate = proBonoRateByClientId.get(s.client_id);
    if (rate === undefined) continue;
    const month = Number(s.date.slice(5, 7)) - 1;
    proBonoByMonth[month] += rate;
  }

  const rate = settingsRow?.estimated_tax_rate ?? null;
  const setAsideByMonth = incomeByMonth.map((income) =>
    rate ? income * (rate / 100) : 0
  );

  const ytdIncome = incomeByMonth.reduce((a, b) => a + b, 0);
  const ytdProBono = proBonoByMonth.reduce((a, b) => a + b, 0);
  const ytdSetAside = setAsideByMonth.reduce((a, b) => a + b, 0);

  const currentMonthIndex = now.getUTCMonth();
  const isCurrentYear = year === currentYear;
  const visibleMonths = isCurrentYear ? currentMonthIndex + 1 : 12;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-ink">
        <Heart className="mr-1.5" />
        Business finances
      </h1>
      <p className="text-sm text-gray">
        Gross income is every payment actually marked paid — session
        payments, late cancellation fees, retainers. Pro bono value is
        tracked separately and never counted as income. This is a rough
        estimate for planning purposes, not tax advice — Texas has no state
        income tax, but federal self-employment tax (15.3%) and federal
        income tax still apply, and a franchise tax filing may still be
        required depending on how your business is structured even when
        nothing is owed. Check with an accountant for anything you&apos;ll
        actually file.
      </p>

      <Card className="space-y-3">
        <p className="font-medium text-ink">Estimated tax set-aside rate</p>
        <form action={updateBusinessFinanceSettings} className="flex flex-wrap items-end gap-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-ink">
              % of gross income to set aside
            </label>
            <Input
              name="estimated_tax_rate"
              type="number"
              step="0.1"
              min="0"
              max="100"
              placeholder="e.g. 30"
              defaultValue={rate ?? ""}
              className="w-32"
            />
          </div>
          <Button type="submit" variant="secondary">
            Save
          </Button>
        </form>
        <p className="text-xs text-gray">
          A common starting point for a self-employed person is 25–30% (SE
          tax alone is 15.3%), but your real number depends on your total
          income and filing situation — this just multiplies whatever rate
          you set against gross income each month so you have a number to
          set aside as you go.
        </p>
      </Card>

      <div className="flex items-center justify-between">
        <Link
          href={`/coach/finances?year=${year - 1}`}
          className="rounded-lg px-2 py-1 text-sm text-gray hover:text-ink"
        >
          ← {year - 1}
        </Link>
        <p className="font-medium text-ink">{year}</p>
        <Link
          href={`/coach/finances?year=${year + 1}`}
          className="rounded-lg px-2 py-1 text-sm text-gray hover:text-ink"
        >
          {year + 1} →
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card>
          <p className="text-sm font-medium text-gray">
            {isCurrentYear ? "Year to date" : `${year} total`} — gross income
          </p>
          <p className="mt-1 text-2xl font-semibold text-ink">
            ${ytdIncome.toFixed(2)}
          </p>
        </Card>
        <Card className="border-rose/30 bg-rose/5">
          <p className="text-sm font-medium text-gray">Pro bono value</p>
          <p className="mt-1 text-2xl font-semibold text-ink">
            ${ytdProBono.toFixed(2)}
          </p>
          <p className="mt-1 text-xs text-gray">Not counted as income</p>
        </Card>
        <Card>
          <p className="text-sm font-medium text-gray">Estimated set-aside</p>
          <p className="mt-1 text-2xl font-semibold text-ink">
            ${ytdSetAside.toFixed(2)}
          </p>
          {!rate ? (
            <p className="mt-1 text-xs text-gray">Set a rate above</p>
          ) : null}
        </Card>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[420px] text-sm">
          <thead>
            <tr className="border-b border-grayLt text-left text-xs uppercase tracking-wide text-gray">
              <th className="py-2 pr-2">Month</th>
              <th className="px-2 py-2 text-right">Income</th>
              <th className="px-2 py-2 text-right">Pro bono value</th>
              <th className="py-2 pl-2 text-right">Est. set-aside</th>
            </tr>
          </thead>
          <tbody>
            {MONTH_NAMES.slice(0, visibleMonths).map((name, i) => (
              <tr key={name} className="border-b border-grayLt/50">
                <td className="py-2 pr-2 text-ink">{name}</td>
                <td className="px-2 py-2 text-right text-ink">
                  ${incomeByMonth[i].toFixed(2)}
                </td>
                <td className="px-2 py-2 text-right text-gray">
                  ${proBonoByMonth[i].toFixed(2)}
                </td>
                <td className="py-2 pl-2 text-right text-gray">
                  ${setAsideByMonth[i].toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-medium text-ink">
              <td className="pr-2 pt-2">Total</td>
              <td className="px-2 pt-2 text-right">${ytdIncome.toFixed(2)}</td>
              <td className="px-2 pt-2 text-right">${ytdProBono.toFixed(2)}</td>
              <td className="pl-2 pt-2 text-right">${ytdSetAside.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </Card>
    </div>
  );
}
