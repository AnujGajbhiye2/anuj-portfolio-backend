import type { Request, Response, NextFunction } from "express";
import {
  insertContact,
  listContacts,
  countContacts,
} from "./contact.repository";
import type { ContactInput } from "./contact.schema";

export async function createContactHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = req.body as ContactInput;
    const row = await insertContact(data);
    req.log.info({ contactId: row.id }, "contact submission saved");
    res.status(201).json({ success: true, id: row.id });
  } catch (err) {
    next(err);
  }
}

export async function listContactsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const offset = Number(req.query.offset) || 0;

    const [submissions, total] = await Promise.all([
      listContacts(limit, offset),
      countContacts(),
    ]);

    res.json({ submissions, total, limit, offset });
  } catch (err) {
    next(err);
  }
}
