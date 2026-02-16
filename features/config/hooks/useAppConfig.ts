
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
        const unsubscribe = onSnapshot(doc(db, "config", "general"), (doc) => {
            if (doc.exists()) {
                setConfig(doc.data() as AppConfig)
            } else {
                // Create default if not exists
                setDoc(doc.ref, {
                    maintenanceMode: false,
                    platformVersion: "1.0.0"
                })
            }
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
