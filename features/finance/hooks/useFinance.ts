"use client"

import { useState, useEffect } from "react"
import { collection, onSnapshot, query, where, orderBy, limit } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Ride } from "@/lib/types"

export function useFinance() {
    const [stats, setStats] = useState({
        totalRevenue: 0,
        platformCommission: 0,
        pendingSettlements: 0,
        recentTransactions: [] as any[],
        ledgerEntries: [] as any[]
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // We calculate finance from Completed Rides
        // In a real production app, you'd query a dedicated 'transactions' collection
        const q = query(
            collection(db, "rideRequests"),
            where("status", "in", ["completed", "closed"])
        )

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
        const ledgerQ = query(
            collection(db, "ledger_entries"),
            orderBy("timestamp", "desc"),
            limit(50)
        )
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
