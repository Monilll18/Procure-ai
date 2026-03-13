import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { ResetPasswordContent } from "./reset-password-content";

export const dynamic = "force-dynamic";

export default function ResetPasswordPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
                </div>
            }
        >
            <ResetPasswordContent />
        </Suspense>
    );
}
