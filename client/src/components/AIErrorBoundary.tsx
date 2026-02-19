"use client";

/**
 * AIErrorBoundary — catches render errors in AI result panels.
 * Prevents a malformed LLM response from crashing the whole page.
 *
 * Usage:
 *   <AIErrorBoundary>
 *     <AIResultPanel data={llmResult} />
 *   </AIErrorBoundary>
 */
import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
    children: React.ReactNode;
    /** Optional label shown in the fallback UI */
    featureName?: string;
}

interface State {
    hasError: boolean;
    errorMessage: string;
}

export class AIErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, errorMessage: "" };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, errorMessage: error.message };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error("[AIErrorBoundary] Caught render error:", error, info);
    }

    handleReset = () => {
        this.setState({ hasError: false, errorMessage: "" });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
                    <AlertTriangle className="h-8 w-8 text-destructive" />
                    <div>
                        <p className="font-semibold text-destructive">
                            {this.props.featureName ?? "AI result"} could not be displayed
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            The AI returned an unexpected response format. Try again.
                        </p>
                        {process.env.NODE_ENV === "development" && (
                            <p className="mt-2 rounded bg-muted px-2 py-1 text-left font-mono text-xs text-muted-foreground">
                                {this.state.errorMessage}
                            </p>
                        )}
                    </div>
                    <Button size="sm" variant="outline" onClick={this.handleReset}>
                        <RefreshCw className="mr-2 h-3 w-3" />
                        Try again
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}
