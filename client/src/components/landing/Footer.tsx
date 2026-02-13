import Link from "next/link";
import { Zap } from "lucide-react";

export function Footer() {
    return (
        <footer className="py-12 border-t border-border bg-background">
            <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">

                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 dark:bg-secondary">
                        <Zap className="h-4 w-4 text-white dark:text-foreground" fill="currentColor" />
                    </div>
                    <span className="text-lg font-bold text-foreground">ProcureAI</span>
                </div>

                <div className="text-muted-foreground text-sm">
                    © 2026 ProcureAI Inc. All rights reserved.
                </div>

                <div className="flex items-center gap-6">
                    <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy</Link>
                    <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms</Link>
                    <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Twitter</Link>
                </div>

            </div>
        </footer>
    );
}
