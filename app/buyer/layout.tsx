import BuyerShell from "@/components/portal/BuyerShell";

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  return <BuyerShell>{children}</BuyerShell>;
}
