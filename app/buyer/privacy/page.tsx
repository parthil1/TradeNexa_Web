import PortalPageHeader from "@/components/portal/PortalPageHeader";
import PortalBackLink from "@/components/portal/PortalBackLink";

export default function BuyerPrivacyPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-5 sm:px-6 lg:px-8">
      <PortalBackLink href="/buyer/profile" />
      <PortalPageHeader title="Privacy Policy" />
      <div className="rounded-2xl border border-[#E8ECF0] bg-white p-6 text-sm leading-relaxed text-[#546E7A]">
        <p>Your data is used only to facilitate B2B trade on TradeNexa. We do not sell personal information to third parties.</p>
      </div>
    </div>
  );
}
