import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, CheckCircle, Check, Circle, PlayCircle, Trophy, BarChart, ChevronRight, GraduationCap, X, Star } from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  duration: string;
}

interface Module {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
}

const MODULES: Module[] = [
  { 
    id: 'm1', 
    title: 'বেসিক ক্যাসিনো রুলস (Basic Rules)', 
    description: 'খেলা শুরু করার আগে বেসিক নিয়মকানুন জানুন।', 
    lessons: [
      { id: 'l1_1', title: 'অ্যাকাউন্ট খোলা এবং ভেরিফিকেশন', duration: '৩ মিনিট' },
      { id: 'l1_2', title: 'প্রথম ডিপোজিট করার উপায়', duration: '৪ মিনিট' },
      { id: 'l1_3', title: 'গেমের বেসিক নিয়ম', duration: '৫ মিনিট' },
      { id: 'l1_4', title: 'উত্তোলন পদ্ধতি', duration: '৩ মিনিট' },
    ]
  },
  { 
    id: 'm2', 
    title: 'উন্নত স্ট্র্যাটেজি (Advanced Strategy)', 
    description: 'জেতার সম্ভাবনা বাড়াতে উন্নত কৌশল শিখুন।', 
    lessons: [
      { id: 'l2_1', title: 'এভিয়েটর কৌশল', duration: '৫ মিনিট' },
      { id: 'l2_2', title: 'স্লটস গেমের বোনাস ট্রিকস', duration: '৬ মিনিট' },
      { id: 'l2_3', title: 'রুলেট জেতার সিক্রেট', duration: '৭ মিনিট' },
    ]
  },
  { 
    id: 'm3', 
    title: 'মানি ম্যানেজমেন্ট (Money Management)', 
    description: 'কিভাবে আপনার ব্যালেন্স সহজে ম্যানেজ করবেন।', 
    lessons: [
      { id: 'l3_1', title: 'বাজেট প্ল্যানিং', duration: '৪ মিনিট' },
      { id: 'l3_2', title: 'ক্ষতি কমানোর কৌশল', duration: '৫ মিনিট' },
    ]
  },
];

interface LearningProgressViewProps {
  userData: any;
}

export default function LearningProgressView({ userData }: LearningProgressViewProps) {
  // Mock tracking completed lessons stored locally (in a real app, this would sync to Firestore)
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);

  useEffect(() => {
    // Load from local storage for mock progress tracking
    const stored = localStorage.getItem(`learning_progress_${userData?.id || 'guest'}`);
    if (stored) {
      setCompletedLessons(JSON.parse(stored));
    }
  }, [userData?.id]);

  const toggleLessonStatus = (lessonId: string) => {
    let newCompleted;
    if (completedLessons.includes(lessonId)) {
      newCompleted = completedLessons.filter(id => id !== lessonId);
    } else {
      newCompleted = [...completedLessons, lessonId];
    }
    setCompletedLessons(newCompleted);
    localStorage.setItem(`learning_progress_${userData?.id || 'guest'}`, JSON.stringify(newCompleted));
  };

  const totalLessons = MODULES.reduce((acc, mod) => acc + mod.lessons.length, 0);
  const completedCount = completedLessons.length;
  const overallProgress = Math.round((completedCount / totalLessons) * 100);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 p-4 pb-20 min-h-screen">
      
      {/* Header Profile Progress */}
      <div className="bg-gradient-to-br from-teal-900 to-teal-950 rounded-[40px] p-8 border border-teal-700/50 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-[100px] -mr-32 -mt-32 transition-all duration-1000 group-hover:bg-orange-500/10"></div>
        <div className="relative z-10 flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left">
          
          <div className="w-24 h-24 rounded-[32px] bg-gradient-to-tr from-yellow-500 to-orange-500 p-1 shadow-xl shadow-orange-500/20 shrink-0">
            <div className="w-full h-full rounded-[28px] bg-teal-950 flex flex-col items-center justify-center relative overflow-hidden">
              <GraduationCap className="text-yellow-500 mb-1" size={32} />
              <div className="text-[10px] font-black text-yellow-500 uppercase tracking-widest leading-none">Level 1</div>
            </div>
          </div>

          <div className="flex-1 w-full space-y-4">
            <div>
              <h2 className="text-3xl font-black text-white italic tracking-tight">লার্নিং সেন্টার</h2>
              <p className="text-teal-400 text-xs font-bold uppercase tracking-widest mt-1">Learning Academy Progress</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <BarChart size={16} className="text-teal-500" />
                  সার্বিক অগ্রগতি (Overall Progress)
                </div>
                <div className="text-2xl font-black text-yellow-500 italic tracking-tighter">{overallProgress}%</div>
              </div>
              <div className="h-3 bg-black/40 rounded-full overflow-hidden border border-white/5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${overallProgress}%` }}
                  transition={{ duration: 1, delay: 0.2 }}
                  className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 relative"
                >
                  <div className="absolute inset-0 bg-white/20 w-full h-full transform -skew-x-12 -translate-x-full animate-[shimmer_2s_infinite]"></div>
                </motion.div>
              </div>
              <p className="text-[10px] text-teal-500 font-bold tracking-wider pt-1">
                {completedCount} / {totalLessons} লেসন সম্পন্ন হয়েছে
              </p>
            </div>
          </div>
        </div>
      </div>

      <h3 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-2 px-2 mt-8 mb-4">
        <BookOpen className="text-teal-500" size={20} />
        কোর্স মডিউল (Course Modules)
      </h3>

      <div className="space-y-4">
        {MODULES.map((module, idx) => {
          const moduleCompletedCount = module.lessons.filter(l => completedLessons.includes(l.id)).length;
          const isModuleComplete = moduleCompletedCount === module.lessons.length;
          
          return (
            <motion.div 
              key={module.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => setSelectedModule(module)}
              className={`p-5 rounded-[28px] border transition-all cursor-pointer group shadow-lg ${
                isModuleComplete 
                ? 'bg-gradient-to-r from-teal-900/40 to-teal-800/40 border-teal-500/50 hover:bg-teal-800/50' 
                : 'bg-teal-900/20 border-teal-800/30 hover:bg-teal-900/40 hover:border-orange-500/30'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105 ${
                    isModuleComplete 
                    ? 'bg-teal-500/20 text-teal-400 border-teal-500/30' 
                    : 'bg-white/5 text-gray-400 border-white/10'
                  }`}>
                    {isModuleComplete ? <Trophy size={22} /> : <BookOpen size={22} />}
                  </div>
                  <div>
                    <h4 className="text-base font-black text-white italic tracking-tight">{module.title}</h4>
                    <p className="text-[10px] text-teal-500 font-bold mt-1 line-clamp-1">{module.description}</p>
                    
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 bg-black/20 px-2 py-1 rounded-lg">
                        <PlayCircle size={12} />
                        {module.lessons.length} লেসন
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 bg-black/20 px-2 py-1 rounded-lg">
                        <CheckCircle size={12} className={isModuleComplete ? "text-teal-500" : ""} />
                        {moduleCompletedCount}/{module.lessons.length} সম্পন্ন
                      </div>
                    </div>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-teal-500 group-hover:bg-teal-500 group-hover:text-black transition-colors shrink-0">
                  <ChevronRight size={16} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Module Lessons Modal */}
      <AnimatePresence>
        {selectedModule && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedModule(null)}>
            <motion.div 
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-[#0d1a29] border-t sm:border border-[#1e3a5f]/50 rounded-t-[40px] sm:rounded-[40px] p-6 sm:p-8 w-full max-w-lg relative shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6 sm:hidden"></div>
              
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
              
              <button 
                onClick={() => setSelectedModule(null)}
                className="absolute top-6 right-6 text-teal-400 hover:text-white p-2 rounded-xl bg-white/5 transition-all hidden sm:block"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-teal-900/50 flex flex-col items-center justify-center border border-teal-500/20 shrink-0 text-teal-400">
                  <Star size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black italic text-white leading-tight">{selectedModule.title}</h3>
                  <p className="text-xs text-teal-500 font-bold mt-1">{selectedModule.description}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-3 no-scrollbar pb-6">
                {selectedModule.lessons.map((lesson, idx) => {
                  const isCompleted = completedLessons.includes(lesson.id);
                  return (
                    <div 
                      key={lesson.id}
                      onClick={() => toggleLessonStatus(lesson.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                        isCompleted 
                        ? 'bg-teal-900/40 border-teal-500/30' 
                        : 'bg-black/20 border-white/5 hover:bg-black/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-bold text-white/40 w-6">{(idx + 1).toString().padStart(2, '0')}</div>
                        <div>
                          <p className={`text-sm font-bold ${isCompleted ? 'text-white' : 'text-gray-300'}`}>{lesson.title}</p>
                          <p className="text-[10px] text-teal-600 font-bold mt-0.5">{lesson.duration}</p>
                        </div>
                      </div>
                      
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shrink-0 border ${
                        isCompleted 
                        ? 'bg-teal-500 text-black border-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.3)]' 
                        : 'bg-black/40 text-gray-500 border-white/10 hover:border-white/30'
                      }`}>
                        {isCompleted ? <Check size={16} strokeWidth={4} /> : <PlayCircle size={16} />}
                      </div>
                    </div>
                  );
                })}
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
