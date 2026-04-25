import React, { useState } from 'react';
import { Mail, CheckCircle } from 'lucide-react';

export default function SupportContactForm({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({ subject: '', message: '' });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock email sending
    console.log('Sending email to support@example.com:', formData);
    setIsSubmitted(true);
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
        <CheckCircle className="text-green-500" size={48} />
        <h2 className="text-white font-bold text-lg">ইমেইল পাঠানো হয়েছে!</h2>
        <p className="text-teal-400 text-sm">আপনার ইমেইলটি সফলভাবে পাঠানো হয়েছে। সাপোর্ট টিম শীঘ্রই আপনার সাথে যোগাযোগ করবে।</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4 h-full">
      <h2 className="text-white font-bold text-lg flex items-center gap-2">
        <Mail size={20} className="text-yellow-500" />
        সাপোর্ট ইমেইল পাঠান
      </h2>
      <input
        type="text"
        placeholder="বিষয় (Subject)"
        required
        value={formData.subject}
        onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
        className="w-full bg-teal-900 border border-teal-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-yellow-500"
      />
      <textarea
        placeholder="আপনার সমস্যাটি বিস্তারিত লিখুন..."
        required
        value={formData.message}
        onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
        className="w-full h-32 bg-teal-900 border border-teal-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-yellow-500"
      />
      <button
        type="submit"
        className="w-full bg-yellow-500 text-black font-bold py-2 rounded-lg hover:bg-yellow-400 transition-colors"
      >
        ইমেইল পাঠান
      </button>
    </form>
  );
}
