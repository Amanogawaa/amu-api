import { logger } from "core/utils/loggers";
import type { Request, Response, NextFunction } from "express";

interface CacheConfig {
  maxAge: number;
  staleWhileRevalidate?: number;
  public?: boolean;
}

const cacheConfigs: Record<string, CacheConfig> = {
  static: {
    maxAge: 31536000,
    public: true,
  },
  courseList: {
    maxAge: 300,
    staleWhileRevalidate: 600,
    public: true,
  },
  course: {
    maxAge: 600,
    staleWhileRevalidate: 1200,
    public: true,
  },
  chapters: {
    maxAge: 600,
    staleWhileRevalidate: 1200,
    public: true,
  },
  lessons: {
    maxAge: 600,
    staleWhileRevalidate: 1200,
    public: true,
  },
  private: {
    maxAge: 60,
    public: false,
  },
  dynamic: {
    maxAge: 30,
    public: true,
  },
  noCache: {
    maxAge: 0,
    public: false,
  },
};

function generateCacheControl(config: CacheConfig): string {
  const parts: string[] = [];

  if (config.public) {
    parts.push("public");
  } else {
    parts.push("private");
  }

  parts.push(`max-age=${config.maxAge}`);

  if (config.staleWhileRevalidate) {
    parts.push(`stale-while-revalidate=${config.staleWhileRevalidate}`);
  }

  parts.push("must-revalidate");

  return parts.join(", ");
}

export const cacheMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const path = req.path;
  let cacheType: keyof typeof cacheConfigs = "noCache";

  if (path.match(/^\/api\/courses$/) && req.method === "GET") {
    cacheType = "courseList";
  } else if (path.match(/^\/api\/courses\/[^/]+$/) && req.method === "GET") {
    cacheType = "course";
  } else if (path.match(/^\/api\/chapters/) && req.method === "GET") {
    cacheType = "chapters";
  } else if (path.match(/^\/api\/lessons/) && req.method === "GET") {
    cacheType = "lessons";
  } else if (path.match(/^\/api\/enrollment/) && req.method === "GET") {
    cacheType = "private";
  } else if (path.match(/^\/api\/progress/) && req.method === "GET") {
    cacheType = "private";
  } else if (path.match(/^\/uploads\//) && req.method === "GET") {
    cacheType = "static";
  } else if (req.method !== "GET") {
    cacheType = "noCache";
  }

  const config = cacheConfigs[cacheType];
  const cacheControl = generateCacheControl(config!);

  res.setHeader("Cache-Control", cacheControl);

  if (req.method === "GET" && config!.maxAge > 0) {
    res.setHeader("ETag", `W/"${Date.now()}"`);
  }

  res.setHeader("Vary", "Accept-Encoding, Authorization");

  logger.debug(`Cache headers set for ${path}: ${cacheControl}`);

  next();
};

export const noCacheMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, private",
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
};

export const customCacheMiddleware = (maxAge: number, isPublic = true) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const config: CacheConfig = {
      maxAge,
      public: isPublic,
      staleWhileRevalidate: maxAge * 2,
    };
    const cacheControl = generateCacheControl(config);
    res.setHeader("Cache-Control", cacheControl);
    res.setHeader("Vary", "Accept-Encoding, Authorization");

    if (config.maxAge > 0) {
      res.setHeader("ETag", `W/"${Date.now()}"`);
    }

    next();
  };
};
