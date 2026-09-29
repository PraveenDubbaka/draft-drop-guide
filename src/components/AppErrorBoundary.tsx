import React from "react";

type State = { error: Error | null };

/**
 * Top-level safety net: if anything crashes while rendering, show a recovery
 * screen (with a demo-data reset) instead of a blank white page.
 */
export default class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[AppErrorBoundary] Render crash:", error, info.componentStack);
  }

  resetDemoData = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      /* ignore */
    }
    window.location.reload();
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-lg w-full rounded-[1.25rem] border border-border bg-card p-6 space-y-4">
          <h1 className="text-lg font-semibold text-foreground">Something went wrong loading this page</h1>
          <p className="text-sm text-foreground">
            Saved demo data in this browser may be out of date. Resetting it restores the six demo engagements.
          </p>
          <pre className="text-xs text-foreground bg-muted/50 rounded-[10px] p-3 whitespace-pre-wrap break-words max-h-40 overflow-auto">
            {error.message}
          </pre>
          <div className="flex gap-2">
            <button
              onClick={this.resetDemoData}
              className="h-9 px-4 rounded-[10px] bg-primary text-primary-foreground text-sm font-medium"
            >
              Reset demo data & reload
            </button>
            <button
              onClick={() => window.location.reload()}
              className="h-9 px-4 rounded-[10px] border border-border text-foreground text-sm font-medium"
            >
              Reload
            </button>
          </div>
        </div>
      </div>
    );
  }
}
