"use client"

import { useState, useEffect } from "react"
import { collection, query, where, getCountFromServer, getDocs, Timestamp, orderBy, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"

export interface RevenuePoint {
    date: string
    value: number
}

export interface VehicleRevenue {
    type: string
    value: number
}

export interface RegistrationPoint {
    date: string
    users: number
    drivers: number
}

export interface DashboardStats {
    totalRevenue: number
    platformRevenue: number
    activeDrivers: number
    totalUsers: number
    activeRides: number
    revenueData: RevenuePoint[]
    vehicleRevenueData: VehicleRevenue[]
    ridesBreakdownData: { name: string; value: number }[]
    registrationGrowthData: RegistrationPoint[]
    loading: boolean
}


export function useDashboardStats() {
    const [stats, setStats] = useState<DashboardStats>({
        totalRevenue: 0,
        platformRevenue: 0,
        activeDrivers: 0,
        totalUsers: 0,
        activeRides: 0,
        revenueData: [],
        vehicleRevenueData: [],
        ridesBreakdownData: [],
        registrationGrowthData: [],
        loading: true
    })

    useEffect(() => {
        let isMounted = true

        const fetchStats = async () => {
            try {
                // Get Active Drivers Count
                const driversQuery = query(
                    collection(db, "drivers"),
                    where("isOnline", "==", true)
                )
                const driversSnapshot = await getCountFromServer(driversQuery)
                const activeDriversCount = driversSnapshot.data().count

                // Get Total Users Count
                const usersSnapshot = await getCountFromServer(collection(db, "users"))
                const totalUsersCount = usersSnapshot.data().count

                // Get Active Rides Count 
                const activeRidesQuery = query(
                    collection(db, "rideRequests"),
                    where("status", "in", ["pending", "accepted", "in_progress", "arrived", "started"])
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
                let platformRevenue = 0
                const dailyRevenueMap = new Map<string, number>()
                const vehicleRevenueMap = new Map<string, number>()

                // Initialize last 7 days with 0
                for (let i = 6; i >= 0; i--) {
                    const d = new Date()
                    d.setDate(now.getDate() - i)
                    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    dailyRevenueMap.set(dateStr, 0)
                }

                completedRidesSnapshot.docs.forEach((doc) => {
                    const data = doc.data()
                    // Revenue logic: prioritize finalFare, then fare
                    const fare = data.finalFare || data.fare || 0
                    // Commission logic: prioritize commission field, fallback to 20% of fare
                    const commission = data.commission !== undefined ? data.commission : (fare * 0.2)

                    totalRevenue += fare
                    platformRevenue += commission

                    // Vehicle breakdown
                    const vType = data.vehicleType || 'UNKNOWN'
                    vehicleRevenueMap.set(vType, (vehicleRevenueMap.get(vType) || 0) + fare)

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

                // Get Rides Breakdown (Completed vs Cancelled)
                const completedCount = await getCountFromServer(query(collection(db, "rideRequests"), where("status", "==", "completed")))
                const cancelledCount = await getCountFromServer(query(collection(db, "rideRequests"), where("status", "==", "cancelled")))
                const ridesBreakdownData = [
                    { name: 'Completed', value: completedCount.data().count },
                    { name: 'Cancelled', value: cancelledCount.data().count }
                ]

                // Get Registration Growth over last 7 days
                const recentUsersQuery = query(collection(db, "users"), where("createdAt", ">=", Timestamp.fromDate(sevenDaysAgo)))
                const recentDriversQuery = query(collection(db, "drivers"), where("createdAt", ">=", Timestamp.fromDate(sevenDaysAgo)))

                const [recentUsersSnap, recentDriversSnap] = await Promise.all([
                    getDocs(recentUsersQuery),
                    getDocs(recentDriversQuery)
                ])

                const growthMap = new Map<string, { users: number, drivers: number }>()

                for (let i = 6; i >= 0; i--) {
                    const d = new Date()
                    d.setDate(now.getDate() - i)
                    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    growthMap.set(dateStr, { users: 0, drivers: 0 })
                }

                recentUsersSnap.docs.forEach(doc => {
                    const data = doc.data()
                    if (data.createdAt) {
                        const dateObj = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
                        const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        if (growthMap.has(dateStr)) {
                            growthMap.set(dateStr, { ...growthMap.get(dateStr)!, users: growthMap.get(dateStr)!.users + 1 })
                        }
                    }
                })

                recentDriversSnap.docs.forEach(doc => {
                    const data = doc.data()
                    if (data.createdAt) {
                        const dateObj = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
                        const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        if (growthMap.has(dateStr)) {
                            growthMap.set(dateStr, { ...growthMap.get(dateStr)!, drivers: growthMap.get(dateStr)!.drivers + 1 })
                        }
                    }
                })

                const registrationGrowthData = Array.from(growthMap.entries()).map(([date, counts]) => ({
                    date,
                    users: counts.users,
                    drivers: counts.drivers
                }))

                const revenueData = Array.from(dailyRevenueMap.entries()).map(([date, value]) => ({
                    date,
                    value
                }))

                const vehicleRevenueData = Array.from(vehicleRevenueMap.entries()).map(([type, value]) => ({
                    type,
                    value
                })).sort((a, b) => b.value - a.value)

                if (isMounted) {
                    setStats({
                        totalRevenue,
                        platformRevenue,
                        activeDrivers: activeDriversCount,
                        totalUsers: totalUsersCount,
                        activeRides: activeRidesCount,
                        revenueData,
                        vehicleRevenueData,
                        ridesBreakdownData,
                        registrationGrowthData,
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

        // Real-time listener for active rides
        const activeRidesQuery = query(
            collection(db, "rideRequests"),
            where("status", "in", ["pending", "accepted", "in_progress", "arrived", "started"])
        )
        const unsubscribeRides = onSnapshot(activeRidesQuery, (snapshot) => {
            if (isMounted) setStats(prev => ({ ...prev, activeRides: snapshot.size }))
        })

        // Real-time listener for active drivers
        const activeDriversQuery = query(
            collection(db, "drivers"),
            where("isOnline", "==", true)
        )
        const unsubscribeDrivers = onSnapshot(activeDriversQuery, (snapshot) => {
            if (isMounted) setStats(prev => ({ ...prev, activeDrivers: snapshot.size }))
        })

        // Refresh heavy stats periodically (30s)
        const interval = setInterval(fetchStats, 30000)

        return () => {
            isMounted = false
            clearInterval(interval)
            unsubscribeRides()
            unsubscribeDrivers()
        }
    }, [])

    return stats
}
