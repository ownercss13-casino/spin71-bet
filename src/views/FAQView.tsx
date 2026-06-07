import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronUp, HelpCircle, Search, X } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSection {
  title: string;
  items: FAQItem[];
}

const faqData: FAQSection[] = [
  {
    title: "সাধারণ জিজ্ঞাসা (General)",
    items: [
      { question: "এই অ্যাপটি কি নিরাপদ?", answer: "হ্যাঁ, আমরা সর্বোচ্চ নিরাপত্তা এবং এনক্রিপশন ব্যবহার করি যাতে আপনার তথ্য ও লেনদেন নিরাপদ থাকে।" },
      { question: "আমি কীভাবে সাপোর্ট পাব?", answer: "আপনি আমাদের লাইভ চ্যাট বা টেলিগ্রামের মাধ্যমে ২৪/৭ সাপোর্ট পেতে পারেন।" }
    ]
  },
  {
    title: "অ্যাকাউন্ট ম্যানেজমেন্ট (Account)",
    items: [
      { question: "আমি কীভাবে অ্যাকাউন্ট তৈরি করব?", answer: "রেজিস্ট্রেশন বাটনে ক্লিক করে আপনার ফোন নম্বর এবং পাসওয়ার্ড দিয়ে সহজেই অ্যাকাউন্ট তৈরি করতে পারেন।" },
      { question: "পাসওয়ার্ড ভুলে গেলে কী করব?", answer: "লগইন পেজে 'পাসওয়ার্ড ভুলে গেছেন?' অপশনে ক্লিক করে নতুন পাসওয়ার্ড সেট করতে পারেন।" }
    ]
  },
  {
    title: "ডিপোজিট (Deposit)",
    items: [
      { question: "কীভাবে ডিপোজিট করব?", answer: "ডিপোজিট সেকশনে গিয়ে আপনার পছন্দের পেমেন্ট মেথড সিলেক্ট করে টাকা পাঠান এবং ট্রানজ্যাকশন আইডি সাবমিট করুন।" },
      { question: "ডিপোজিট কত সময় লাগে?", answer: "সাধারণত ৫-১০ মিনিটের মধ্যে আপনার ব্যালেন্স আপডেট হয়ে যায়।" }
    ]
  },
  {
    title: "উইথড্র (Withdrawal)",
    items: [
      { question: "কীভাবে টাকা তুলব?", answer: "উইথড্র সেকশনে গিয়ে আপনার অ্যামাউন্ট এবং পেমেন্ট মেথড সিলেক্ট করে রিকোয়েস্ট পাঠান।" },
      { question: "উইথড্র লিমিট কত?", answer: "ন্যূনতম ৫০০ টাকা থেকে শুরু করে আপনি প্রতিদিন সর্বোচ্চ ৫০,০০০ টাকা পর্যন্ত উইথড্র করতে পারেন।" }
    ]
  },
  {
    title: "বোনাস (Bonus)",
    items: [
      { question: "কীভাবে বোনাস পাব?", answer: "আমাদের বিভিন্ন প্রোমো কোড এবং ডেইলি বোনাস অফারগুলো চেক করুন, যা নিয়মিত আপডেট করা হয়।" },
      { question: "বোনাস কি সাথে সাথে তোলা যায়?", answer: "না, বোনাস তোলার জন্য নির্দিষ্ট টার্নওভার (Turnover) শর্ত পূরণ করতে হয়।" }
    ]
  }
];

const AccordionItem = ({ item, forceOpen }: { item: FAQItem; forceOpen?: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
    }
  }, [forceOpen]);

  return (
    <div className="border-b border-white/10 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center py-4 text-left text-white font-medium hover:text-yellow-500 transition-colors"
      >
        {item.question}
        {isOpen || forceOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      <AnimatePresence>
        {(isOpen || forceOpen) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="pb-4 text-sm text-gray-400 leading-relaxed">{item.answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function FAQView() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFaqData = faqData.map(section => {
    const matchedItems = section.items.filter(item => 
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return {
      ...section,
      items: matchedItems
    };
  }).filter(section => section.items.length > 0);

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <HelpCircle className="text-yellow-500" size={28} />
        <h1 className="text-2xl font-bold text-white">সচরাচর জিজ্ঞাসিত প্রশ্ন (FAQ)</h1>
      </div>

      {/* FAQ Search Bar */}
      <div className="relative flex items-center mb-6">
        <div className="absolute left-3.5 text-gray-400 pointer-events-none">
          <Search size={16} />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="প্রশ্ন বা উত্তর খুঁজুন..."
          className="w-full bg-[#14253a] border border-[#1e3a5f] hover:border-[#00e5ff]/50 focus:border-[#00e5ff] text-white pl-10 pr-10 py-2.5 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#00e5ff]/30 placeholder-gray-500 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3.5 text-gray-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>
      
      {filteredFaqData.length > 0 ? (
        <>
          {filteredFaqData.map((section, idx) => (
            <div key={idx} className="bg-gray-900 rounded-2xl p-5 border border-white/10">
              <h2 className="text-lg font-bold text-yellow-500 mb-2">{section.title}</h2>
              <div className="space-y-1">
                {section.items.map((item, itemIdx) => (
                  <AccordionItem 
                    key={itemIdx} 
                    item={item} 
                    forceOpen={searchQuery.length > 0} 
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Still Have Questions Section */}
          <div className="bg-gradient-to-br from-yellow-500/10 to-transparent border border-yellow-500/20 rounded-2xl p-6 text-center mt-8">
            <h3 className="text-white font-bold mb-2">Still have questions?</h3>
            <p className="text-gray-400 text-sm mb-4">Can't find the answer you're looking for? Please contact our support team.</p>
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('openSupportChat'))}
              className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-xl transition-all active:scale-95"
            >
              Contact Support
            </button>
          </div>
        </>
      ) : (
        <div className="text-center py-10 text-gray-500 text-sm">
          আপনার খোঁজা প্রশ্নটি পাওয়া যায়নি। অন্য কিছু লিখে চেষ্টা করুন।
        </div>
      )}
    </div>
  );
}
