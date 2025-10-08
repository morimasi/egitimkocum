import React, { ErrorInfo, ReactNode } from 'react';
import Card from './Card';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<Props, State> {
  state: State = {
    hasError: false,
  };

  static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <Card className="text-center max-w-lg">
                <h1 className="text-2xl font-bold text-destructive">Bir şeyler ters gitti.</h1>
                <p className="mt-4 text-muted-foreground">
                    Uygulamada beklenmedik bir hata oluştu. Lütfen sayfayı yenileyerek tekrar deneyin. Sorun devam ederse, destek ekibiyle iletişime geçin.
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-6 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                    Sayfayı Yenile
                </button>
            </Card>
        </div>
      );
    }

    // FIX: Simplify the return, as ReactNode type for children can already be null or undefined.
    return this.props.children;
  }
}

export default ErrorBoundary;