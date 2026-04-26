/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Request, Response } from "express";
import { firebaseFirestore } from "../../config/firebase";
import { logger } from "../utils/loggers";
import {
  getPerformanceStats,
  getRecentMetrics,
} from "../../middlewares/performance.middleware";
import { config } from "../../config/environment";

/**
 * Health check service for monitoring application status
 */

interface HealthCheckResult {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    database: CheckStatus;
    memory: CheckStatus;
    performance: CheckStatus;
  };
  metrics?: {
    performance: any;
    recentRequests: any[];
  };
}

interface CheckStatus {
  status: "pass" | "warn" | "fail";
  message?: string;
  responseTime?: number;
  details?: any;
}

/**
 * Basic health check endpoint
 * Used by load balancers and monitoring tools
 */
export const basicHealthCheck = async (
  req: Request,
  res: Response,
): Promise<void> => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
};

/**
 * Detailed health check endpoint
 * Includes database connectivity, memory usage, and performance metrics
 */
export const detailedHealthCheck = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const startTime = Date.now();

    const [databaseCheck, memoryCheck, performanceCheck] = await Promise.all([
      checkDatabaseHealth(),
      checkMemoryHealth(),
      checkPerformanceHealth(),
    ]);

    const totalDuration = Date.now() - startTime;

    const allStatuses = [
      databaseCheck.status,
      memoryCheck.status,
      performanceCheck.status,
    ];

    let overallStatus: "healthy" | "degraded" | "unhealthy" = "healthy";
    if (allStatuses.includes("fail")) {
      overallStatus = "unhealthy";
    } else if (allStatuses.includes("warn")) {
      overallStatus = "degraded";
    }

    const result: HealthCheckResult = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      version: process.env.npm_package_version || "1.0.0",
      environment: config.env,
      checks: {
        database: databaseCheck,
        memory: memoryCheck,
        performance: performanceCheck,
      },
    };

    if (req.query.metrics === "true") {
      result.metrics = {
        performance: getPerformanceStats(),
        recentRequests: getRecentMetrics(10),
      };
    }

    logger.info("Health check completed", {
      status: overallStatus,
      duration: totalDuration,
    });

    const httpStatus = overallStatus === "healthy" ? 200 : 503;
    res.status(httpStatus).json(result);
  } catch (error) {
    logger.error("Health check failed", error);
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: "Health check failed",
    });
  }
};

/**
 * Check database connectivity and latency
 */
async function checkDatabaseHealth(): Promise<CheckStatus> {
  const startTime = Date.now();

  try {
    const testDoc = await firebaseFirestore
      .collection("health_check")
      .limit(1)
      .get();

    const responseTime = Date.now() - startTime;

    if (responseTime > 2000) {
      return {
        status: "warn",
        message: "Database responding slowly",
        responseTime,
      };
    }

    return {
      status: "pass",
      message: "Database connected",
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    logger.error("Database health check failed", error);

    return {
      status: "fail",
      message: "Database connection failed",
      responseTime,
      details: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Check memory usage
 */
function checkMemoryHealth(): Promise<CheckStatus> {
  return new Promise((resolve) => {
    const memUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    const heapUsedPercent = Math.round((heapUsedMB / heapTotalMB) * 100);

    const details = {
      heapUsed: `${heapUsedMB} MB`,
      heapTotal: `${heapTotalMB} MB`,
      heapUsedPercent: `${heapUsedPercent}%`,
      rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)} MB`,
    };

    if (heapUsedPercent > 90) {
      resolve({
        status: "fail",
        message: "Memory usage critical",
        details,
      });
    } else if (heapUsedPercent > 75) {
      resolve({
        status: "warn",
        message: "Memory usage high",
        details,
      });
    } else {
      resolve({
        status: "pass",
        message: "Memory usage normal",
        details,
      });
    }
  });
}

/**
 * Check performance metrics
 */
function checkPerformanceHealth(): Promise<CheckStatus> {
  return new Promise((resolve) => {
    try {
      const stats = getPerformanceStats();

      if (stats.p95Duration && stats.p95Duration > 3000) {
        resolve({
          status: "fail",
          message: "Performance critically degraded (p95 > 3s)",
          details: {
            p95Duration: `${stats.p95Duration}ms`,
            averageDuration: `${stats.averageDuration}ms`,
          },
        });
      } else if (stats.p95Duration && stats.p95Duration > 1000) {
        resolve({
          status: "warn",
          message: "Performance degraded (p95 > 1s)",
          details: {
            p95Duration: `${stats.p95Duration}ms`,
            averageDuration: `${stats.averageDuration}ms`,
            slowRequests: stats.slowRequests,
          },
        });
      } else {
        resolve({
          status: "pass",
          message: "Performance good",
          details: {
            p95Duration: `${stats.p95Duration}ms`,
            averageDuration: `${stats.averageDuration}ms`,
            totalRequests: stats.totalRequests,
          },
        });
      }
    } catch (error) {
      resolve({
        status: "pass",
        message: "No performance metrics available yet",
      });
    }
  });
}

/**
 * Readiness check endpoint
 * Used to determine if the application is ready to serve traffic
 */
export const readinessCheck = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const databaseCheck = await checkDatabaseHealth();

    if (databaseCheck.status === "fail") {
      res.status(503).json({
        ready: false,
        message: "Service not ready",
        reason: "Database not available",
      });
      return;
    }

    res.status(200).json({
      ready: true,
      message: "Service ready",
    });
  } catch (error) {
    logger.error("Readiness check failed", error);
    res.status(503).json({
      ready: false,
      message: "Service not ready",
    });
  }
};

/**
 * Liveness check endpoint
 * Used to determine if the application is alive (used by Kubernetes)
 */
export const livenessCheck = async (
  req: Request,
  res: Response,
): Promise<void> => {
  res.status(200).json({
    alive: true,
    timestamp: new Date().toISOString(),
  });
};
