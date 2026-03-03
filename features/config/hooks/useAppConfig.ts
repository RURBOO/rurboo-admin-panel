
import { useState, useEffect } from "react"
import { doc, onSnapshot, setDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface AppConfig {
    maintenanceMode: boolean
    platformVersion: string
}

export function useAppConfig() {
    const [config, setConfig] = useState<AppConfig>({
        maintenanceMode: false,
        platformVersion: "1.0.0"
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
                setDoc(docRef, {
                    maintenanceMode: false,
                    platformVersion: "1.0.0"
                }).catch(console.error)
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

    return { config, loading, toggleMaintenanceMode }
}
