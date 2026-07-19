import { Injectable, NotFoundException } from '@nestjs/common';
import { ContractStatus, InstallmentStatus, NotificationLanguage } from '@prisma/client';
import { TENANT_BRANDING_SELECT, TenantBranding, toTenantBranding } from '../../common/tenant-branding';
import { PrismaService } from '../../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';

const UPCOMING_INSTALLMENTS_LIMIT = 5;

export interface PublicUpcomingInstallment {
  dueDate: Date;
  remainingAmount: number;
}

export interface PublicPayment {
  paidAt: Date;
  amount: number;
}

export interface PublicContractSummary {
  productName: string;
  status: ContractStatus;
  totalAmount?: number;
  downPayment?: number;
  paidAmount: number;
  remainingAmount: number;
  paidInstallmentsCount: number;
  payments: PublicPayment[];
  upcomingInstallments: PublicUpcomingInstallment[];
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
  telegram: PublicTelegramStatus;
  branding: TenantBranding;
}

@Injectable()
export class PublicService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly telegram: TelegramService,
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
            telegramBotToken: true,
            telegramBotUsername: true,
            ...TENANT_BRANDING_SELECT,
          },
        },
        contracts: {
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
              select: { dueDate: true, amount: true, paidAmount: true, status: true },
            },
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found.');
    }

    return {
      name: customer.name,
      contracts: customer.contracts.map((contract) =>
        this.summarizeContract(contract, customer.tenant.showPublicPricing),
      ),
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

  async getShopByPublicId(publicId: string): Promise<TenantBranding> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { publicId },
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

  private summarizeContract(
    contract: {
      productName: string;
      status: ContractStatus;
      totalAmount: number;
      downPayment: number;
      payments: { paidAt: Date; amount: number }[];
      installments: { dueDate: Date; amount: number; paidAmount: number; status: InstallmentStatus }[];
    },
    pricingVisible: boolean,
  ): PublicContractSummary {
    const installmentsPaidAmount = contract.installments.reduce(
      (total, installment) => total + installment.paidAmount,
      0,
    );
    const installmentsTotal = contract.installments.reduce((total, installment) => total + installment.amount, 0);
    const upcomingInstallments = contract.installments
      .filter(
        (installment) =>
          installment.status === InstallmentStatus.PENDING ||
          installment.status === InstallmentStatus.PARTIALLY_PAID,
      )
      .slice(0, UPCOMING_INSTALLMENTS_LIMIT)
      .map((installment) => ({
        dueDate: installment.dueDate,
        remainingAmount: installment.amount - installment.paidAmount,
      }));

    return {
      productName: contract.productName,
      status: contract.status,
      ...(pricingVisible ? { totalAmount: contract.totalAmount, downPayment: contract.downPayment } : {}),
      paidAmount: contract.downPayment + installmentsPaidAmount,
      remainingAmount: installmentsTotal - installmentsPaidAmount,
      paidInstallmentsCount: contract.installments.filter(
        (installment) => installment.status === InstallmentStatus.PAID,
      ).length,
      payments: contract.payments,
      upcomingInstallments,
    };
  }
}
