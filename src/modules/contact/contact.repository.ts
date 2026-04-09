import { prisma } from '../../db/client';
import type { ContactInput } from './contact.schema';
import type { ContactSubmission } from '@prisma/client';

export async function insertContact(data: ContactInput): Promise<ContactSubmission> {
  return prisma.contactSubmission.create({ data });
}

export async function listContacts(limit = 50, offset = 0): Promise<ContactSubmission[]> {
  return prisma.contactSubmission.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  });
}

export async function countContacts(): Promise<number> {
  return prisma.contactSubmission.count();
}