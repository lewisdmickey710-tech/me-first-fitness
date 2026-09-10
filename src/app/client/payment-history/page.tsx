import { BackLink } from "@/components/back-link";
import { createClient } from "@/lib/supabase/server";
import { getMyClient } from "@/lib/current-client";
import { Badge, Card, EmptyState, Heart } from "@/components/ui";
import { gbtcCoverage } from "@/lib/payment-status";
import { makeT } from "@/lib/i18n";
import type { Payment } from "@/lib/types";

type FinancialEntry =
  | { kind: "payment"; date: string; payment: Payment }
  | { kind: "gbtc"; date: string; dayLabel: string; value: number | null };

export default async function ClientPaymentHistoryPage() {
  const me = await getMyClient();

  if (!me) {
    return (
      <EmptyState
        title="No profile linked yet"
        body="Your coach hasn't linked your login to a client profile yet. Check back soon, or reach out."
      />
    );
  }

  const t = makeT(me.language);
  const supabase = await createClient();

  const [{ data: payments }, { data: sessions }] = await Promise.all([
    supabase
      .from("payments")
      .select("*")
      .eq("client_id", me.id)
      .order("due_date", { ascending: false }) as unknown as Promise<{
      data: Payment[] | null;
    }>,
    supabase
      .from("sessions")
      .select("id, day_label, date, payment_status")
      .eq("client_id", me.id)
      .order("date", { ascending: false }) as unknown as Promise<{
      data: { id: string; day_label: string; date: string; payment_status: "paid" | "unpaid" | "waived" | null }[] | null;
    }>,
  ]);

  const entries: FinancialEntry[] = [
    ...(payments ?? []).map(
      (p): FinancialEntry => ({ kind: "payment", date: p.due_date, payment: p })
    ),
    ...(sessions ?? [])
      .map((s) => ({ s, coverage: gbtcCoverage(me, s) }))
      .filter(({ coverage }) => coverage.covered)
      .map(
        ({ s, coverage }): FinancialEntry => ({
          kind: "gbtc",
          date: s.date,
          dayLabel: s.day_label,
          value: coverage.value,
        })
      ),
  ].sort((a, b) => b.date.localeCompare(a.date));

  const totalGbtcValue = entries
    .filter((e): e is Extract<FinancialEntry, { kind: "gbtc" }> => e.kind === "gbtc")
    .reduce((sum, e) => sum + (e.value ?? 0), 0);

  return (
    <div className="space-y-6">
      <BackLink href="/client/dashboard" />

      <h1 className="text-xl font-semibold text-ink">
        <Heart className="mr-1.5" />
        {t("Payment History")}
      </h1>
      <p className="text-sm text-gray">
        {t("Every payment on your account, plus any sessions covered through Give Back To Community.")}
      </p>

      {totalGbtcValue > 0 ? (
        <Card className="border-gold/40 bg-gold/5">
          <p className="text-sm font-medium text-gray">
            {t("Total received through Give Back To Community")}
          </p>
          <p className="mt-1 text-2xl font-semibold text-ink">
            ${totalGbtcValue.toFixed(2)}
          </p>
        </Card>
      ) : null}

      {entries.length === 0 ? (
        <EmptyState
          title={t("Nothing here yet")}
          body={t("Payments and covered sessions will show up here as they happen.")}
        />
      ) : (
        <div className="space-y-3">
          {entries.map((entry, i) =>
            entry.kind === "payment" ? (
              <Card key={`p-${entry.payment.id}`}>
                <div className="flex items-center justify-between">
                  <p className="font-medium text-ink">{entry.payment.description}</p>
                  {entry.payment.paid_on ? (
                    <Badge tone="green">{t("paid {date}", { date: entry.payment.paid_on })}</Badge>
                  ) : (
                    <Badge tone="gold">{t("due {date}", { date: entry.payment.due_date })}</Badge>
                  )}
                </div>
                <p className="mt-1 text-lg font-semibold text-ink">
                  ${Number(entry.payment.amount).toFixed(2)}
                </p>
              </Card>
            ) : (
              <Card key={`g-${i}`} className="border-gold/30 bg-gold/5">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-ink">{entry.dayLabel}</p>
                  <Badge tone="gold">
                    {t("💛 Covered through Give Back To Community")}
                  </Badge>
                </div>
                {entry.value ? (
                  <p className="mt-1 text-lg font-semibold text-ink">
                    ${entry.value.toFixed(2)}{" "}
                    <span className="text-sm font-normal text-gray">{t("value")}</span>
                  </p>
                ) : null}
                <p className="mt-0.5 text-sm text-gray">{entry.date}</p>
              </Card>
            )
          )}
        </div>
      )}
    </div>
  );
}
