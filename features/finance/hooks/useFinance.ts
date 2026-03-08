"use client"

import { useState, useEffect } from "react"
import { collection, onSnapshot, query, where, orderBy, limit, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Ride } from "@/lib/types"
import { DateRange } from "react-day-picker"

export function useFinance(dateRange?: DateRange) {
    const [stats, setStats] = useState({
        totalRevenue: 0,
        platformCommission: 0,
        pendingSettlements: 0,
        recentTransactions: [] as any[],
        ledgerEntries: [] as any[]
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let q = query(
            collection(db, "rideRequests"),
            where("status", "in", ["completed", "closed"])
        )

        if (dateRange?.from) {
            if (dateRange.to) {
                q = query(q,
                    where("createdAt", ">=", Timestamp.fromDate(dateRange.from)),
                    where("createdAt", "<=", Timestamp.fromDate(new Date(dateRange.to.setHours(23, 59, 59, 999))))
                )
            } else {
                q = query(q, where("createdAt", ">=", Timestamp.fromDate(dateRange.from)))
            }
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            let totalRev = 0
            let totalComm = 0
            const transactions: any[] = []

            snapshot.forEach((doc) => {
                const data = doc.data()
                const fare = parseFloat(data.fare || "0")
                const commission = fare * 0.20 // 20% Commission

                totalRev += fare
                totalComm += commission

                // Mocking a transaction record from the ride
                transactions.push({
                    id: `TXN-${doc.id.substring(0, 5)}`,
                    driverId: data.driverId,
                    rideId: doc.id,
                    amount: `₹ ${fare.toFixed(2)}`,
                    platformFee: `₹ ${commission.toFixed(2)}`,
                    status: 'settled', // Assuming completed rides are settled for this view
                    date: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleDateString() : 'N/A'
                })
            })

            // Sort transactions client-side
            transactions.sort((a, b) => {
                const timeA = new Date(a.date).getTime() || 0;
                const timeB = new Date(b.date).getTime() || 0;
                return timeB - timeA;
            });

            setStats(prev => ({
                ...prev,
                totalRevenue: totalRev,
                platformCommission: totalComm,
                pendingSettlements: 0,
                recentTransactions: transactions.slice(0, 50)
            }))
            setLoading(false)
        }, (error) => {
            console.error("Error fetching finance data:", error)
            setLoading(false)
        })

        // Fetch Real Ledger Entries
        let ledgerQ = query(collection(db, "ledger_entries"))

        if (dateRange?.from) {
            if (dateRange.to) {
                ledgerQ = query(ledgerQ,
                    where("timestamp", ">=", Timestamp.fromDate(dateRange.from)),
                    where("timestamp", "<=", Timestamp.fromDate(new Date(dateRange.to.setHours(23, 59, 59, 999))))
                )
            } else {
                ledgerQ = query(ledgerQ, where("timestamp", ">=", Timestamp.fromDate(dateRange.from)))
            }
        }

        // Add sorting constraints after range limits
        ledgerQ = query(ledgerQ, orderBy("timestamp", "desc"))

        if (!dateRange?.from) {
            ledgerQ = query(ledgerQ, limit(50))
        }

        const unsubscribeLedger = onSnapshot(ledgerQ, (snapshot) => {
            const entries: any[] = []
            snapshot.forEach(doc => {
                entries.push({ id: doc.id, ...doc.data() })
            })
            setStats(prev => ({ ...prev, ledgerEntries: entries }))
        })

        return () => {
            unsubscribe()
            unsubscribeLedger()
        }
    }, [])

    return { stats, loading }
}
