import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

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

const AccordionItem = ({ item }: { item: FAQItem }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-white/10 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center py-4 text-left text-white font-medium hover:text-yellow-500 transition-colors"
      >
        {item.question}
        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      <AnimatePresence>
        {isOpen && (
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
  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <HelpCircle className="text-yellow-500" size={28} />
        <h1 className="text-2xl font-bold text-white">সচরাচর জিজ্ঞাসিত প্রশ্ন (FAQ)</h1>
      </div>
      
      {faqData.map((section, idx) => (
        <div key={idx} className="bg-gray-900 rounded-2xl p-5 border border-white/10">
          <h2 className="text-lg font-bold text-yellow-500 mb-2">{section.title}</h2>
          <div className="space-y-1">
            {section.items.map((item, itemIdx) => (
              <AccordionItem key={itemIdx} item={item} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
