"use client";
import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
          <Card className="max-w-2xl w-full shadow-lg">
            <CardContent className="p-8">
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <AlertTriangle className="h-16 w-16 text-red-500" />
                </div>
                
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Đã xảy ra lỗi
                  </h1>
                  <p className="text-gray-600">
                    Xin lỗi, đã có lỗi xảy ra khi tải trang. Vui lòng thử lại.
                  </p>
                </div>

                {process.env.NODE_ENV === "development" && this.state.error && (
                  <div className="mt-4 p-4 bg-red-50 rounded-lg text-left">
                    <p className="text-sm font-mono text-red-800 break-all">
                      {this.state.error.toString()}
                    </p>
                    {this.state.errorInfo && (
                      <details className="mt-2">
                        <summary className="text-sm text-red-700 cursor-pointer">
                          Stack trace
                        </summary>
                        <pre className="text-xs text-red-600 mt-2 overflow-auto">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </details>
                    )}
                  </div>
                )}

                <div className="flex gap-4 justify-center">
                  <Button onClick={this.handleReset} variant="default">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Thử lại
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/">
                      <Home className="h-4 w-4 mr-2" />
                      Về trang chủ
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

