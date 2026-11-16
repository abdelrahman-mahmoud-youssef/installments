import { BrandColor, NotificationLanguage, PaymentDirection, Role } from '@prisma/client';
import { PortraitGender } from './demo-images';

export interface DemoStaffMember {
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
}

export interface DemoCustomer {
  name: string;
  address: string;
  gender: PortraitGender;
  notes?: string;
}

export interface DemoProduct {
  name: string;
  imageLabel: string;
  priceInPounds: number;
  costInPounds: number;
  tag: string;
}

export interface DemoWallet {
  label: string;
  details: string;
  presetKey?: string;
  iconKey?: string;
  monthlyLimitInPounds?: number;
  isActive: boolean;
}

export interface DemoSupplier {
  name: string;
  phone: string;
  notes: string;
}

export interface DemoOffer {
  title: string;
  description: string;
  tag: string;
  imageLabels: string[];
  daysAgo: number;
}

export interface DemoSupportThread {
  subject: string;
  message: string;
  reply?: string;
  daysAgo: number;
}

export interface DemoTransaction {
  walletIndex: number;
  direction: PaymentDirection;
  amountInPounds: number;
  supplierIndex?: number;
  counterpartyName?: string;
  note: string;
  daysAgo: number;
}

export interface DemoAdjustment {
  supplierIndex: number;
  direction: PaymentDirection;
  amountInPounds: number;
  note: string;
  daysAgo: number;
}

export interface DemoAnnouncement {
  body: string;
  daysAgo: number;
}

export interface DemoLocation {
  name: string;
  address: string;
}

export interface DemoTenantInfo {
  name: string;
  slug: string;
  logoInitials: string;
  phone: string;
  about: string;
  brandColor: BrandColor;
  instagramUrl: string;
  facebookUrl: string;
  tiktokUrl: string;
  locations: DemoLocation[];
}

export interface DemoShopProfile {
  seed: number;
  language: NotificationLanguage;
  tenant: DemoTenantInfo;
  staff: DemoStaffMember[];
  customers: DemoCustomer[];
  products: DemoProduct[];
  wallets: DemoWallet[];
  suppliers: DemoSupplier[];
  transactions: DemoTransaction[];
  adjustments: DemoAdjustment[];
  offers: DemoOffer[];
  announcements: DemoAnnouncement[];
  supportThreads: DemoSupportThread[];
  declineReason: string;
  failedReminderError: string;
}
