import { Router } from 'express';
import { jwtGuard } from '../../middleware/jwtGuard';
import { validate } from '../../middleware/validate';
import { contactSchema } from './contact.schema';
import { createContactHandler, listContactsHandler } from './contact.handler';

const router = Router();

router.post('/', validate(contactSchema), createContactHandler);
router.get('/', jwtGuard, listContactsHandler);

export { router as contactRouter };
