import { Suspense } from "react";
import SendInquiryPage from "./SendInquiryPage";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-muted-fg">Loading...</div>}>
      <SendInquiryPage />
    </Suspense>
  );
}
