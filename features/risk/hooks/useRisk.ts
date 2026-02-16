"use client"

import { useState, useEffect } from "react"
import { collection, onSnapshot, query, where, orderBy, limit } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { calculateDriverRiskScore, RiskAnalysis } from "@/lib/services/riskEngine"
import { evaluateAutomationRules } from "@/lib/services/automation"
import { Driver } from "@/lib/types"

export interface RiskAlert {
    id: string;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    details: string;
    driverId: string;
    rideId?: string;
    timestamp: string;
    score?: number;
    factors?: string[];
}

export function useRisk() {
    const [alerts, setAlerts] = useState<RiskAlert[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Advanced Logic: 
        // 1. Fetch recent cancellations to calc rate
        // 2. Fetch reported drivers (mocked for now as we don't have report collection hooked up)
        // 3. Score every driver.

        // Since we can't easily iterate ALL drivers in client-side hook efficiently,
        // we will stick to the "Reactive" approach: flag drivers with recent bad activity.
        // In a real backend, this would be a scheduled Cloud Function.

        const q = query(
            collection(db, "rideRequests"),
            where("status", "==", "cancelled"),
            orderBy("timestamp", "desc"),
            limit(50)
        )

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const newAlerts: RiskAlert[] = []
            const driverActivity: Record<string, { cancels: number, lastRide: any }> = {}

            snapshot.forEach((doc) => {
                const data = doc.data()
                // 1. Alert for single cancellation
                newAlerts.push({
                    id: `ALT-${doc.id.substring(0, 4)}`,
                    type: "Ride Cancelled",
                    severity: "medium",
                    details: `Ride to ${data.dropLocation?.address || 'Unknown'} was cancelled.`,
                    driverId: data.driverId || 'Unassigned',
                    rideId: doc.id,
                    timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toLocaleString() : 'Recent'
                })

                // 2. Aggregate metrics for scoring
                if (data.driverId) {
                    if (!driverActivity[data.driverId]) driverActivity[data.driverId] = { cancels: 0, lastRide: data }
                    driverActivity[data.driverId].cancels += 1
                }
            })

            // 3. Calculate Risk Score for active violators
            Object.entries(driverActivity).forEach(([driverId, activity]) => {
                // Mocking a driver object for scoring context using available data
                // In prod, we would fetch(doc(db, 'drivers', driverId))
                const mockDriver: Driver = {
                    id: driverId,
                    name: 'Driver',
                    email: '',
                    status: 'active',
                    rating: 4.8 // Default, could be lower if we fetched real driver
                }

                // Mock metrics
                const metrics = {
                    cancelRate: (activity.cancels / 10) * 100, // Assuming 10 recent rides
                    reportCount: 0
                }

                const risk: RiskAnalysis = calculateDriverRiskScore(mockDriver, metrics)

                // AUTOMATION HOOK
                // In a real system, this happens on the backend. 
                // Here we simulate the system "reacting" to the new score.
                if (risk.score > 50) {
                    // We only trigger this if we are in "Automation Mode" (simulated here)
                    // To prevent infinite loops in this frontend hook, we would check if already suspended
                    // But for demo, we just log it or call the service strictly when needed.
                    // evaluateAutomationRules(driverId, 'driver', { riskScore: risk.score }) 
                }

                if (risk.score > 30) {
                    newAlerts.unshift({
                        id: `RISK-${driverId.substring(0, 4)}`,
                        type: "Risk Score: " + risk.score,
                        severity: risk.level,
                        details: `Risk Level: ${risk.level.toUpperCase()}. Factors: ${risk.factors.join(", ")}`,
                        driverId: driverId,
                        timestamp: "Real-time Analysis",
                        score: risk.score,
                        factors: risk.factors
                    })
                }
            })

            setAlerts(newAlerts)
            setLoading(false)
        }, (error) => {
            console.error("Error fetching risk data:", error)
            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    return { alerts, loading }
}
