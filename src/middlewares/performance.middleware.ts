/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextFunction, Request, Response } from "express";
import { logger } from "../core/utils/loggers";

interface PerformanceMetrics {
  method: string;
  url: string;
  status: number;
  duration: number;
  timestamp: string;
  userAgent?: string;
  ip?: string;
}

const metricsStore: PerformanceMetrics[] = [];
const MAX_METRICS_STORED = 1000;

const SLOW_REQUEST_THRESHOLD = 1000;
const VERY_SLOW_REQUEST_THRESHOLD = 3000;

/**
 * Performance monitoring middleware
 * Tracks response time and logs slow requests
 */
export const performanceMonitor = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const startTime = Date.now();
  const startHrTime = process.hrtime();

  const originalEnd = res.end;

  res.end = function (chunk?: any, encoding?: any, callback?: any): any {
    res.end = originalEnd;

    const result = res.end(chunk, encoding, callback);

    const durationMs = Date.now() - startTime;
    const hrDuration = process.hrtime(startHrTime);
    const durationNs = hrDuration[0] * 1e9 + hrDuration[1];
    const preciseDuration = durationNs / 1e6;

    const metrics: PerformanceMetrics = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: Math.round(preciseDuration * 100) / 100,
      timestamp: new Date().toISOString(),
      userAgent: req.get("User-Agent"),
      ip: req.ip || req.socket.remoteAddress,
    };

    metricsStore.push(metrics);
    if (metricsStore.length > MAX_METRICS_STORED) {
      metricsStore.shift();
    }

    if (durationMs >= VERY_SLOW_REQUEST_THRESHOLD) {
      logger.error("Very slow request detected", {
        ...metrics,
        threshold: VERY_SLOW_REQUEST_THRESHOLD,
        severity: "CRITICAL",
      });
    } else if (durationMs >= SLOW_REQUEST_THRESHOLD) {
      logger.warn("Slow request detected", {
        ...metrics,
        threshold: SLOW_REQUEST_THRESHOLD,
        severity: "WARNING",
      });
    } else {
      logger.info("Request completed", {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration: `${metrics.duration}ms`,
      });
    }

    return result;
  };

  next();
};

/**
 * Get performance statistics
 * @returns Performance statistics object
 */
export const getPerformanceStats = () => {
  if (metricsStore.length === 0) {
    return {
      totalRequests: 0,
      averageDuration: 0,
      medianDuration: 0,
      p95Duration: 0,
      p99Duration: 0,
      slowRequests: 0,
      verySlowRequests: 0,
    };
  }

  const durations = metricsStore.map((m) => m.duration).sort((a, b) => a - b);
  const total = durations.reduce((sum, d) => sum + d, 0);

  const p95Index = Math.floor(durations.length * 0.95);
  const p99Index = Math.floor(durations.length * 0.99);
  const medianIndex = Math.floor(durations.length * 0.5);

  return {
    totalRequests: metricsStore.length,
    averageDuration: Math.round((total / durations.length) * 100) / 100,
    medianDuration: durations[medianIndex],
    p95Duration: durations[p95Index],
    p99Duration: durations[p99Index],
    slowRequests: metricsStore.filter(
      (m) => m.duration >= SLOW_REQUEST_THRESHOLD,
    ).length,
    verySlowRequests: metricsStore.filter(
      (m) => m.duration >= VERY_SLOW_REQUEST_THRESHOLD,
    ).length,
    statusCodes: getStatusCodeDistribution(),
    slowestEndpoints: getSlowestEndpoints(10),
  };
};

/**
 * Get status code distribution
 */
const getStatusCodeDistribution = () => {
  const distribution: Record<string, number> = {};

  for (const metric of metricsStore) {
    const statusRange = `${Math.floor(metric.status / 100)}xx`;
    distribution[statusRange] = (distribution[statusRange] || 0) + 1;
  }

  return distribution;
};

/**
 * Get slowest endpoints
 * @param limit - Number of endpoints to return
 */
const getSlowestEndpoints = (limit = 10) => {
  const endpointStats: Record<
    string,
    { count: number; totalDuration: number; avgDuration: number }
  > = {};

  for (const metric of metricsStore) {
    const key = `${metric.method} ${metric.url}`;
    if (!endpointStats[key]) {
      endpointStats[key] = { count: 0, totalDuration: 0, avgDuration: 0 };
    }
    endpointStats[key].count++;
    endpointStats[key].totalDuration += metric.duration;
  }

  for (const key in endpointStats) {
    const stat = endpointStats[key];
    if (stat) {
      stat.avgDuration =
        Math.round((stat.totalDuration / stat.count) * 100) / 100;
    }
  }

  return Object.entries(endpointStats)
    .sort(([, a], [, b]) => b.avgDuration - a.avgDuration)
    .slice(0, limit)
    .map(([endpoint, stats]) => ({
      endpoint,
      ...stats,
    }));
};

/**
 * Get recent metrics
 * @param limit - Number of recent metrics to return
 */
export const getRecentMetrics = (limit = 50): PerformanceMetrics[] => {
  return metricsStore.slice(-limit);
};

/**
 * Clear metrics store
 */
export const clearMetrics = () => {
  metricsStore.length = 0;
};
