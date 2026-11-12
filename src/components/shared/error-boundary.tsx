'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ErrorState } from './states';

interface Props {
  children: ReactNode;
  /** Shown above the message, e.g. "This chart could not be displayed". */
  title?: string;
}

interface State {
  error: Error | null;
}

/** Contains a rendering failure to one widget (a chart, a table) instead of blanking the whole page. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Rendering error caught by ErrorBoundary', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return <ErrorState title={this.props.title ?? 'This section could not be displayed'} error={this.state.error} onRetry={() => this.setState({ error: null })} />;
    }
    return this.props.children;
  }
}
