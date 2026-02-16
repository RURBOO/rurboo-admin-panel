"use client"

import { useState, useEffect } from "react"
import { collection, query, where, getDocs, Timestamp, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"

export type TimePeriod = 'daily' | 'weekly' | 'monthly' | '3months' | '6months' | 'yearly'

export interface OnboardingData {
    date: string
    count: number
}

export interface UserOnboardingStats {
    period: TimePeriod
    data: OnboardingData[]
    totalInPeriod: number
    loading: boolean
}

export function useUserOnboarding(period: TimePeriod = 'daily') {
    const [stats, setStats] = useState<UserOnboardingStats>({
        period,
        data: [],
        totalInPeriod: 0,
        loading: true
    })

    useEffect(() => {
        let isMounted = true

        const fetchOnboardingStats = async () => {
            try {
                const now = new Date()
                let startDate: Date
                let groupBy: 'day' | 'week' | 'month' = 'day'

                // Calculate start date based on period
                switch (period) {
                    case 'daily':
                        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30) // Last 30 days
                        groupBy = 'day'
                        break
                    case 'weekly':
                        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 84) // Last 12 weeks
                        groupBy = 'week'
                        break
                    case 'monthly':
                        startDate = new Date(now.getFullYear(), now.getMonth() - 12, 1) // Last 12 months
                        groupBy = 'month'
                        break
                    case '3months':
                        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1)
                        groupBy = 'month'
                        break
                    case '6months':
                        startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1)
                        groupBy = 'month'
                        break
                    case 'yearly':
                        startDate = new Date(now.getFullYear() - 1, 0, 1)
                        groupBy = 'month'
                        break
                    default:
                        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30)
                        groupBy = 'day'
                }

                const startTimestamp = Timestamp.fromDate(startDate)

                // Fetch users created since start date
                const usersQuery = query(
                    collection(db, "users"),
                    where("createdAt", ">=", startTimestamp),
                    orderBy("createdAt", "asc")
                )

                const usersSnapshot = await getDocs(usersQuery)

                // Group users by date
                const groupedData: { [key: string]: number } = {}
                let total = 0

                usersSnapshot.forEach((doc) => {
                    const data = doc.data()
                    if (data.createdAt) {
                        const date = data.createdAt.toDate()
                        let key: string

                        if (groupBy === 'day') {
                            key = date.toISOString().split('T')[0] // YYYY-MM-DD
                        } else if (groupBy === 'week') {
                            const weekStart = new Date(date)
                            weekStart.setDate(date.getDate() - date.getDay()) // Start of week
                            key = weekStart.toISOString().split('T')[0]
                        } else { // month
                            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
                        }

                        groupedData[key] = (groupedData[key] || 0) + 1
                        total++
                    }
                })

                // Convert to array format
                const dataArray: OnboardingData[] = Object.entries(groupedData).map(([date, count]) => ({
                    date,
                    count
                }))

                if (isMounted) {
                    setStats({
                        period,
                        data: dataArray,
                        totalInPeriod: total,
                        loading: false
                    })
                }
            } catch (error) {
                console.error("Error fetching user onboarding stats:", error)
                if (isMounted) {
                    setStats(prev => ({ ...prev, loading: false }))
                }
            }
        }

        fetchOnboardingStats()

        // Refresh every 5 minutes
        const interval = setInterval(fetchOnboardingStats, 300000)

        return () => {
            isMounted = false
            clearInterval(interval)
        }
    }, [period])

    return stats
}
