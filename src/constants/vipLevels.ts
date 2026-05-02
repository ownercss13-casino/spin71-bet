export interface VIPLevel {
  id: number;
  name: string;
  minPoints: number;
  rebatePercent: number; // Daily rebate bonus percentage
  withdrawLimit: number; // Max withdrawal per day
  color: string;
  bgGradient: string;
  benefits: string[];
}

export const VIP_LEVELS: VIPLevel[] = [
  {
    id: 0,
    name: 'BRONZE',
    minPoints: 0,
    rebatePercent: 0.1,
    withdrawLimit: 25000,
    color: '#CD7F32',
    bgGradient: 'from-orange-800 to-orange-600',
    benefits: ['১০% দৈনিক রিবেট', '৳২৫,০০০ দৈনিক উত্তোলন সীমা', 'বেসিক কাস্টমার সাপোর্ট']
  },
  {
    id: 1,
    name: 'SILVER',
    minPoints: 100, // 10,000 BDT deposit
    rebatePercent: 0.25,
    withdrawLimit: 50000,
    color: '#C0C0C0',
    bgGradient: 'from-slate-500 to-slate-400',
    benefits: ['২৫% দৈনিক রিবেট', '৳৫০,০০০ দৈনিক উত্তোলন সীমা', 'প্রায়োরিটি সাপোর্ট', 'সিলভার গিফট বক্স']
  },
  {
    id: 2,
    name: 'GOLD',
    minPoints: 500, // 50,000 BDT deposit
    rebatePercent: 0.4,
    withdrawLimit: 100000,
    color: '#FFD700',
    bgGradient: 'from-yellow-600 to-yellow-400',
    benefits: ['৪০% দৈনিক রিবেট', '৳১,০০,০০০ দৈনিক উত্তোলন সীমা', 'VIP কাস্টমার সাপোর্ট', 'বার্থডে বোনাস']
  },
  {
    id: 3,
    name: 'PLATINUM',
    minPoints: 2000, // 2,00,000 BDT deposit
    rebatePercent: 0.6,
    withdrawLimit: 250000,
    color: '#E5E4E2',
    bgGradient: 'from-blue-500 to-indigo-600',
    benefits: ['৬০% দৈনিক রিবেট', '৳২,৫০,০০০ দৈনিক উত্তোলন সীমা', 'পার্সোনাল অ্যাকাউন্ট ম্যানেজার', 'এক্সক্লুসিভ প্রমোশন']
  },
  {
    id: 4,
    name: 'DIAMOND',
    minPoints: 10000, // 10,00,000 BDT deposit
    rebatePercent: 1.0,
    withdrawLimit: 500000,
    color: '#B9F2FF',
    bgGradient: 'from-cyan-400 to-blue-500',
    benefits: ['১০০% দৈনিক রিবেট', '৳৫,০০,০০০ দৈনিক উত্তোলন সীমা', '২৪/৭ ক্যাশ আউট সুবিধা', 'লাক্সারি গিফট ও ট্যুর প্ল্যান']
  }
];

export const getVIPLevel = (points: number): VIPLevel => {
  for (let i = VIP_LEVELS.length - 1; i >= 0; i--) {
    if (points >= VIP_LEVELS[i].minPoints) {
      return VIP_LEVELS[i];
    }
  }
  return VIP_LEVELS[0];
};

export const getNextVIPLevel = (levelId: number): VIPLevel | null => {
  return VIP_LEVELS[levelId + 1] || null;
};
