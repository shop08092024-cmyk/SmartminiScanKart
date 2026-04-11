import React, { ReactNode, ErrorInfo } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-full items-center justify-center bg-background px-4">
          <div className="max-w-sm space-y-4 text-center">
            <div className="flex justify-center">
              <div className="rounded-full bg-destructive/10 p-3">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
            </div>
            <h1 className="text-xl font-bold text-foreground">Something went wrong</h1>
            <p className="text-sm text-muted-foreground">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <details className="cursor-pointer text-left">
              <summary className="text-xs text-muted-foreground hover:text-foreground">
                View error details
              </summary>
              <pre className="mt-2 overflow-auto rounded-lg bg-secondary p-2 text-xs text-muted-foreground">
                {this.state.error?.stack}
              </pre>
            </details>
            <Button onClick={this.reset} className="w-full gap-2 rounded-xl">
              <RotateCw className="h-4 w-4" /> Try Again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
