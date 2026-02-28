"use client"

import { useState, useEffect } from "react"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"

export interface LiveLocation {
    id: string
    name: string
    type: 'driver' | 'user'
    lat: number
    lng: number
    status: string
    vehicleType?: string
    lastUpdated: any
    isOnline: boolean
}

export function useLiveLocations() {
    const [locations, setLocations] = useState<LiveLocation[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Subscribe to active drivers' locations
        const driversQuery = query(
            collection(db, "drivers"),
            where("status", "==", "verified"),
            where("isOnline", "==", true)
        )

        const unsubscribeDrivers = onSnapshot(driversQuery, (snapshot) => {
            const driverLocations: LiveLocation[] = []

            snapshot.forEach((doc) => {
                const data = doc.data()
                if (data.currentLocation?.latitude && data.currentLocation?.longitude) {
                    // Clean vehicle type for consistent grouping later
                    let vType = (data.vehicleType || "unknown");
                    // Assuming the data comes as "Bike taxi", "E-Rikshaw", etc.
                    // We'll keep it as is, but lowercase it for internal consistency if needed
                    // Actually, keeping the exact casing from DB is safer for direct mapping

                    driverLocations.push({
                        id: doc.id,
                        name: data.name || "Driver",
                        type: 'driver',
                        lat: data.currentLocation.latitude,
                        lng: data.currentLocation.longitude,
                        status: data.status,
                        vehicleType: vType,
                        lastUpdated: data.currentLocation.lastUpdated,
                        isOnline: data.isOnline
                    })
                }
            })

            setLocations(prev => {
                const others = prev.filter(loc => loc.type !== 'driver')
                return [...others, ...driverLocations]
            })

            setLoading(false)
        }, (error) => {
            console.error("Error fetching driver locations:", error)
        })

        // Subscribe to all users to find those with locations
        const usersQuery = query(collection(db, "users"))

        const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
            const userLocations: LiveLocation[] = []

            snapshot.forEach((doc) => {
                const data = doc.data()

                if (data.currentLocation) {
                    // Try to get lat/lng from various potential structures
                    const lat = data.currentLocation.latitude ?? data.currentLocation._lat;
                    const lng = data.currentLocation.longitude ?? data.currentLocation._long;

                    if (typeof lat === 'number' && typeof lng === 'number') {
                        userLocations.push({
                            id: doc.id,
                            name: data.name || data.phoneNumber || "User",
                            type: 'user',
                            lat: lat,
                            lng: lng,
                            status: 'active',
                            lastUpdated: data.lastLocationUpdate || data.currentLocation.lastUpdated || null,
                            isOnline: true
                        })
                    }
                }
            })

            console.log(`Updated user locations: ${userLocations.length} active users found.`);

            setLocations(prev => {
                const others = prev.filter(loc => loc.type !== 'user')
                return [...others, ...userLocations]
            })
        }, (error) => {
            console.error("Error fetching user locations:", error)
        })

        return () => {
            unsubscribeDrivers()
            unsubscribeUsers()
        }
    }, [])

    return {
        locations,
        loading,
        drivers: locations.filter(loc => loc.type === 'driver'),
        users: locations.filter(loc => loc.type === 'user')
    }
}
