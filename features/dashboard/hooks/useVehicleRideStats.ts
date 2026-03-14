"use client"

import { useState, useEffect } from "react"
import { collection, query, where, getDocs, Timestamp, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"

export interface VehicleRideStats {
    vehicleType: string
    totalRides: number
    todayRides: number
}

export interface RideStatistics {
    totalRides: number
    todayRides: number
    vehicleStats: VehicleRideStats[]
    loading: boolean
}

const vehicleTypes = [
    "BIKE_TAXI",
    "AUTO_RICKSHAW",
    "E_RICKSHAW",
    "CAR_MINI",
    "SUV_XL",
    "TRUCK_CARRIER"
]

export function useVehicleRideStats() {
    const [stats, setStats] = useState<RideStatistics>({
        totalRides: 0,
        todayRides: 0,
        vehicleStats: [],
        loading: true
    })

    useEffect(() => {
        let isMounted = true

        const fetchRideStats = async () => {
            try {
                // Get today's start timestamp (00:00:00)
                const now = new Date()
                const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
                const todayTimestamp = Timestamp.fromDate(todayStart)

                // Set up real-time listener for today's completed rides
                const ridesRef = collection(db, "rideRequests")
                const todayCompletedQuery = query(
                    ridesRef,
                    where("status", "==", "completed"),
                    where("createdAt", ">=", todayTimestamp)
                )

                const unsubscribe = onSnapshot(todayCompletedQuery, async (snapshot) => {
                    if (!isMounted) return

                    const todayRides = snapshot.size
                    
                    // We still need total rides. This can be heavy if we use onSnapshot on all lifetime rides.
                    // For now, fetch lifetime stats once, and keep today's real-time.
                    const allCompletedQuery = query(ridesRef, where("status", "==", "completed"))
                    const allRidesSnapshot = await getDocs(allCompletedQuery)
                    const totalRides = allRidesSnapshot.size

                    // Calculate vehicle-specific stats based on the latest today snapshot
                    const vehicleMap = new Map<string, { total: number, today: number }>()
                    vehicleTypes.forEach(v => vehicleMap.set(v, { total: 0, today: 0 }))

                    allRidesSnapshot.forEach(doc => {
                         const vType = doc.data().vehicleType || 'UNKNOWN'
                         if (vehicleMap.has(vType)) {
                              vehicleMap.get(vType)!.total++
                         }
                    })

                    snapshot.forEach(doc => {
                         const vType = doc.data().vehicleType || 'UNKNOWN'
                         if (vehicleMap.has(vType)) {
                              vehicleMap.get(vType)!.today++
                         }
                    })

                    const vehicleStats: VehicleRideStats[] = vehicleTypes.map(v => ({
                        vehicleType: v,
                        totalRides: vehicleMap.get(v)!.total,
                        todayRides: vehicleMap.get(v)!.today
                    }))

                    setStats({
                        totalRides,
                        todayRides,
                        vehicleStats,
                        loading: false
                    })
                }, (error) => {
                     console.error("Error observing ride statistics:", error)
                })

                if (isMounted) setStats(prev => ({ ...prev, loading: false }))
                
                return () => unsubscribe()

            } catch (error) {
                console.error("Error setting up ride statistics listener:", error)
                if (isMounted) {
                    setStats(prev => ({ ...prev, loading: false }))
                }
            }
        }

        const cleanupPromise = fetchRideStats()

        return () => {
            isMounted = false
            cleanupPromise.then(cleanup => { if(cleanup) cleanup() })
        }
    }, [])

    return stats
}
