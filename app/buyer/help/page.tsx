import PortalPageHeader from "@/components/portal/PortalPageHeader";
import PortalBackLink from "@/components/portal/PortalBackLink";

export default function BuyerHelpPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-5 sm:px-6 lg:px-8">
      <PortalBackLink href="/buyer/profile" />
      <PortalPageHeader title="Help & Support" subtitle="We're here to help" />
      <div className="surface-card space-y-3 p-6 text-sm text-muted-fg">
        <p>Email: contact@tradenexa.com</p>
        <p>Phone: +91 1800-XXX-XXXX</p>
        <p>Hours: Mon–Sat, 9 AM – 6 PM IST</p>
      </div>
    </div>
  );
}
