import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can log the error to an error reporting service here
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-base-200">
          <div className="max-w-md mx-auto bg-base-100 rounded-lg shadow-xl p-6">
            <div className="text-center">
              <div className="text-6xl mb-4">😟</div>
              <h1 className="text-2xl font-bold text-base-content mb-4">
                Something went wrong
              </h1>
              <p className="text-base-content/70 mb-6">
                We're sorry, but something unexpected happened. Please try refreshing the page.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => window.location.reload()}
                  className="btn btn-primary w-full"
                >
                  Refresh Page
                </button>
                <button
                  onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                  className="btn btn-outline w-full"
                >
                  Try Again
                </button>
              </div>
              {this.state.error && process.env.NODE_ENV === 'development' && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-sm text-error">
                    Show Error Details (Development)
                  </summary>
                  <div className="mt-2 p-2 bg-base-200 rounded text-xs overflow-auto">
                    <strong>Error:</strong> {this.state.error.toString()}
                    <br />
                    <strong>Error Info:</strong>
                    <pre className="whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
