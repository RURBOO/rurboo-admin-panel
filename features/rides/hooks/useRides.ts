"use client"

import { useState, useEffect } from "react"
import { collection, onSnapshot, query, orderBy, limit, where, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Ride } from "@/lib/types"
import { DateRange } from "react-day-picker"

export function useRides(dateRange?: DateRange) {
    const [rides, setRides] = useState<Ride[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Listen to 'rideRequests' collection
        let q = query(collection(db, "rideRequests"))

        if (dateRange?.from) {
            if (dateRange.to) {
                q = query(q,
                    where("createdAt", ">=", Timestamp.fromDate(dateRange.from)),
                    where("createdAt", "<=", Timestamp.fromDate(new Date(dateRange.to.setHours(23, 59, 59, 999))))
                )
            } else {
                q = query(q, where("createdAt", ">=", Timestamp.fromDate(dateRange.from)))
            }
        }

        // Apply limit based on whether it's filtered or not
        if (!dateRange?.from) {
            q = query(q, limit(100))
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const ridesData: Ride[] = []
            snapshot.forEach((doc) => {
                const data = doc.data()
                ridesData.push({
                    id: doc.id,
                    ...data,
                    // Normalize name fields from various possible keys
                    userName: data.userName || data.passengerName || data.riderName || undefined,
                    driverName: data.driverName || undefined,
                    cancelReason: data.cancelReason || data.cancellationReason || data.reason || undefined,
                    // Parse createdAt depending on what format exists, fallback to now
                    timestamp: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleString() : 'Now'
                } as Ride)
            })

            // Sort client-side to avoid Firestore composite index requirements
            ridesData.sort((a, b) => {
                const timeA = a.createdAt?.toMillis?.() || 0;
                const timeB = b.createdAt?.toMillis?.() || 0;
                return timeB - timeA;
            });

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
