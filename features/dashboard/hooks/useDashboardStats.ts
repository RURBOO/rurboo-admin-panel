"use client"

import { useState, useEffect } from "react"
import { collection, query, where, getCountFromServer, getDocs, Timestamp, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"

export interface RevenuePoint {
    date: string
    value: number
}

export interface DashboardStats {
    totalRevenue: number
    activeDrivers: number
    totalUsers: number
    activeRides: number
    revenueData: RevenuePoint[]
    loading: boolean
}

export function useDashboardStats() {
    const [stats, setStats] = useState<DashboardStats>({
        totalRevenue: 0,
        activeDrivers: 0,
        totalUsers: 0,
        activeRides: 0,
        revenueData: [],
        loading: true
    })

    useEffect(() => {
        let isMounted = true

        const fetchStats = async () => {
            try {
                // Get Active Drivers Count
                const driversQuery = query(
                    collection(db, "drivers"),
                    where("status", "==", "verified")
                )
                const driversSnapshot = await getCountFromServer(driversQuery)
                const activeDriversCount = driversSnapshot.data().count

                // Get Total Users Count
                const usersSnapshot = await getCountFromServer(collection(db, "users"))
                const totalUsersCount = usersSnapshot.data().count

                // Get Active Rides Count (status = 'started' or 'accepted')
                const activeRidesQuery = query(
                    collection(db, "rides"),
                    where("status", "in", ["started", "accepted"])
                )
                const activeRidesSnapshot = await getCountFromServer(activeRidesQuery)
                const activeRidesCount = activeRidesSnapshot.data().count

                // Calculate Total Revenue (all time) & 7-Day History
                // Note: For production with thousands of rides, this aggregation should move to a Cloud Function.
                // For now, client-side aggregation is acceptable for the admin panel.

                const now = new Date()
                const sevenDaysAgo = new Date()
                sevenDaysAgo.setDate(now.getDate() - 7)

                // Fetch all completed rides for total revenue
                // Optimally we should keep a running total in a metadata document, but for now:
                const completedRidesQuery = query(
                    collection(db, "rides"),
                    where("status", "==", "completed")
                )
                const completedRidesSnapshot = await getDocs(completedRidesQuery)

                let totalRevenue = 0
                const dailyRevenueMap = new Map<string, number>()

                // Initialize last 7 days with 0
                for (let i = 6; i >= 0; i--) {
                    const d = new Date()
                    d.setDate(now.getDate() - i)
                    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    dailyRevenueMap.set(dateStr, 0)
                }

                completedRidesSnapshot.docs.forEach((doc) => {
                    const data = doc.data()
                    const fare = data.fare || 0
                    totalRevenue += fare

                    // Check if ride is within last 7 days for chart
                    if (data.createdAt) {
                        const rideDate = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
                        if (rideDate >= sevenDaysAgo) {
                            const dateStr = rideDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                            if (dailyRevenueMap.has(dateStr)) {
                                dailyRevenueMap.set(dateStr, (dailyRevenueMap.get(dateStr) || 0) + fare)
                            }
                        }
                    }
                })

                const revenueData = Array.from(dailyRevenueMap.entries()).map(([date, value]) => ({
                    date,
                    value
                }))

                if (isMounted) {
                    setStats({
                        totalRevenue,
                        activeDrivers: activeDriversCount,
                        totalUsers: totalUsersCount,
                        activeRides: activeRidesCount,
                        revenueData,
                        loading: false
                    })
                }
            } catch (error) {
                console.error("Error fetching dashboard stats:", error)
                if (isMounted) {
                    setStats(prev => ({ ...prev, loading: false }))
                }
            }
        }

        fetchStats()

        // Refresh stats every 60 seconds
        const interval = setInterval(fetchStats, 60000)

        return () => {
            isMounted = false
            clearInterval(interval)
        }
    }, [])

    return stats
}
