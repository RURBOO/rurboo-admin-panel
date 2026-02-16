"use client"

import { useState, useEffect } from "react"
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore"
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

                // Fetch all rides
                const ridesRef = collection(db, "rides")
                const allRidesSnapshot = await getDocs(ridesRef)
                const totalRides = allRidesSnapshot.size

                // Fetch today's rides
                const todayQuery = query(
                    ridesRef,
                    where("createdAt", ">=", todayTimestamp)
                )
                const todayRidesSnapshot = await getDocs(todayQuery)
                const todayRides = todayRidesSnapshot.size

                // Calculate vehicle-specific stats
                const vehicleStats: VehicleRideStats[] = []

                for (const vehicleType of vehicleTypes) {
                    // Total rides for this vehicle type
                    const totalVehicleQuery = query(
                        ridesRef,
                        where("vehicleType", "==", vehicleType)
                    )
                    const totalVehicleDocs = await getDocs(totalVehicleQuery)

                    // Today's rides for this vehicle type
                    const todayVehicleQuery = query(
                        ridesRef,
                        where("vehicleType", "==", vehicleType),
                        where("createdAt", ">=", todayTimestamp)
                    )
                    const todayVehicleDocs = await getDocs(todayVehicleQuery)

                    vehicleStats.push({
                        vehicleType,
                        totalRides: totalVehicleDocs.size,
                        todayRides: todayVehicleDocs.size
                    })
                }

                if (isMounted) {
                    setStats({
                        totalRides,
                        todayRides,
                        vehicleStats,
                        loading: false
                    })
                }
            } catch (error) {
                console.error("Error fetching ride statistics:", error)
                if (isMounted) {
                    setStats(prev => ({ ...prev, loading: false }))
                }
            }
        }

        fetchRideStats()

        // Refresh every 60 seconds
        const interval = setInterval(fetchRideStats, 60000)

        return () => {
            isMounted = false
            clearInterval(interval)
        }
    }, [])

    return stats
}
