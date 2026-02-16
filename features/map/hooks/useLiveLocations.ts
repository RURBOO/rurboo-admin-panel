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
            where("status", "==", "active"),
            where("isOnline", "==", true)
        )

        const unsubscribeDrivers = onSnapshot(driversQuery, (snapshot) => {
            const driverLocations: LiveLocation[] = []

            snapshot.forEach((doc) => {
                const data = doc.data()
                if (data.currentLocation?.latitude && data.currentLocation?.longitude) {
                    driverLocations.push({
                        id: doc.id,
                        name: data.name || "Driver",
                        type: 'driver',
                        lat: data.currentLocation.latitude,
                        lng: data.currentLocation.longitude,
                        status: data.status,
                        vehicleType: data.vehicleType,
                        lastUpdated: data.currentLocation.lastUpdated,
                        isOnline: data.isOnline
                    })
                }
            })

            setLocations(prev => {
                //Replace all driver locations
                const users = prev.filter(loc => loc.type === 'user')
                return [...users, ...driverLocations]
            })

            setLoading(false)
        }, (error) => {
            console.error("Error fetching live locations:", error)
            setLoading(false)
        })

        return () => unsubscribeDrivers()
    }, [])

    return {
        locations,
        loading,
        drivers: locations.filter(loc => loc.type === 'driver'),
        users: locations.filter(loc => loc.type === 'user')
    }
}
