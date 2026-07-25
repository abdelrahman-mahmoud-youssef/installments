export interface DemoOffer {
  id: string;
  title: { en: string; ar: string };
  description: { en: string; ar: string };
  tag: { en: string; ar: string };
  images: string[];
}

// ponytail: static fixture data for the "latest offers" demo — swap for a real
// endpoint once offers are modeled on the backend, no other component changes needed.
export const demoOffers: DemoOffer[] = [
  {
    id: 'smart-tv-55',
    title: { en: 'Samsung 55" 4K Smart TV', ar: 'تلفزيون سامسونج ذكي 55 بوصة 4K' },
    description: {
      en: 'Crystal-clear display with built-in streaming apps. Available on 6, 12, or 24-month plans.',
      ar: 'شاشة عالية الدقة مع تطبيقات البث المدمجة. متاح بالتقسيط على 6 أو 12 أو 24 شهر.',
    },
    tag: { en: '-15%', ar: 'خصم 15%' },
    images: [
      'https://picsum.photos/seed/qistak-tv-1/900/650',
      'https://picsum.photos/seed/qistak-tv-2/900/650',
      'https://picsum.photos/seed/qistak-tv-3/900/650',
    ],
  },
  {
    id: 'iphone-15-pro',
    title: { en: 'iPhone 15 Pro — 256GB', ar: 'آيفون 15 برو — 256 جيجا' },
    description: {
      en: 'Titanium design, A17 Pro chip, pro camera system. Flexible monthly installments, no hidden fees.',
      ar: 'تصميم تيتانيوم، معالج A17 Pro، نظام كاميرا احترافي. تقسيط شهري مرن بدون رسوم خفية.',
    },
    tag: { en: 'New', ar: 'جديد' },
    images: [
      'https://picsum.photos/seed/qistak-phone-1/900/650',
      'https://picsum.photos/seed/qistak-phone-2/900/650',
      'https://picsum.photos/seed/qistak-phone-3/900/650',
      'https://picsum.photos/seed/qistak-phone-4/900/650',
    ],
  },
  {
    id: 'lshape-sofa',
    title: { en: 'Modern L-Shaped Sofa Set', ar: 'طقم كنبة L مودرن' },
    description: {
      en: 'Premium fabric, solid wood frame, seats up to 6. Delivered and assembled at your home.',
      ar: 'قماش فاخر وهيكل خشب صلب، يتسع حتى 6 أفراد. يتم التوصيل والتركيب في المنزل.',
    },
    tag: { en: 'Best Seller', ar: 'الأكثر طلبًا' },
    images: [
      'https://picsum.photos/seed/qistak-sofa-1/900/650',
      'https://picsum.photos/seed/qistak-sofa-2/900/650',
    ],
  },
  {
    id: 'front-load-washer',
    title: { en: 'LG Front-Load Washing Machine 9kg', ar: 'غسالة إل جي أوتوماتيك 9 كجم' },
    description: {
      en: 'Energy-efficient, quiet inverter motor, 14 wash programs. 2-year warranty included.',
      ar: 'موفرة للطاقة، موتور إنفرتر هادئ، 14 برنامج غسيل. ضمان سنتين شامل.',
    },
    tag: { en: '-10%', ar: 'خصم 10%' },
    images: [
      'https://picsum.photos/seed/qistak-washer-1/900/650',
      'https://picsum.photos/seed/qistak-washer-2/900/650',
      'https://picsum.photos/seed/qistak-washer-3/900/650',
    ],
  },
  {
    id: 'city-scooter',
    title: { en: '125cc City Scooter', ar: 'موتوسيكل سكوتر 125 سي سي' },
    description: {
      en: 'Fuel-efficient and easy to ride around town. Low down payment, plans up to 36 months.',
      ar: 'موفر للوقود وسهل القيادة في المدينة. مقدم بسيط وتقسيط يصل إلى 36 شهر.',
    },
    tag: { en: 'Popular', ar: 'الأكثر رواجًا' },
    images: [
      'https://picsum.photos/seed/qistak-scooter-1/900/650',
      'https://picsum.photos/seed/qistak-scooter-2/900/650',
      'https://picsum.photos/seed/qistak-scooter-3/900/650',
    ],
  },
  {
    id: 'bedroom-set',
    title: { en: 'Complete Bedroom Furniture Set', ar: 'طقم غرفة نوم كامل' },
    description: {
      en: 'Bed frame, wardrobe, and two nightstands in a timeless walnut finish.',
      ar: 'سرير ودولاب وكومودينو مع طقم كامل بلمسة خشب جوز أنيقة.',
    },
    tag: { en: 'New', ar: 'جديد' },
    images: [
      'https://picsum.photos/seed/qistak-bedroom-1/900/650',
      'https://picsum.photos/seed/qistak-bedroom-2/900/650',
      'https://picsum.photos/seed/qistak-bedroom-3/900/650',
    ],
  },
];
