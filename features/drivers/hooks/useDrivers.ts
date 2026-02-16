"use client"

import { useState, useEffect } from "react"
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Driver } from "@/lib/types"

export function useDrivers() {
    const [drivers, setDrivers] = useState<Driver[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Listen to 'drivers' collection
        const q = query(collection(db, "drivers"))

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const driversData: Driver[] = []
            snapshot.forEach((doc) => {
                driversData.push({
                    id: doc.id,
                    ...doc.data(),
                } as Driver)
            })
            setDrivers(driversData)
            setLoading(false)
        }, (error) => {
            console.error("Error fetching drivers:", error)
            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    const updateDriverStatus = async (driverId: string, status: string) => {
        try {
            await updateDoc(doc(db, "drivers", driverId), {
                status: status,
                verificationStatus: status === 'active' ? 'approved' : status === 'suspended' ? 'rejected' : 'pending' // Simplified mapping
            })
        } catch (error) {
            console.error("Error updating driver status:", error)
            throw error
        }
    }

    return { drivers, loading, updateDriverStatus }
}
