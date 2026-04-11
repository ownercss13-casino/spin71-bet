export interface VIPLevel {
  level: number;
  name: string;
  minTurnover: number;
  maxTurnover: number;
  color: string;
  bgColor: string;
  borderColor: string;
  benefits: string[];
  icon: string;
}

export const VIP_LEVELS: VIPLevel[] = [
  {
    level: 0,
    name: 'BRONZE',
    minTurnover: 0,
    maxTurnover: 10000,
    color: 'text-orange-400',
    bgColor: 'bg-orange-400/10',
    borderColor: 'border-orange-400/30',
    benefits: ['Daily Bonus: ৳ 6.77', 'Basic Support'],
    icon: '🥉'
  },
  {
    level: 1,
    name: 'SILVER',
    minTurnover: 10001,
    maxTurnover: 50000,
    color: 'text-gray-300',
    bgColor: 'bg-gray-300/10',
    borderColor: 'border-gray-300/30',
    benefits: ['Daily Bonus: ৳ 10.00', 'Priority Support', '1% Rebate'],
    icon: '🥈'
  },
  {
    level: 2,
    name: 'GOLD',
    minTurnover: 50001,
    maxTurnover: 250000,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-400/10',
    borderColor: 'border-yellow-400/30',
    benefits: ['Daily Bonus: ৳ 25.00', 'VIP Support', '2% Rebate', 'Birthday Bonus'],
    icon: '🥇'
  },
  {
    level: 3,
    name: 'PLATINUM',
    minTurnover: 250001,
    maxTurnover: 1000000,
    color: 'text-teal-400',
    bgColor: 'bg-teal-400/10',
    borderColor: 'border-teal-400/30',
    benefits: ['Daily Bonus: ৳ 50.00', 'Personal Account Manager', '3.5% Rebate', 'Exclusive Promos'],
    icon: '💎'
  },
  {
    level: 4,
    name: 'DIAMOND',
    minTurnover: 1000001,
    maxTurnover: 5000000,
    color: 'text-purple-400',
    bgColor: 'bg-purple-400/10',
    borderColor: 'border-purple-400/30',
    benefits: ['Daily Bonus: ৳ 100.00', '24/7 Personal Concierge', '5% Rebate', 'Luxury Gifts', 'Instant Withdrawals'],
    icon: '💍'
  },
  {
    level: 5,
    name: 'BLACK DIAMOND',
    minTurnover: 5000001,
    maxTurnover: 15000000,
    color: 'text-slate-900',
    bgColor: 'bg-slate-900/10',
    borderColor: 'border-slate-900/30',
    benefits: ['Daily Bonus: ৳ 250.00', 'Dedicated VIP Host', '7% Rebate', 'Annual Vacation Package', 'Unlimited Withdrawals'],
    icon: '🖤'
  },
  {
    level: 6,
    name: 'ROYAL CROWN',
    minTurnover: 15000001,
    maxTurnover: 50000000,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    benefits: ['Daily Bonus: ৳ 500.00', 'Private Event Invitations', '10% Rebate', 'Customized Rewards', 'Zero Fee Transactions'],
    icon: '🤴'
  },
  {
    level: 7,
    name: 'EMPEROR',
    minTurnover: 50000001,
    maxTurnover: 150000000,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-600/10',
    borderColor: 'border-indigo-600/30',
    benefits: ['Daily Bonus: ৳ 1000.00', 'Global VIP Access', '15% Rebate', 'Personalized Luxury Gifts', 'Highest Priority Everything'],
    icon: '🏛️'
  },
  {
    level: 8,
    name: 'LEGEND',
    minTurnover: 150000001,
    maxTurnover: 400000000,
    color: 'text-amber-600',
    bgColor: 'bg-amber-600/10',
    borderColor: 'border-amber-600/30',
    benefits: ['Daily Bonus: ৳ 2500.00', 'Legendary Status', '20% Rebate', 'Real Estate Rewards', 'Private Jet Access'],
    icon: '🌟'
  },
  {
    level: 9,
    name: 'MYTHIC',
    minTurnover: 400000001,
    maxTurnover: 1000000000,
    color: 'text-rose-600',
    bgColor: 'bg-rose-600/10',
    borderColor: 'border-rose-600/30',
    benefits: ['Daily Bonus: ৳ 5000.00', 'Mythical Privileges', '25% Rebate', 'Personal Security Detail', 'Global Concierge'],
    icon: '🐉'
  },
  {
    level: 10,
    name: 'CELESTIAL',
    minTurnover: 1000000001,
    maxTurnover: 2500000000,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-400/10',
    borderColor: 'border-cyan-400/30',
    benefits: ['Daily Bonus: ৳ 10,000.00', 'Celestial Authority', '30% Rebate', 'Private Island Access', 'Infinite Limits'],
    icon: '🌌'
  },
  {
    level: 11,
    name: 'ETERNAL',
    minTurnover: 2500000001,
    maxTurnover: 6000000000,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    benefits: ['Daily Bonus: ৳ 25,000.00', 'Eternal Legacy', '35% Rebate', 'Custom Mansion Rewards', 'Lifetime VIP Status'],
    icon: '♾️'
  },
  {
    level: 12,
    name: 'IMMORTAL',
    minTurnover: 6000000001,
    maxTurnover: 15000000000,
    color: 'text-fuchsia-600',
    bgColor: 'bg-fuchsia-600/10',
    borderColor: 'border-fuchsia-600/30',
    benefits: ['Daily Bonus: ৳ 50,000.00', 'Immortal Presence', '40% Rebate', 'Yacht Ownership Program', 'Absolute Priority'],
    icon: '🔥'
  },
  {
    level: 13,
    name: 'DIVINE',
    minTurnover: 15000000001,
    maxTurnover: 40000000000,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-500/50',
    benefits: ['Daily Bonus: ৳ 100,000.00', 'Divine Grace', '50% Rebate', 'Global Asset Management', 'God-Tier Support'],
    icon: '👼'
  },
  {
    level: 14,
    name: 'OVERLORD',
    minTurnover: 40000000001,
    maxTurnover: Infinity,
    color: 'text-red-700',
    bgColor: 'bg-red-700/20',
    borderColor: 'border-red-700/50',
    benefits: ['Daily Bonus: ৳ 250,000.00', 'Absolute Overlord', '70% Rebate', 'Ultimate Power', 'The World is Yours'],
    icon: '⚔️'
  }
];

export const getVIPLevel = (turnover: number): VIPLevel => {
  return VIP_LEVELS.find(level => turnover >= level.minTurnover && turnover <= level.maxTurnover) || VIP_LEVELS[0];
};

export const getNextVIPLevel = (currentLevel: number): VIPLevel | null => {
  return VIP_LEVELS[currentLevel + 1] || null;
};
