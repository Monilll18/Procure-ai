import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { SupplierActivateContent } from "./activate-content";

export const dynamic = "force-dynamic";

export default function SupplierActivatePage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-gray-950">
                    <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
                </div>
            }
        >
            <SupplierActivateContent />
        </Suspense>
    );
}
