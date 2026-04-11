import React, { ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle, Home, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
  errorStack?: string;
  showDetails: boolean;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: '',
      showDetails: false
    };
  }

  static getDerivedStateFromError(error: Error): State {
    let message = 'দুঃখিত, একটি অপ্রত্যাশিত ত্রুটি ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন। (Sorry, an unexpected error occurred. Please try again.)';
    
    try {
      // Check if it's our custom Firestore JSON error
      if (error.message.startsWith('{') && error.message.endsWith('}')) {
        const errInfo = JSON.parse(error.message);
        if (errInfo.error) {
          const errLower = errInfo.error.toLowerCase();
          if (errLower.includes('permission-denied')) {
            message = 'আপনার এই কাজটি করার অনুমতি নেই। অনুগ্রহ করে লগইন চেক করুন। (Permission denied. Please check your login.)';
          } else if (errLower.includes('quota-exceeded')) {
            message = 'সার্ভারের কোটা পূর্ণ হয়ে গেছে। অনুগ্রহ করে কিছুক্ষণ পর চেষ্টা করুন। (Server quota exceeded. Please try again later.)';
          } else if (errLower.includes('unavailable') || errLower.includes('offline')) {
            message = 'ইন্টারনেট সংযোগ বিচ্ছিন্ন অথবা সার্ভার ডাউন। অনুগ্রহ করে আপনার কানেকশন চেক করুন। (Network error or server unavailable.)';
          } else if (errLower.includes('not-found')) {
            message = 'অনুরোধ করা তথ্যটি খুঁজে পাওয়া যায়নি। (Requested information not found.)';
          } else if (errLower.includes('unauthenticated')) {
            message = 'অনুগ্রহ করে পুনরায় লগইন করুন। (Please login again.)';
          }
        }
      } else {
        // Regular error message handling
        if (error.message.includes('User not authenticated')) {
          message = 'অনুগ্রহ করে লগইন করুন। (Please login.)';
        } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
          message = 'ইন্টারনেট সংযোগে সমস্যা হচ্ছে। (Network connection issue.)';
        }
      }
    } catch (e) {
      // Fallback to default message
    }

    return { 
      hasError: true, 
      errorMessage: message, 
      errorStack: error.stack,
      showDetails: false 
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error boundary catch:", error, errorInfo);
  }

  handleReset = () => {
    if (window.confirm("আপনি কি নিশ্চিত যে আপনি অ্যাপটি রিসেট করতে চান? এটি আপনার লোকাল সেটিংস মুছে ফেলবে। (Are you sure you want to reset the app? This will clear local settings.)")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  toggleDetails = () => {
    this.setState(prevState => ({ showDetails: !prevState.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[9999] bg-[#0b0b0b] flex items-center justify-center p-4 font-sans">
          <div className="bg-[#1a1a1a] border border-red-500/30 p-8 rounded-[2rem] text-center max-w-md w-full shadow-2xl shadow-red-500/10">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={40} className="text-red-500 animate-pulse" />
            </div>
            
            <h2 className="text-2xl font-black text-white mb-2">ত্রুটি ঘটেছে! (Error Occurred!)</h2>
            <p className="text-gray-400 mb-8 text-sm leading-relaxed">
              {this.state.errorMessage}
            </p>

            <div className="grid grid-cols-1 gap-3">
              <button 
                onClick={() => window.location.reload()}
                className="flex items-center justify-center gap-2 w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-4 rounded-2xl transition-all active:scale-95 shadow-lg shadow-teal-500/20"
              >
                <RefreshCw size={20} />
                পুনরায় চেষ্টা করুন (Reload App)
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => window.location.href = '/'}
                  className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-2xl transition-all active:scale-95"
                >
                  <Home size={18} />
                  হোম (Home)
                </button>
                <button 
                  onClick={this.handleReset}
                  className="flex items-center justify-center gap-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 font-bold py-3 rounded-2xl transition-all active:scale-95 border border-red-500/20"
                >
                  <Trash2 size={18} />
                  রিসেট (Reset)
                </button>
              </div>
            </div>

            <button 
              onClick={this.toggleDetails}
              className="mt-8 text-gray-600 text-xs hover:text-gray-400 transition-colors underline underline-offset-4"
            >
              {this.state.showDetails ? 'বিস্তারিত লুকান (Hide Details)' : 'বিস্তারিত দেখুন (Show Details)'}
            </button>

            {this.state.showDetails && (
              <div className="mt-4 p-4 bg-black/50 rounded-xl text-left overflow-auto max-h-40">
                <code className="text-[10px] text-red-400/70 whitespace-pre-wrap break-all font-mono">
                  {this.state.errorStack || 'No stack trace available'}
                </code>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
