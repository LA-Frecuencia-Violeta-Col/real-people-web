export interface SuiteItem {
  name: string;
  capacity: string;
  beds: string;
  space: string;
  highlight: string;
  img: string;
  gallery?: string[];
  btnText?: string;
  btnUrl?: string;
  hidden?: boolean;
}

export interface ExperienceItem {
  title: string;
  desc: string;
  img: string;
  duration?: string;
  hidden?: boolean;
}

export interface CaliItem {
  title: string;
  desc: string;
  hidden?: boolean;
}

export interface TicketTier {
  name: string;
  price: string;
  features: string[];
  recommended: boolean;
  bgImage?: string;
  btnUrl?: string;
  btnText?: string;
  hidden?: boolean;
}

export interface BuySection {
  title: string;
  description: string;
  widgetUrl: string;
}

export interface PageData {
  hero: {
    title: string;
    subtitle: string;
    date: string;
    ctaText: string;
    ctaUrl?: string;
    bgImage: string;
    videoUrl: string;
  };
  welcome: {
    subtitle1: string;
    title1: string;
    desc1: string;
    img1: string;
    video1?: string;
    accordion: { title: string; content: string; btnText?: string; btnUrl?: string; hidden?: boolean }[];
    accordion2?: { title: string; content: string; btnText?: string; btnUrl?: string; hidden?: boolean }[];
    title2: string;
    subtitle2: string;
    desc2: string;
    img2: string;
    video2?: string;
    btnText2: string;
    btnUrl2?: string;
  };
  lineup: {
    title: string;
    subtitle: string;
    artists: {
      name: string;
      genre: string;
      time: string;
      img: string;
      bio?: string;
      videoUrl?: string;
      instagram?: string;
      spotify?: string;
      soundcloud?: string;
      youtube?: string;
      beatport?: string;
      hidden?: boolean;
    }[];
  };
  experience: {
    title: string;
    items: ExperienceItem[];
  };
  lodging: {
    title: string;
    subtitle: string;
    desc: string;
    suites: SuiteItem[];
  };
  caliPackage: {
    title: string;
    desc: string;
    icon?: string;
    items: CaliItem[];
    btnText?: string;
    btnUrl?: string;
  };
  tickets: {
    title: string;
    subtitle: string;
    bgImage?: string;
    tiers: TicketTier[];
  };
  faqs: {
    title: string;
    subtitle: string;
    items: { question: string; answer: string; hidden?: boolean }[];
  };
  buy: BuySection;
  footer: {
    description: string;
    email?: string;
    phone?: string;
    address?: string;
    social: {
      instagram: string;
      facebook: string;
      twitter: string;
    };
  };
  settings: {
    accentColor: string;
    faviconUrl: string;
    headerLogoUrl: string;
    footerLogoUrl: string;
    adminLogoUrl: string;
    whatsappNumber: string;
    navBrandText: string;
    siteName: string;
    loadingText: string;
    loadingColor: string;
    fontDisplay: string;
    fontSans: string;
    fontDisplayUrl?: string;
    fontSansUrl?: string;
    logoSize: number;
    mobileLogoSize: number;
    footerLogoSize: number;
    footerMobileLogoSize: number;
    globalBgType: 'blurred' | 'image' | 'color';
    globalBgImage?: string;
    globalBgImageMobile?: string;
    globalBgImageDesktop?: string;
    globalBgColor?: string;
  };
  sectionOrder: string[];
  hiddenSections: string[];
  sectionLabels: Record<string, string>;
  seo: {
    title: string;
    description: string;
    image: string;
    keywords?: string;
  };
}
