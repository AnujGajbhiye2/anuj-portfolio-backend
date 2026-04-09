import type { Request, Response, NextFunction } from 'express';
import { insertContact, listContacts, countContacts } from './contact.repository';
import type { ContactInput } from './contact.schema';

export function createContactHandler(req: Request, res: Response): void {
  const data = req.body as ContactInput;
  const row = insertContact(data);
  req.log.info({ contactId: row.id }, 'contact submission saved');
  res.status(201).json({ success: true, id: row.id });
}

export function listContactsHandler(req: Request, res: Response, next: NextFunction): void {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const offset = Number(req.query.offset) || 0;

    const submissions = listContacts(limit, offset);
    const total = countContacts();

    res.json({ submissions, total, limit, offset });
  } catch (err) {
    next(err);
  }
}
