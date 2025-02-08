import React from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { RefreshCcw } from "lucide-react"

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('حدث خطأ:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <Alert className="max-w-lg">
            <AlertTitle className="text-xl mb-4">عذراً، حدث خطأ غير متوقع</AlertTitle>
            <AlertDescription>
              <div className="text-gray-600 mb-4">
                {this.state.error?.message || 'حدث خطأ في النظام. الرجاء المحاولة مرة أخرى.'}
              </div>
              <Button onClick={this.handleRetry} className="w-full">
                <RefreshCcw className="mr-2 h-4 w-4" />
                إعادة تحميل الصفحة
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}
