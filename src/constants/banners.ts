export interface BannerSlide {
  id: string;
  defaultUrl: string;
  title: string;
  desc: string;
  isDefault: boolean;
  actionTab: string;
}

export const DEFAULT_BANNERS: BannerSlide[] = [
  {
    id: 'banner1',
    defaultUrl: "https://www.image2url.com/r2/default/images/1780756072411-5bf24ebb-fb2f-467a-a559-8875dfb29a60.png",
    title: "Invite Friends & Earn",
    desc: "Invite your friends and earn premium bonuses!",
    isDefault: true,
    actionTab: 'invite'
  },
  {
    id: 'banner4',
    defaultUrl: "https://www.image2url.com/r2/default/images/1782136501663-6b5301a8-3b0c-4e53-bb7c-05d2ccf9e699.png",
    title: "স্পেশাল প্রোমো বোনাস",
    desc: "সাপ্তাহিক ও দৈনিক ক্যাশব্যাক অফার",
    isDefault: true,
    actionTab: 'bonus'
  },
  {
    id: 'banner5',
    defaultUrl: "https://www.image2url.com/r2/default/images/1782136595943-a5309f2a-65de-4512-adea-0650418d7dbb.png",
    title: "ভিআইপি সুপার রিওয়ার্ডস",
    desc: "এলিট ক্লাবের ফ্রি স্পিন ও উপহার সমূহ",
    isDefault: true,
    actionTab: 'bonus'
  }
];
