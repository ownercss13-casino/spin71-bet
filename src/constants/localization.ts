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
  }
};
