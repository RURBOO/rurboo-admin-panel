"use client"

import { useState, useEffect } from "react"
import { doc, onSnapshot, updateDoc, setDoc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export interface RateConfig {
    base_fare: number;
    per_km: number;
    night_charge: number;
}

export interface RatesData {
    commission_percent: number;
    [vehicleType: string]: RateConfig | number;
}

export function useRates() {
    const [rates, setRates] = useState<RatesData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const unsubscribe = onSnapshot(doc(db, "config", "rates"), (doc) => {
            if (doc.exists()) {
                setRates(doc.data() as RatesData)
            } else {
                // Initialize with defaults if not exists
                setRates(null) // or default structure
            }
            setLoading(false)
        }, (error) => {
            console.error("Error fetching rates:", error)
            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    const updateRates = async (newRates: RatesData) => {
        try {
            await setDoc(doc(db, "config", "rates"), newRates)
        } catch (error) {
            console.error("Error updating rates:", error)
            throw error
        }
    }

    return { rates, loading, updateRates }
}
