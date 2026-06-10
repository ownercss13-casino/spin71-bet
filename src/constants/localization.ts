export interface TranslationSet {
  headerTitle: string;
  headerSubtitle: string;
  appearanceTitle: string;
  selectThemeLabel: string;
  themeLight: string;
  themeDark: string;
  themeSystem: string;
  notificationsTitle: string;
  pushNotificationsLabel: string;
  pushNotificationsDesc: string;
  emailNotificationsLabel: string;
  emailNotificationsDesc: string;
  audioTitle: string;
  soundEffectsLabel: string;
  bgMusicLabel: string;
  gameSoundLabel: string;
  dailyLimitTitle: string;
  dailyLimitPlaceholder: string;
  saveButton: string;
  saveAllButton: string;
  languageTitle: string;
  languageSelectLabel: string;
  langEn: string;
  langBn: string;
  successSave: string;
  successLimit: string;
  failedLimit: string;
  catAll: string;
  catHot: string;
  catCrash: string;
  catFav: string;
  catSlot: string;
  catLive: string;
  catTable: string;
  catFishing: string;
  catLottery: string;
  navHome: string;
  navWallet: string;
  navProfile: string;
  navInvite: string;
  navBonus: string;
  btnLogin: string;
  btnRegister: string;
  lblBalance: string;
  heroAviatorTitle: string;
  heroJackpotTitle: string;
  heroCasinoTitle: string;
  heroAviatorDesc: string;
  heroJackpotDesc: string;
  heroCasinoDesc: string;
  btnDepositNow: string;
  scrollingNotice: string;
  leaderboardTitle: string;
  leaderboardDesc: string;
  searchPlaceholder: string;
}

export const LOCALIZED_STRINGS: Record<'bn' | 'en', TranslationSet> = {
  bn: {
    headerTitle: "সেটিংস",
    headerSubtitle: "অ্যাপ কনফিগারেশন",
    appearanceTitle: "অ্যাপিয়ারেন্স (Appearance)",
    selectThemeLabel: "থিম নির্বাচন করুন",
    themeLight: "লাইট",
    themeDark: "ডার্ক",
    themeSystem: "সিস্টেম",
    notificationsTitle: "নোটিফিকেশন (Notifications)",
    pushNotificationsLabel: "পুশ নোটিফিকেশন",
    pushNotificationsDesc: "নতুন গেম এবং বোনাস অ্যালার্ট",
    emailNotificationsLabel: "ইমেইল নোটিফিকেশন",
    emailNotificationsDesc: "লগইন সতর্কতা এবং রিসিপ্ট",
    audioTitle: "অডিও (Audio)",
    soundEffectsLabel: "সাউন্ড ইফেক্ট",
    bgMusicLabel: "ব্যাকগ্রাউন্ড মিউজিক (Background Music)",
    gameSoundLabel: "গেম সাউন্ড ইফেক্ট (Game Sounds)",
    dailyLimitTitle: "ডেইলি বেট লিমিট",
    dailyLimitPlaceholder: "দৈনিক লিমিট লিখুন",
    saveButton: "সেভ",
    saveAllButton: "সেভ করুন (Save Settings)",
    languageTitle: "ভাষা (Language)",
    languageSelectLabel: "সিস্টেমের ভাষা পরিবর্তন করুন",
    langEn: "English",
    langBn: "বাংলা",
    successSave: "সেটিংস সফলভাবে সেভ করা হয়েছে!",
    successLimit: "ডেইলি বেট লিমিট আপডেট করা হয়েছে!",
    failedLimit: "লিমিট আপডেট করতে ব্যর্থ হয়েছে।",
    catAll: "সব",
    catHot: "সেরা",
    catCrash: "ক্র্যাশ",
    catFav: "পছন্দ",
    catSlot: "স্লট",
    catLive: "লাইভ ক্যাসিনো",
    catTable: "টেবিল গেমস",
    catFishing: "ফিশিং",
    catLottery: "লটারি",
    navHome: "হোম",
    navWallet: "ওয়ালেট",
    navProfile: "প্রোফাইল",
    navInvite: "ইনভাইট",
    navBonus: "বোনাস",
    btnLogin: "লগইন",
    btnRegister: "রেজিস্ট্রেশন",
    lblBalance: "ব্যালেন্স",
    heroAviatorTitle: "এভিয়েটর সিগন্যাল",
    heroJackpotTitle: "মেগা জ্যাকপট",
    heroCasinoTitle: "প্রিমিয়াম ক্যাসিনো",
    heroAviatorDesc: "প্রেডিক্ট করুন ও বড় জয় নিন",
    heroJackpotDesc: "সবচেয়ে বেশি রিটার্ন রেট",
    heroCasinoDesc: "অফিসিয়াল লাইসেন্সড প্ল্যাটফর্ম",
    btnDepositNow: "ডিপোজিট করুন",
    scrollingNotice: "🏆 SPIN71.BET 🏆 ⭐ প্রথম জমার জন্য ১০০% বোনাস! ⭐",
    leaderboardTitle: "লিডারবোর্ড (Top Winners)",
    leaderboardDesc: "আজকের সবচেয়ে বড় বিজয়ীদের দেখুন",
    searchPlaceholder: "গেম বা প্রোভাইডার সার্চ করুন...",
  },
  en: {
    headerTitle: "Settings",
    headerSubtitle: "App Configurations",
    appearanceTitle: "Appearance",
    selectThemeLabel: "Select Theme",
    themeLight: "Light",
    themeDark: "Dark",
    themeSystem: "System",
    notificationsTitle: "Notifications",
    pushNotificationsLabel: "Push Notifications",
    pushNotificationsDesc: "New game dynamic alerts & updates",
    emailNotificationsLabel: "Email Notifications",
    emailNotificationsDesc: "Auth warnings and transactional receipts",
    audioTitle: "Audio Control",
    soundEffectsLabel: "Sound Effects",
    bgMusicLabel: "Background Music",
    gameSoundLabel: "Game Sound Effects",
    dailyLimitTitle: "Daily Bet Limit",
    dailyLimitPlaceholder: "Enter custom daily limit",
    saveButton: "Save",
    saveAllButton: "Save Settings",
    languageTitle: "Language Selector",
    languageSelectLabel: "Change interface display language",
    langEn: "English (EN)",
    langBn: "Bengali (BN)",
    successSave: "Settings saved successfully!",
    successLimit: "Daily bet limit updated successfully!",
    failedLimit: "Failed to update internal betting limit.",
    catAll: "All",
    catHot: "Hot",
    catCrash: "Crash",
    catFav: "Favs",
    catSlot: "Slots",
    catLive: "Live Casino",
    catTable: "Table Games",
    catFishing: "Fishing",
    catLottery: "Lottery",
    navHome: "Home",
    navWallet: "Wallet",
    navProfile: "Profile",
    navInvite: "Invite",
    navBonus: "Bonus",
    btnLogin: "Login",
    btnRegister: "Register",
    lblBalance: "Balance",
    heroAviatorTitle: "Aviator Signals",
    heroJackpotTitle: "Mega Jackpot",
    heroCasinoTitle: "Premium Casino",
    heroAviatorDesc: "Predict & Win Big",
    heroJackpotDesc: "Highest Return Rate",
    heroCasinoDesc: "Official Licensed Platform",
    btnDepositNow: "Deposit Now",
    scrollingNotice: "🏆 SPIN71.BET 🏆 ⭐ 100% Bonus on First Deposit! ⭐",
    leaderboardTitle: "Leaderboard (Top Winners)",
    leaderboardDesc: "See today's top winners",
    searchPlaceholder: "Search games or providers...",
  }
};
