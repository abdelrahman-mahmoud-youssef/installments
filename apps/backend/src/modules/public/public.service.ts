import { Injectable, NotFoundException } from '@nestjs/common';
import { InstallmentStatus, NotificationLanguage } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';

const UPCOMING_INSTALLMENTS_LIMIT = 5;

export interface PublicUpcomingInstallment {
  dueDate: Date;
  remainingAmount: number;
}

export interface PublicContractSummary {
  productName: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paidInstallmentsCount: number;
  upcomingInstallments: PublicUpcomingInstallment[];
}

export interface PublicTelegramStatus {
  available: boolean;
  botUsername: string | null;
  connected: boolean;
  enabled: boolean;
  language: NotificationLanguage;
}

export interface PublicTelegramState {
  connected: boolean;
  enabled: boolean;
  language: NotificationLanguage;
}

export interface PublicCustomerResponse {
  name: string;
  contracts: PublicContractSummary[];
  telegram: PublicTelegramStatus;
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
        notificationLanguage: true,
        tenant: { select: { telegramBotToken: true, telegramBotUsername: true } },
        contracts: {
          select: {
            productName: true,
            totalAmount: true,
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
      contracts: customer.contracts.map((contract) => this.summarizeContract(contract)),
      telegram: {
        available: Boolean(customer.tenant.telegramBotToken && customer.tenant.telegramBotUsername),
        botUsername: customer.tenant.telegramBotUsername,
        connected: Boolean(customer.telegramChatId),
        enabled: customer.telegramNotificationsEnabled,
        language: customer.notificationLanguage,
      },
    };
  }

  async verifyTelegram(publicId: string): Promise<PublicTelegramState> {
    const customer = await this.prisma.customer.findUnique({
      where: { publicId },
      select: {
        id: true,
        name: true,
        telegramChatId: true,
        telegramNotificationsEnabled: true,
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
        ? `✅ ${customer.name} — ستصلك تذكيرات الأقساط هنا.`
        : `✅ ${customer.name} — you'll receive installment reminders here.`;
    await this.telegram.sendMessage(botToken, chatId, message);

    return { connected: true, enabled: customer.telegramNotificationsEnabled, language: customer.notificationLanguage };
  }

  async setTelegramEnabled(publicId: string, enabled: boolean): Promise<PublicTelegramState> {
    const customer = await this.ensureCustomer(publicId);
    const updated = await this.prisma.customer.update({
      where: { id: customer.id },
      data: { telegramNotificationsEnabled: enabled },
      select: { telegramChatId: true, telegramNotificationsEnabled: true, notificationLanguage: true },
    });
    return this.stateOf(updated);
  }

  async setTelegramLanguage(publicId: string, language: NotificationLanguage): Promise<PublicTelegramState> {
    const customer = await this.ensureCustomer(publicId);
    const updated = await this.prisma.customer.update({
      where: { id: customer.id },
      data: { notificationLanguage: language },
      select: { telegramChatId: true, telegramNotificationsEnabled: true, notificationLanguage: true },
    });
    return this.stateOf(updated);
  }

  async disconnectTelegram(publicId: string): Promise<PublicTelegramState> {
    const customer = await this.ensureCustomer(publicId);
    const updated = await this.prisma.customer.update({
      where: { id: customer.id },
      data: { telegramChatId: null },
      select: { telegramNotificationsEnabled: true, notificationLanguage: true },
    });
    return { connected: false, enabled: updated.telegramNotificationsEnabled, language: updated.notificationLanguage };
  }

  private stateOf(customer: {
    telegramChatId: string | null;
    telegramNotificationsEnabled: boolean;
    notificationLanguage: NotificationLanguage;
  }): PublicTelegramState {
    return {
      connected: Boolean(customer.telegramChatId),
      enabled: customer.telegramNotificationsEnabled,
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

  private summarizeContract(contract: {
    productName: string;
    totalAmount: number;
    installments: { dueDate: Date; amount: number; paidAmount: number; status: InstallmentStatus }[];
  }): PublicContractSummary {
    const paidAmount = contract.installments.reduce((total, installment) => total + installment.paidAmount, 0);
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
      totalAmount: contract.totalAmount,
      paidAmount,
      remainingAmount: contract.totalAmount - paidAmount,
      paidInstallmentsCount: contract.installments.filter(
        (installment) => installment.status === InstallmentStatus.PAID,
      ).length,
      upcomingInstallments,
    };
  }
}
