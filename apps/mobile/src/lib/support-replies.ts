import type { SupportMessage } from '@/api/support';

export function isUnseenReply(message: SupportMessage): boolean {
  return message.adminReply !== null && message.seenAt === null;
}

export function countUnseenReplies(messages: SupportMessage[]): number {
  return messages.filter(isUnseenReply).length;
}
