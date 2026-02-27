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
                    // Normalize vehicle type
                    let vType = (data.vehicleType || "unknown").toLowerCase();
                    if (vType.includes('bike')) vType = 'bike';
                    else if (vType.includes('auto')) vType = 'auto';
                    else if (vType.includes('car')) vType = 'car';

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

        // Subscribe to users with recent location updates
        const usersQuery = query(
            collection(db, "users"),
            where("currentLocation", "!=", null)
        )

        const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
            const userLocations: LiveLocation[] = []
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

            snapshot.forEach((doc) => {
                const data = doc.data()
                const lastUpdated = data.lastLocationUpdate?.toDate() || data.currentLocation?.lastUpdated?.toDate()

                // Only show users active in last 5 mins
                if (data.currentLocation?.latitude && data.currentLocation?.longitude &&
                    (!lastUpdated || lastUpdated > fiveMinutesAgo)) {
                    userLocations.push({
                        id: doc.id,
                        name: data.name || "User",
                        type: 'user',
                        lat: data.currentLocation.latitude,
                        lng: data.currentLocation.longitude,
                        status: 'active',
                        lastUpdated: data.lastLocationUpdate || data.currentLocation.lastUpdated,
                        isOnline: true
                    })
                }
            })

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
