import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  props!: Props;
  state: State = {
    hasError: false,
    errorMessage: ''
  };

  static getDerivedStateFromError(error: Error): State {
    let message = 'দুঃখিত, একটি অপ্রত্যাশিত ত্রুটি ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন।';
    try {
      const errInfo = JSON.parse(error.message);
      if (errInfo.error) {
        const errLower = errInfo.error.toLowerCase();
        if (errLower.includes('permission-denied')) {
          message = 'আপনার এই কাজটি করার অনুমতি নেই। অনুগ্রহ করে লগইন চেক করুন।';
        } else if (errLower.includes('quota-exceeded')) {
          message = 'সার্ভারের কোটা পূর্ণ হয়ে গেছে। অনুগ্রহ করে কিছুক্ষণ পর চেষ্টা করুন।';
        } else if (errLower.includes('unavailable') || errLower.includes('offline')) {
          message = 'ইন্টারনেট সংযোগ বিচ্ছিন্ন অথবা সার্ভার ডাউন। অনুগ্রহ করে আপনার কানেকশন চেক করুন।';
        } else if (errLower.includes('not-found')) {
          message = 'অনুরোধ করা তথ্যটি খুঁজে পাওয়া যায়নি।';
        } else if (errLower.includes('unauthenticated')) {
          message = 'অনুগ্রহ করে পুনরায় লগইন করুন।';
        }
      }
    } catch (e) {
      // Not a JSON error
      if (error.message.includes('User not authenticated')) {
        message = 'অনুগ্রহ করে লগইন করুন।';
      }
    }
    return { hasError: true, errorMessage: message };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[1000] bg-black/80 flex items-center justify-center p-6">
          <div className="bg-teal-900 p-8 rounded-3xl text-center border-2 border-red-500 max-w-sm w-full">
            <h2 className="text-2xl font-black text-white mb-4">ত্রুটি!</h2>
            <p className="text-teal-100 mb-6">{this.state.errorMessage}</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-red-500 text-white font-black py-3 rounded-xl hover:bg-red-400 transition-colors"
            >
              পুনরায় চেষ্টা করুন
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
