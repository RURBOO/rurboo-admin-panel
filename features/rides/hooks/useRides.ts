"use client"

import { useState, useEffect } from "react"
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Ride } from "@/lib/types"

export function useRides() {
    const [rides, setRides] = useState<Ride[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Listen to 'rideRequests' collection, ordered by createdAt desc
        const q = query(
            collection(db, "rideRequests"),
            orderBy("createdAt", "desc"),
            limit(50)
        )

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const ridesData: Ride[] = []
            snapshot.forEach((doc) => {
                const data = doc.data()
                ridesData.push({
                    id: doc.id,
                    ...data,
                    // Parse createdAt depending on what format exists, fallback to now
                    timestamp: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleString() : 'Now'
                } as Ride)
            })
            setRides(ridesData)
            setLoading(false)
        }, (error) => {
            console.error("Error fetching rides:", error)
            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    return { rides, loading }
}
