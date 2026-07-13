import Link from "next/link";
import PortalPageHeader from "@/components/portal/PortalPageHeader";
import PortalBackLink from "@/components/portal/PortalBackLink";

const SECTIONS = [
  {
    title: "What we collect",
    body: "Account details, business profile information, RFQ and inquiry content, and basic usage data needed to operate TradeNexa.",
  },
  {
    title: "How we use it",
    body: "To run your account, match buyers and sellers, deliver quotes and messages, and keep the marketplace secure. We do not sell personal information to third parties.",
  },
  {
    title: "Your choices",
    body: "Update your profile anytime from settings. For deletion or privacy requests, contact contact@tradenexa.com.",
  },
];

export default function BuyerPrivacyPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-5 sm:px-6 lg:px-8">
      <PortalBackLink href="/buyer/profile" />
      <PortalPageHeader
        title="Privacy Policy"
        subtitle="How TradeNexa handles your business data"
      />
      <div className="space-y-4">
        {SECTIONS.map((section) => (
          <div key={section.title} className="surface-card p-5 text-sm leading-relaxed">
            <h2 className="font-semibold text-foreground">{section.title}</h2>
            <p className="mt-1.5 text-muted-fg">{section.body}</p>
          </div>
        ))}
        <p className="px-1 text-sm text-muted-fg">
          Full policy:{" "}
          <Link href="/privacy" className="font-semibold text-primary hover:underline">
            View public Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
