import { Driver } from "@/lib/types";

export interface RiskAnalysis {
    score: number;
    level: 'low' | 'medium' | 'high' | 'critical';
    factors: string[];
}

/**
 * Calculates a 0-100 Risk Score for a driver.
 * 0 = Safe, 100 = Critical Risk.
 */
export function calculateDriverRiskScore(driver: Driver, metrics: { cancelRate: number, reportCount: number }): RiskAnalysis {
    let score = 0;
    const factors: string[] = [];

    // 1. Rating Factor (Max 30 pts)
    if (driver.rating && driver.rating < 4.0) {
        score += 30;
        factors.push("Extremely Low Rating (< 4.0)");
    } else if (driver.rating && driver.rating < 4.5) {
        score += 10;
        factors.push("Below Average Rating");
    }

    // 2. Cancellation Rate (Max 40 pts)
    if (metrics.cancelRate > 20) {
        score += 40;
        factors.push("High Cancellation Rate (> 20%)");
    } else if (metrics.cancelRate > 10) {
        score += 15;
        factors.push("Moderate Cancellation Rate (> 10%)");
    }

    // 3. User Reports (Max 50 pts - Critical)
    if (metrics.reportCount > 0) {
        score += 50;
        factors.push(`Flagged by Users (${metrics.reportCount} reports)`);
    }

    // 4. Status Check
    if (driver.status === 'suspended') {
        score = 100; // Already suspended
        factors.push("Account Suspended");
    }

    // Cap score at 100
    score = Math.min(score, 100);

    let level: RiskAnalysis['level'] = 'low';
    if (score > 80) level = 'critical';
    else if (score > 50) level = 'high';
    else if (score > 20) level = 'medium';

    return { score, level, factors };
}
