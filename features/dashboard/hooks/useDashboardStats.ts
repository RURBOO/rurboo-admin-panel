"use client"

import { useState, useEffect } from "react"
import { collection, onSnapshot, query, where, getCountFromServer, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

export interface DashboardStats {
    totalRevenue: number
    activeDrivers: number
    totalUsers: number
    activeRides: number
    loading: boolean
}

export function useDashboardStats() {
    const [stats, setStats] = useState<DashboardStats>({
        totalRevenue: 0,
        activeDrivers: 0,
        totalUsers: 0,
        activeRides: 0,
        loading: true
    })

    useEffect(() => {
        let isMounted = true

        const fetchStats = async () => {
            try {
                // Get Active Drivers Count
                const driversQuery = query(
                    collection(db, "drivers"),
                    where("status", "==", "active")
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

                // Calculate Total Revenue (sum of completed rides' fares)
                const completedRidesQuery = query(
                    collection(db, "rides"),
                    where("status", "==", "completed")
                )
                const completedRidesDocs = await getDocs(completedRidesQuery)
                let totalRevenue = 0
                completedRidesDocs.forEach((doc) => {
                    const data = doc.data()
                    if (data.fare) {
                        totalRevenue += data.fare
                    }
                })

                if (isMounted) {
                    setStats({
                        totalRevenue,
                        activeDrivers: activeDriversCount,
                        totalUsers: totalUsersCount,
                        activeRides: activeRidesCount,
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

        // Refresh stats every 30 seconds
        const interval = setInterval(fetchStats, 30000)

        return () => {
            isMounted = false
            clearInterval(interval)
        }
    }, [])

    return stats
}
