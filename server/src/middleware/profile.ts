import type { Request, Response, NextFunction } from "express";
import path from "node:path";
import { AppError } from "./error-handler.js";

declare global {
  namespace Express {
    interface Request {
      profileId: string;
      dataDir: string;
    }
  }
}

export function profileMiddleware(dataRoot: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const profileId = req.headers["x-profile-id"] as string | undefined;
    if (!profileId) {
      throw new AppError(400, "MISSING_PROFILE", "X-Profile-Id header is required");
    }
    req.profileId = profileId;
    req.dataDir = path.join(dataRoot, "profiles", profileId);
    next();
  };
}
