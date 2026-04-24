import { Router } from "express";
import { jwtGuard } from "../../middleware/jwtGuard";
import { validate } from "../../middleware/validate";
import { pageViewSchema } from "./analytics.schema";
import {
  pageViewHandler,
  analyticsSummaryHandler,
  analyticsRecentHandler,
} from "./analytics.handler";

const router = Router();

router.post("/page-view", validate(pageViewSchema), pageViewHandler);
router.get("/summary", jwtGuard, analyticsSummaryHandler);
router.get("/recent", jwtGuard, analyticsRecentHandler);

export { router as analyticsRouter };
