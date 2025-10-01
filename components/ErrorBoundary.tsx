

import React, { Component, ErrorInfo, ReactNode } from 'react';
import Card from './Card';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
            <Card className="text-center max-w-lg">
                <h1 className="text-2xl font-bold text-red-500">Bir şeyler ters gitti.</h1>
                <p className="mt-4 text-gray-600 dark:text-gray-300">
                    Uygulamada beklenmedik bir hata oluştu. Lütfen sayfayı yenileyerek tekrar deneyin. Sorun devam ederse, destek ekibiyle iletişime geçin.
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-6 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                    Sayfayı Yenile
                </button>
            </Card>
        </div>
      );
    }

    // Fix: Destructure `children` from `this.props` to resolve potential linter errors and improve readability.
    const { children } = this.props;
    return children;
  }
}

export default ErrorBoundary;