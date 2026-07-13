import PortalPageHeader from "@/components/portal/PortalPageHeader";
import PortalBackLink from "@/components/portal/PortalBackLink";

export default function BuyerPaymentsPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-5 sm:px-6 lg:px-8">
      <PortalBackLink href="/buyer/profile" />
      <PortalPageHeader title="Payments" subtitle="Transaction history" />
      <div className="rounded-2xl border border-border bg-white p-6 text-sm text-muted-fg">
        No payment history yet. Payments are handled directly between buyer and seller on TradeNexa.
      </div>
    </div>
  );
}
