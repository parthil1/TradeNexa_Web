import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import SendInquiryPage from "./SendInquiryPage";

function PageFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<PageFallback />}>
      <SendInquiryPage />
    </Suspense>
  );
}
