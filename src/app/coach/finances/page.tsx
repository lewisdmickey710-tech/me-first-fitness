import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  updateBusinessFinanceSettings,
  addExpense,
  deleteExpense,
  addCredential,
  deleteCredential,
  addPaymentFromLedger,
  markPaymentPaid,
} from "@/app/coach/actions";
import { BackOfficeTabs } from "@/components/back-office-tabs";
import { Badge, Button, Card, EmptyState, Heart, Input, Select } from "@/components/ui";
import { nowInBusinessTz, toDateString } from "@/lib/timezone";
import type { BusinessExpense, BusinessCredential, BusinessFinanceSettings, Payment } from "@/lib/types";

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

const EXPENSE_CATEGORIES = [
  "Equipment",
  "Software/Subscriptions",
  "Certifications/CEUs",
  "Insurance",
  "Mileage/Travel",
  "Marketing",
  "Supplies",
  "Rent/Space",
  "Other",
];

function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(`${b}T00:00:00Z`).getTime() - new Date(`${a}T00:00:00Z`).getTime()) /
      (1000 * 60 * 60 * 24)
  );
}

// Fixed federal estimated-tax due dates (the 15th shifts a day or two in
// some years for weekends/holidays -- close enough for a heads-up banner,
// not a filing deadline itself).
function nextTaxDeadline(todayStr: string): { label: string; date: string } | null {
  const year = Number(todayStr.slice(0, 4));
  const candidates = [
    { label: "Q4 (prior year) estimated tax payment", date: `${year}-01-15` },
    { label: "Q1 estimated tax payment", date: `${year}-04-15` },
    { label: "Q2 estimated tax payment", date: `${year}-06-15` },
    { label: "Q3 estimated tax payment", date: `${year}-09-15` },
    { label: "Q4 estimated tax payment", date: `${year + 1}-01-15` },
  ];
  return candidates.find((d) => d.date >= todayStr) ?? null;
}

export default async function FinancesPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; status?: string }>;
}) {
  const { year: yearParam, status: statusParam } = await searchParams;
  const now = nowInBusinessTz();
  const todayStr = toDateString(now);
  const currentYear = now.getUTCFullYear();
  const year =
    yearParam && /^\d{4}$/.test(yearParam) ? Number(yearParam) : currentYear;
  const paymentStatus: "unpaid" | "paid" | "all" =
    statusParam === "paid" || statusParam === "all" ? statusParam : "unpaid";

  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;

  const supabase = await createClient();

  const [
    { data: settingsRow },
    { data: payments },
    { data: expenses },
    { data: sessions },
    { data: clients },
    { data: ledgerPayments },
    { data: credentials },
  ] = await Promise.all([
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
      .from("business_expenses")
      .select("*")
      .gte("date", yearStart)
      .lte("date", yearEnd)
      .order("date", { ascending: false }) as unknown as Promise<{
      data: BusinessExpense[] | null;
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
      .select("id, name, pro_bono, pro_bono_rate, is_test, archived_at")
      .order("name") as unknown as Promise<{
      data:
        | {
            id: string;
            name: string;
            pro_bono: boolean;
            pro_bono_rate: number | null;
            is_test: boolean;
            archived_at: string | null;
          }[]
        | null;
    }>,
    supabase
      .from("payments")
      .select("*, clients(name)")
      .order("due_date", { ascending: true }) as unknown as Promise<{
      data: (Payment & { clients: { name: string } | null })[] | null;
    }>,
    supabase
      .from("business_credentials")
      .select("*")
      .order("renewal_date") as unknown as Promise<{ data: BusinessCredential[] | null }>,
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
  // Test profiles are deliberately still selectable here (adding a test
  // payment is a normal QA action) -- they're only excluded from the
  // income/pro-bono totals above.
  const activeClients = (clients ?? [])
    .filter((c) => !c.archived_at)
    .map((c) => ({ id: c.id, name: c.name }));

  const incomeByMonth = Array(12).fill(0) as number[];
  for (const p of payments ?? []) {
    if (p.client_id && testClientIds.has(p.client_id)) continue;
    const month = Number(p.paid_on.slice(5, 7)) - 1;
    incomeByMonth[month] += Number(p.amount);
  }

  const expensesByMonth = Array(12).fill(0) as number[];
  for (const e of expenses ?? []) {
    const month = Number(e.date.slice(5, 7)) - 1;
    expensesByMonth[month] += Number(e.amount);
  }

  const proBonoByMonth = Array(12).fill(0) as number[];
  for (const s of sessions ?? []) {
    const rate = proBonoRateByClientId.get(s.client_id);
    if (rate === undefined) continue;
    const month = Number(s.date.slice(5, 7)) - 1;
    proBonoByMonth[month] += rate;
  }

  const netByMonth = incomeByMonth.map((income, i) => income - expensesByMonth[i]);

  const rate = settingsRow?.estimated_tax_rate ?? null;
  const setAsideByMonth = netByMonth.map((net) => (rate ? Math.max(net, 0) * (rate / 100) : 0));

  const ytdIncome = incomeByMonth.reduce((a, b) => a + b, 0);
  const ytdExpenses = expensesByMonth.reduce((a, b) => a + b, 0);
  const ytdNet = ytdIncome - ytdExpenses;
  const ytdProBono = proBonoByMonth.reduce((a, b) => a + b, 0);
  const ytdSetAside = setAsideByMonth.reduce((a, b) => a + b, 0);

  const currentMonthIndex = now.getUTCMonth();
  const isCurrentYear = year === currentYear;
  const visibleMonths = isCurrentYear ? currentMonthIndex + 1 : 12;

  const taxDeadline = nextTaxDeadline(todayStr);
  const taxDeadlineDaysAway = taxDeadline ? daysBetween(todayStr, taxDeadline.date) : null;

  const upcomingRenewals = (credentials ?? []).filter(
    (c) => daysBetween(todayStr, c.renewal_date) <= 60
  );

  const filteredLedgerPayments = (ledgerPayments ?? []).filter((p) => {
    if (paymentStatus === "paid") return !!p.paid_on;
    if (paymentStatus === "unpaid") return !p.paid_on;
    return true;
  });

  return (
    <div className="space-y-6">
      <BackOfficeTabs active="/coach/finances" />

      <h1 className="text-xl font-semibold text-ink">
        <Heart className="mr-1.5" />
        Bookkeeping
      </h1>
      <p className="text-sm text-gray">
        Gross income is every payment actually marked paid — session
        payments, late cancellation fees, retainers. Expenses and pro bono
        value are tracked separately. This is a rough estimate for planning
        purposes, not tax advice — Texas has no state income tax, but
        federal self-employment tax (15.3%) and federal income tax still
        apply, and a franchise tax filing may still be required depending on
        how your business is structured even when nothing is owed. Check
        with an accountant for anything you&apos;ll actually file.
      </p>

      {taxDeadline && taxDeadlineDaysAway !== null && taxDeadlineDaysAway <= 21 ? (
        <Card className="border-gold/50 bg-gold/5">
          <p className="text-sm font-medium text-ink">
            {taxDeadline.label} is due {taxDeadline.date}
            {taxDeadlineDaysAway <= 0
              ? " — today or already passed"
              : ` (in ${taxDeadlineDaysAway} day${taxDeadlineDaysAway === 1 ? "" : "s"})`}
            .
          </p>
        </Card>
      ) : null}

      {upcomingRenewals.length > 0 ? (
        <Card className="border-gold/50 bg-gold/5">
          <p className="text-sm font-medium text-ink">Coming up for renewal:</p>
          <ul className="mt-1 space-y-0.5 text-sm text-ink">
            {upcomingRenewals.map((c) => {
              const days = daysBetween(todayStr, c.renewal_date);
              return (
                <li key={c.id}>
                  {c.label} — {c.renewal_date}
                  {days < 0 ? " (overdue)" : ` (in ${days} day${days === 1 ? "" : "s"})`}
                </li>
              );
            })}
          </ul>
        </Card>
      ) : null}

      <Card className="space-y-3">
        <p className="font-medium text-ink">Estimated tax set-aside rate</p>
        <form action={updateBusinessFinanceSettings} className="flex flex-wrap items-end gap-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-ink">
              % of net income to set aside
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
          income and filing situation — this multiplies whatever rate you
          set against net income (income minus expenses) each month.
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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card>
          <p className="text-sm font-medium text-gray">
            {isCurrentYear ? "Year to date" : `${year} total`} — gross income
          </p>
          <p className="mt-1 text-2xl font-semibold text-ink">
            ${ytdIncome.toFixed(2)}
          </p>
        </Card>
        <Card>
          <p className="text-sm font-medium text-gray">Expenses</p>
          <p className="mt-1 text-2xl font-semibold text-ink">
            ${ytdExpenses.toFixed(2)}
          </p>
        </Card>
        <Card className="border-teal/30 bg-teal/5">
          <p className="text-sm font-medium text-gray">Net income</p>
          <p className="mt-1 text-2xl font-semibold text-ink">${ytdNet.toFixed(2)}</p>
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
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-grayLt text-left text-xs uppercase tracking-wide text-gray">
              <th className="py-2 pr-2">Month</th>
              <th className="px-2 py-2 text-right">Income</th>
              <th className="px-2 py-2 text-right">Expenses</th>
              <th className="px-2 py-2 text-right">Net</th>
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
                  ${expensesByMonth[i].toFixed(2)}
                </td>
                <td className="px-2 py-2 text-right text-ink">${netByMonth[i].toFixed(2)}</td>
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
              <td className="px-2 pt-2 text-right">${ytdExpenses.toFixed(2)}</td>
              <td className="px-2 pt-2 text-right">${ytdNet.toFixed(2)}</td>
              <td className="px-2 pt-2 text-right">${ytdProBono.toFixed(2)}</td>
              <td className="pl-2 pt-2 text-right">${ytdSetAside.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </Card>

      <div>
        <h2 className="text-lg font-semibold text-ink">Expenses ({year})</h2>
        <Card className="mt-2 space-y-3">
          <form action={addExpense} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Input name="date" type="date" required defaultValue={todayStr} />
            <Select name="category" required defaultValue="">
              <option value="" disabled>
                Category…
              </option>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
            <Input name="description" placeholder="Description" className="col-span-2 sm:col-span-1" />
            <Input name="amount" type="number" step="0.01" min="0" placeholder="Amount" required />
            <Button type="submit" variant="secondary" className="col-span-2 sm:col-span-4">
              + Add expense
            </Button>
          </form>

          {!expenses || expenses.length === 0 ? (
            <p className="text-sm text-gray">No expenses logged for {year} yet.</p>
          ) : (
            <div className="space-y-2">
              {expenses.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between border-b border-grayLt/50 pb-2 text-sm last:border-0 last:pb-0"
                >
                  <div>
                    <p className="text-ink">
                      {e.description || e.category}{" "}
                      <span className="text-xs text-gray">· {e.category}</span>
                    </p>
                    <p className="text-xs text-gray">{e.date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-ink">${Number(e.amount).toFixed(2)}</span>
                    <form
                      action={async () => {
                        "use server";
                        await deleteExpense(e.id);
                      }}
                    >
                      <button type="submit" className="text-xs text-gray hover:text-pink">
                        Delete
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-ink">Payments ledger</h2>
        <Card className="mt-2 space-y-3">
          <form action={addPaymentFromLedger} className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            <Select name="client_id" required defaultValue="" className="col-span-2 sm:col-span-1">
              <option value="" disabled>
                Client…
              </option>
              {activeClients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Input name="description" placeholder="Description" />
            <Input name="amount" type="number" step="0.01" min="0" placeholder="Amount" required />
            <Input name="due_date" type="date" required defaultValue={todayStr} />
            <Button type="submit" variant="secondary" className="col-span-2 sm:col-span-1">
              + Add
            </Button>
          </form>

          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray">Show:</span>
            <Link
              href="/coach/finances?status=unpaid"
              className={
                paymentStatus === "unpaid" ? "font-medium text-rose" : "text-gray hover:text-ink"
              }
            >
              Unpaid
            </Link>
            <Link
              href="/coach/finances?status=paid"
              className={
                paymentStatus === "paid" ? "font-medium text-rose" : "text-gray hover:text-ink"
              }
            >
              Paid
            </Link>
            <Link
              href="/coach/finances?status=all"
              className={
                paymentStatus === "all" ? "font-medium text-rose" : "text-gray hover:text-ink"
              }
            >
              All
            </Link>
          </div>

          {filteredLedgerPayments.length === 0 ? (
            <EmptyState
              title="Nothing here"
              body={
                paymentStatus === "unpaid"
                  ? "Nothing currently owed across any client."
                  : "No payments match this filter."
              }
            />
          ) : (
            <div className="space-y-2">
              {filteredLedgerPayments.map((p) => {
                const overdue = !p.paid_on && p.due_date < todayStr;
                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                      overdue ? "border-pink/40 bg-pink/5" : "border-grayLt"
                    }`}
                  >
                    <div>
                      <p className="font-medium text-ink">
                        {p.clients?.name ?? "Client"} — {p.description}
                      </p>
                      <p className="text-xs text-gray">
                        {p.paid_on
                          ? `Paid ${p.paid_on}`
                          : overdue
                            ? `Overdue since ${p.due_date}`
                            : `Due ${p.due_date}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-ink">${Number(p.amount).toFixed(2)}</span>
                      {p.paid_on ? (
                        <Link
                          href={`/coach/finances/receipt/${p.id}`}
                          className="text-xs font-medium text-rose hover:underline"
                        >
                          Receipt
                        </Link>
                      ) : (
                        <form
                          action={async () => {
                            "use server";
                            await markPaymentPaid(p.id, p.client_id);
                          }}
                        >
                          <Button type="submit" variant="secondary">
                            Mark paid
                          </Button>
                        </form>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-ink">Certifications &amp; renewals</h2>
        <Card className="mt-2 space-y-3">
          <form action={addCredential} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Input
              name="label"
              placeholder="e.g. Liability insurance"
              required
              className="col-span-2 sm:col-span-2"
            />
            <Input name="renewal_date" type="date" required />
            <Input name="notes" placeholder="Notes (optional)" />
            <Button type="submit" variant="secondary" className="col-span-2 sm:col-span-4">
              + Add
            </Button>
          </form>

          {!credentials || credentials.length === 0 ? (
            <p className="text-sm text-gray">
              Nothing tracked yet — add a certification expiration or insurance
              renewal date to get a heads-up before it lapses.
            </p>
          ) : (
            <div className="space-y-2">
              {credentials.map((c) => {
                const days = daysBetween(todayStr, c.renewal_date);
                return (
                  <div
                    key={c.id}
                    className="flex items-center justify-between border-b border-grayLt/50 pb-2 text-sm last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="text-ink">{c.label}</p>
                      <p className="text-xs text-gray">
                        {c.renewal_date}
                        {c.notes ? ` · ${c.notes}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {days < 0 ? (
                        <Badge tone="pink">overdue</Badge>
                      ) : days <= 60 ? (
                        <Badge tone="gold">{days}d</Badge>
                      ) : null}
                      <form
                        action={async () => {
                          "use server";
                          await deleteCredential(c.id);
                        }}
                      >
                        <button type="submit" className="text-xs text-gray hover:text-pink">
                          Delete
                        </button>
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
