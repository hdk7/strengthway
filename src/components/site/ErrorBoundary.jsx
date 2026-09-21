import { Component } from "react";
import { Button } from "@/components/ui/button";

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    console.error(error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold tracking-tight">This page didn't load</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Something went wrong. Try again or head back home.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button onClick={() => this.setState({ error: null })}>Try again</Button>
            <Button variant="outline" asChild>
              <a href="/">Go home</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
