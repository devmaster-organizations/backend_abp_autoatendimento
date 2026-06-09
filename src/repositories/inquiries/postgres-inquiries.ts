import { InquiryStatus } from '@prisma/client';
import { prisma } from '../../core/database/prisma';

type CreateInquiryParams = {
  requesterName: string;
  requesterEmail: string;
  question: string;
  recipientEmail: string;
  ccEmail: string | null;
  emailMessageId: string | null;
  emailSentAt: Date | null;
};

type UpsertInquiryEmailConfigParams = {
  recipientEmail: string;
  ccEmail: string | null;
  userId: string | null;
};

export class PostgresInquiriesRepository {
  async createInquiry(params: CreateInquiryParams) {
    return prisma.inquiry.create({
      data: {
        requesterName: params.requesterName,
        requesterEmail: params.requesterEmail,
        question: params.question,
        recipientEmail: params.recipientEmail,
        ccEmail: params.ccEmail,
        emailMessageId: params.emailMessageId,
        emailSentAt: params.emailSentAt,
      },
      include: {
        answeredBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async listInquiries() {
    return prisma.inquiry.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        answeredBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async toggleResponded(id: bigint, responded: boolean, userId: string) {
    return prisma.inquiry.update({
      where: { id },
      data: {
        status: responded ? InquiryStatus.RESPONDIDA : InquiryStatus.ABERTA,
        answeredById: responded ? userId : null,
        answeredAt: responded ? new Date() : null,
      },
      include: {
        answeredBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async getActiveEmailConfig() {
    return prisma.inquiryEmailConfig.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async upsertEmailConfig(params: UpsertInquiryEmailConfigParams) {
    return prisma.$transaction(async (tx) => {
      await tx.inquiryEmailConfig.updateMany({
        where: { isActive: true },
        data: {
          isActive: false,
          updatedById: params.userId,
        },
      });

      return tx.inquiryEmailConfig.create({
        data: {
          recipientEmail: params.recipientEmail,
          ccEmail: params.ccEmail,
          isActive: true,
          createdById: params.userId,
          updatedById: params.userId,
        },
      });
    });
  }
}
