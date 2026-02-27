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

            if (driverLocations.length > 0) {
                console.log(`📍 LiveMap: Found ${driverLocations.length} online verified drivers:`,
                    driverLocations.map(d => `${d.name} (${d.id})`));
            }

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
