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

                // Get Active Rides Count (status = 'pending', 'accepted', 'in_progress', 'arrived')
                const activeRidesQuery = query(
                    collection(db, "rideRequests"),
                    where("status", "in", ["pending", "accepted", "in_progress", "arrived"])
                )
                const activeRidesSnapshot = await getCountFromServer(activeRidesQuery)
                const activeRidesCount = activeRidesSnapshot.data().count

                const now = new Date()
                const sevenDaysAgo = new Date()
                sevenDaysAgo.setDate(now.getDate() - 7)

                // Fetch all completed rides for total revenue
                const completedRidesQuery = query(
                    collection(db, "rideRequests"),
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
                    // Driver app sets 'finalFare', User app sets 'fare' initially.
                    const fare = data.finalFare || data.fare || 0
                    totalRevenue += fare

                    // Check if ride is within last 7 days for chart using 'createdAt'
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
