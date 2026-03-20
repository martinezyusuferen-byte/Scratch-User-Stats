import { Router, type IRouter } from "express";
import healthRouter from "./health";
import scratchRouter from "./scratch";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/scratch", scratchRouter);

export default router;
