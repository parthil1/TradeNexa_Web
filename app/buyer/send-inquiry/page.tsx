import { Suspense } from "react";
import SendInquiryPage from "./SendInquiryPage";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-[#546E7A]">Loading...</div>}>
      <SendInquiryPage />
    </Suspense>
  );
}
