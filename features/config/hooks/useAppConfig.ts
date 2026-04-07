
import { useState, useEffect } from "react"
import { doc, onSnapshot, setDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface AppConfig {
    maintenanceMode: boolean
    platformVersion: string
    driver_search_radius_km: number
}

export function useAppConfig() {
    const [config, setConfig] = useState<AppConfig>({
        maintenanceMode: false,
        platformVersion: "1.0.0",
        driver_search_radius_km: 4.0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Define docRef OUTSIDE the snapshot callback to get the correct DocumentReference type
        const docRef = doc(db, "config", "general")

        const unsubscribe = onSnapshot(docRef, (snapshot) => {
            if (snapshot.exists()) {
                setConfig(snapshot.data() as AppConfig)
            } else {
                // Create default config if not exists
                setTimeout(() => {
                    setDoc(docRef, {
                        maintenanceMode: false,
                        platformVersion: "1.0.0",
                        driver_search_radius_km: 4.0
                    }, { merge: true }).catch(console.error)
                }, 100);
            }
            setLoading(false)
        }, (error) => {
            console.error("Error fetching app config:", error)
            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    const toggleMaintenanceMode = async (enabled: boolean) => {
        await updateDoc(doc(db, "config", "general"), {
            maintenanceMode: enabled
        })
    }

    const updateSearchRadius = async (radius: number) => {
        await updateDoc(doc(db, "config", "general"), {
            driver_search_radius_km: radius
        })
    }

    return { config, loading, toggleMaintenanceMode, updateSearchRadius }
}
