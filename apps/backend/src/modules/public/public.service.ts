import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  ContractStatus,
  InstallmentStatus,
  NotificationLanguage,
  PaymentClaimStatus,
} from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { MAX_PAYMENT_PROOF_UPLOAD_BYTES } from '../../common/constants';
import { getUtcToday } from '../../common/date/utc-date';
import { TENANT_BRANDING_SELECT, TenantBranding, toTenantBranding } from '../../common/tenant-branding';
import { PrismaService } from '../../prisma/prisma.service';
import { detectImageExtension } from '../storage/image-signature';
import { StorageService } from '../storage/storage.service';
import { TelegramService } from '../telegram/telegram.service';
import { SubmitPaymentClaimDto } from './dto/submit-payment-claim.dto';

export interface PublicInstallmentClaim {
  status: PaymentClaimStatus;
  declineReason: string | null;
}

export interface PublicNextInstallment {
  id: string;
  dueDate: Date;
  amount: number;
  isOverdue: boolean;
  latestClaim: PublicInstallmentClaim | null;
}

export interface PublicPayment {
  paidAt: Date;
  amount: number;
}

export interface PublicInstallment {
  id: string;
  sequence: number;
  dueDate: Date;
  amount: number;
  paidAmount: number;
  status: InstallmentStatus;
  isOverdue: boolean;
  latestClaim: PublicInstallmentClaim | null;
}

export interface PublicPaymentMethod {
  id: string;
  label: string;
  details: string;
  presetKey: string | null;
}

export interface PublicContractSummary {
  publicId: string;
  productName: string;
  status: ContractStatus;
  totalAmount?: number;
  downPayment?: number;
  paidAmount: number;
  remainingAmount: number;
  nextInstallment: PublicNextInstallment | null;
}

export interface PublicContractDetail {
  productName: string;
  status: ContractStatus;
  totalAmount?: number;
  downPayment?: number;
  paidAmount: number;
  remainingAmount: number;
  payments: PublicPayment[];
  installments: PublicInstallment[];
  paymentMethods: PublicPaymentMethod[];
  branding: TenantBranding;
}

export interface PublicTelegramStatus {
  available: boolean;
  botUsername: string | null;
  connected: boolean;
  enabled: boolean;
  broadcastsEnabled: boolean;
  language: NotificationLanguage;
}

export interface PublicTelegramState {
  connected: boolean;
  enabled: boolean;
  broadcastsEnabled: boolean;
  language: NotificationLanguage;
}

export interface PublicCustomerResponse {
  name: string;
  contracts: PublicContractSummary[];
  paymentMethods: PublicPaymentMethod[];
  telegram: PublicTelegramStatus;
  branding: TenantBranding;
}

@Injectable()
export class PublicService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly telegram: TelegramService,
    private readonly storage: StorageService,
  ) {}

  async getCustomerByPublicId(publicId: string): Promise<PublicCustomerResponse> {
    const customer = await this.prisma.customer.findUnique({
      where: { publicId },
      select: {
        name: true,
        telegramChatId: true,
        telegramNotificationsEnabled: true,
        telegramBroadcastsEnabled: true,
        notificationLanguage: true,
        tenant: {
          select: {
            id: true,
            telegramBotToken: true,
            telegramBotUsername: true,
            ...TENANT_BRANDING_SELECT,
          },
        },
        contracts: {
          select: {
            publicId: true,
            productName: true,
            status: true,
            totalAmount: true,
            downPayment: true,
            installments: {
              orderBy: { sequence: 'asc' },
              select: {
                id: true,
                dueDate: true,
                amount: true,
                paidAmount: true,
                status: true,
                paymentClaims: {
                  orderBy: { createdAt: 'desc' },
                  take: 1,
                  select: { status: true, declineReason: true },
                },
              },
            },
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found.');
    }

    const paymentMethods = await this.prisma.paymentMethod.findMany({
      where: { tenantId: customer.tenant.id, isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, label: true, details: true, presetKey: true },
    });

    return {
      name: customer.name,
      contracts: customer.contracts.map((contract) =>
        this.summarizeContract(contract, customer.tenant.showPublicPricing),
      ),
      paymentMethods,
      telegram: {
        available: Boolean(customer.tenant.telegramBotToken && customer.tenant.telegramBotUsername),
        botUsername: customer.tenant.telegramBotUsername,
        connected: Boolean(customer.telegramChatId),
        enabled: customer.telegramNotificationsEnabled,
        broadcastsEnabled: customer.telegramBroadcastsEnabled,
        language: customer.notificationLanguage,
      },
      branding: toTenantBranding(customer.tenant),
    };
  }

  async getShopBySlug(slug: string): Promise<TenantBranding> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      select: TENANT_BRANDING_SELECT,
    });
    if (!tenant) {
      throw new NotFoundException('Shop not found.');
    }
    return toTenantBranding(tenant);
  }

  async verifyTelegram(publicId: string): Promise<PublicTelegramState> {
    const customer = await this.prisma.customer.findUnique({
      where: { publicId },
      select: {
        id: true,
        name: true,
        telegramChatId: true,
        telegramNotificationsEnabled: true,
        telegramBroadcastsEnabled: true,
        notificationLanguage: true,
        tenant: { select: { telegramBotToken: true } },
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found.');
    }

    if (customer.telegramChatId) {
      return this.stateOf(customer);
    }

    const botToken = customer.tenant.telegramBotToken;
    if (!botToken) {
      return this.stateOf(customer);
    }

    const chatId = await this.telegram.findChatIdByStartPayload(botToken, publicId);
    if (!chatId) {
      return this.stateOf(customer);
    }

    await this.prisma.customer.update({ where: { id: customer.id }, data: { telegramChatId: chatId } });
    const message =
      customer.notificationLanguage === NotificationLanguage.AR
        ? `✅ ${customer.name} — هتوصلك تذكيرات الأقساط هنا.`
        : `✅ ${customer.name} — you'll receive installment reminders here.`;
    await this.telegram.sendMessage(botToken, chatId, message);

    return {
      connected: true,
      enabled: customer.telegramNotificationsEnabled,
      broadcastsEnabled: customer.telegramBroadcastsEnabled,
      language: customer.notificationLanguage,
    };
  }

  async setTelegramEnabled(publicId: string, enabled: boolean): Promise<PublicTelegramState> {
    const customer = await this.ensureCustomer(publicId);
    const updated = await this.prisma.customer.update({
      where: { id: customer.id },
      data: { telegramNotificationsEnabled: enabled },
      select: {
        telegramChatId: true,
        telegramNotificationsEnabled: true,
        telegramBroadcastsEnabled: true,
        notificationLanguage: true,
      },
    });
    return this.stateOf(updated);
  }

  async setTelegramLanguage(publicId: string, language: NotificationLanguage): Promise<PublicTelegramState> {
    const customer = await this.ensureCustomer(publicId);
    const updated = await this.prisma.customer.update({
      where: { id: customer.id },
      data: { notificationLanguage: language },
      select: {
        telegramChatId: true,
        telegramNotificationsEnabled: true,
        telegramBroadcastsEnabled: true,
        notificationLanguage: true,
      },
    });
    return this.stateOf(updated);
  }

  async setTelegramBroadcasts(publicId: string, enabled: boolean): Promise<PublicTelegramState> {
    const customer = await this.ensureCustomer(publicId);
    const updated = await this.prisma.customer.update({
      where: { id: customer.id },
      data: { telegramBroadcastsEnabled: enabled },
      select: {
        telegramChatId: true,
        telegramNotificationsEnabled: true,
        telegramBroadcastsEnabled: true,
        notificationLanguage: true,
      },
    });
    return this.stateOf(updated);
  }

  async disconnectTelegram(publicId: string): Promise<PublicTelegramState> {
    const customer = await this.ensureCustomer(publicId);
    const updated = await this.prisma.customer.update({
      where: { id: customer.id },
      data: { telegramChatId: null },
      select: {
        telegramNotificationsEnabled: true,
        telegramBroadcastsEnabled: true,
        notificationLanguage: true,
      },
    });
    return {
      connected: false,
      enabled: updated.telegramNotificationsEnabled,
      broadcastsEnabled: updated.telegramBroadcastsEnabled,
      language: updated.notificationLanguage,
    };
  }

  private stateOf(customer: {
    telegramChatId: string | null;
    telegramNotificationsEnabled: boolean;
    telegramBroadcastsEnabled: boolean;
    notificationLanguage: NotificationLanguage;
  }): PublicTelegramState {
    return {
      connected: Boolean(customer.telegramChatId),
      enabled: customer.telegramNotificationsEnabled,
      broadcastsEnabled: customer.telegramBroadcastsEnabled,
      language: customer.notificationLanguage,
    };
  }

  private async ensureCustomer(publicId: string): Promise<{ id: string }> {
    const customer = await this.prisma.customer.findUnique({
      where: { publicId },
      select: { id: true },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found.');
    }
    return customer;
  }

  async getContractDetail(customerPublicId: string, contractPublicId: string): Promise<PublicContractDetail> {
    const customer = await this.prisma.customer.findUnique({
      where: { publicId: customerPublicId },
      select: {
        tenant: { select: { id: true, ...TENANT_BRANDING_SELECT } },
        contracts: {
          where: { publicId: contractPublicId },
          select: {
            productName: true,
            status: true,
            totalAmount: true,
            downPayment: true,
            payments: {
              orderBy: { paidAt: 'desc' },
              select: { paidAt: true, amount: true },
            },
            installments: {
              orderBy: { sequence: 'asc' },
              select: {
                id: true,
                sequence: true,
                dueDate: true,
                amount: true,
                paidAmount: true,
                status: true,
                paymentClaims: {
                  orderBy: { createdAt: 'desc' },
                  take: 1,
                  select: { status: true, declineReason: true },
                },
              },
            },
          },
        },
      },
    });

    const contract = customer?.contracts[0];
    if (!customer || !contract) {
      throw new NotFoundException('Contract not found.');
    }

    const paymentMethods = await this.prisma.paymentMethod.findMany({
      where: { tenantId: customer.tenant.id, isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, label: true, details: true, presetKey: true },
    });

    const today = getUtcToday();
    const installmentsPaidAmount = contract.installments.reduce(
      (total, installment) => total + installment.paidAmount,
      0,
    );
    const installmentsTotal = contract.installments.reduce((total, installment) => total + installment.amount, 0);
    const pricingVisible = customer.tenant.showPublicPricing;

    return {
      productName: contract.productName,
      status: contract.status,
      ...(pricingVisible ? { totalAmount: contract.totalAmount, downPayment: contract.downPayment } : {}),
      paidAmount: installmentsPaidAmount,
      remainingAmount: installmentsTotal - installmentsPaidAmount,
      payments: contract.payments,
      paymentMethods,
      installments: contract.installments.map((installment) => ({
        id: installment.id,
        sequence: installment.sequence,
        dueDate: installment.dueDate,
        amount: installment.amount,
        paidAmount: installment.paidAmount,
        status: installment.status,
        isOverdue:
          installment.dueDate < today &&
          (installment.status === InstallmentStatus.PENDING ||
            installment.status === InstallmentStatus.PARTIALLY_PAID),
        latestClaim: installment.paymentClaims[0] ?? null,
      })),
      branding: toTenantBranding(customer.tenant),
    };
  }

  async submitPaymentClaim(
    customerPublicId: string,
    contractPublicId: string,
    dto: SubmitPaymentClaimDto,
  ): Promise<{ status: PaymentClaimStatus }> {
    const customer = await this.prisma.customer.findUnique({
      where: { publicId: customerPublicId },
      select: {
        name: true,
        tenant: { select: { id: true, telegramBotToken: true, telegramChatId: true } },
        contracts: {
          where: { publicId: contractPublicId },
          select: {
            id: true,
            productName: true,
            status: true,
            installments: {
              where: { id: dto.installmentId },
              select: { id: true, amount: true, paidAmount: true, status: true },
            },
          },
        },
      },
    });

    const contract = customer?.contracts[0];
    const installment = contract?.installments[0];
    if (!customer || !contract || !installment) {
      throw new NotFoundException('Contract or installment not found.');
    }
    if (contract.status !== ContractStatus.ACTIVE) {
      throw new BadRequestException('This contract is not active.');
    }
    if (
      installment.status !== InstallmentStatus.PENDING &&
      installment.status !== InstallmentStatus.PARTIALLY_PAID
    ) {
      throw new BadRequestException('This installment is already settled.');
    }

    const paymentMethod = await this.prisma.paymentMethod.findFirst({
      where: { id: dto.paymentMethodId, tenantId: customer.tenant.id, isActive: true },
    });
    if (!paymentMethod) {
      throw new NotFoundException('Payment method not found.');
    }

    const existingPendingClaim = await this.prisma.paymentClaim.findFirst({
      where: { installmentId: installment.id, status: PaymentClaimStatus.PENDING },
    });
    if (existingPendingClaim) {
      throw new BadRequestException('There is already a payment claim under review for this installment.');
    }

    const rawBuffer = Buffer.from(dto.screenshot, 'base64');
    if (rawBuffer.byteLength > MAX_PAYMENT_PROOF_UPLOAD_BYTES) {
      throw new BadRequestException('Screenshot is too large. The maximum size is 4 MB.');
    }
    const extension = detectImageExtension(rawBuffer);
    if (!extension) {
      throw new BadRequestException('Screenshot must be a PNG or JPEG image.');
    }

    const amount = installment.amount - installment.paidAmount;
    const screenshotUrl = await this.storage.saveKeyedImage(
      `payment-claims/${customer.tenant.id}/${randomUUID()}.${extension}`,
      rawBuffer,
    );

    await this.prisma.paymentClaim.create({
      data: {
        tenantId: customer.tenant.id,
        contractId: contract.id,
        installmentId: installment.id,
        paymentMethodId: paymentMethod.id,
        amount,
        screenshotUrl,
      },
    });

    await this.notifyAdminOfClaim(customer.tenant, customer.name, contract.productName, amount, rawBuffer);

    return { status: PaymentClaimStatus.PENDING };
  }

  private async notifyAdminOfClaim(
    tenant: { telegramBotToken: string | null; telegramChatId: string | null },
    customerName: string,
    productName: string,
    amount: number,
    screenshot: Buffer,
  ): Promise<void> {
    if (!tenant.telegramBotToken || !tenant.telegramChatId) {
      return;
    }
    try {
      const caption = `💰 New payment claim\n${customerName} — ${productName}\nAmount: ${(amount / 100).toFixed(2)}`;
      await this.telegram.sendPhoto(tenant.telegramBotToken, tenant.telegramChatId, screenshot, caption);
    } catch {
      return;
    }
  }

  private summarizeContract(
    contract: {
      publicId: string;
      productName: string;
      status: ContractStatus;
      totalAmount: number;
      downPayment: number;
      installments: {
        id: string;
        dueDate: Date;
        amount: number;
        paidAmount: number;
        status: InstallmentStatus;
        paymentClaims: PublicInstallmentClaim[];
      }[];
    },
    pricingVisible: boolean,
  ): PublicContractSummary {
    const today = getUtcToday();
    const installmentsPaidAmount = contract.installments.reduce(
      (total, installment) => total + installment.paidAmount,
      0,
    );
    const installmentsTotal = contract.installments.reduce((total, installment) => total + installment.amount, 0);
    const nextOutstanding = contract.installments.find(
      (installment) =>
        installment.status === InstallmentStatus.PENDING || installment.status === InstallmentStatus.PARTIALLY_PAID,
    );

    return {
      publicId: contract.publicId,
      productName: contract.productName,
      status: contract.status,
      ...(pricingVisible ? { totalAmount: contract.totalAmount, downPayment: contract.downPayment } : {}),
      paidAmount: installmentsPaidAmount,
      remainingAmount: installmentsTotal - installmentsPaidAmount,
      nextInstallment: nextOutstanding
        ? {
            id: nextOutstanding.id,
            dueDate: nextOutstanding.dueDate,
            amount: nextOutstanding.amount - nextOutstanding.paidAmount,
            isOverdue: nextOutstanding.dueDate < today,
            latestClaim: nextOutstanding.paymentClaims[0] ?? null,
          }
        : null,
    };
  }
}
