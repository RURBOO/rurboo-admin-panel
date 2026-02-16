
import { useState } from "react"
import { addDoc, collection, doc, writeBatch, serverTimestamp, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

export type TargetAudience = 'all_users' | 'all_drivers' | 'everyone' | 'specific' | 'active_users' | 'blocked_drivers'

interface NotificationPayload {
    title: string
    body: string
    imageUrl?: string
    targetAudience: TargetAudience
    targetIds?: string[] // For specific users/drivers
}

export function useNotificationSender() {
    const [sending, setSending] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const sendNotification = async (payload: NotificationPayload) => {
        setSending(true)
        setError(null)
        try {
            const notificationData = {
                title: payload.title,
                body: payload.body,
                imageUrl: payload.imageUrl || null,
                createdAt: serverTimestamp(),
                read: false,
                forceBroadcast: payload.targetAudience !== 'specific' // Helper for client-side filtering if needed
            }

            // Case 1: Specific Users (Batch Write)
            if (payload.targetAudience === 'specific' && payload.targetIds && payload.targetIds.length > 0) {
                const batch = writeBatch(db)

                payload.targetIds.forEach(id => {
                    const docRef = doc(collection(db, "notifications"))
                    batch.set(docRef, {
                        ...notificationData,
                        userId: id, // Assuming ID is UserID for now, could be DriverID too. 
                        // In a real generic system, we might need a 'type' field or check the ID source.
                        // For simplicity, we'll store it as 'targetId' or generic 'userId' which rules check.
                        targetId: id
                    })
                })

                await batch.commit()
            }
            // Case 2: Broadcast (Single Doc with Metadata)
            else {
                // We create a single document that clients subscribe to based on the 'targetAudience' field.
                await addDoc(collection(db, "notifications"), {
                    ...notificationData,
                    targetAudience: payload.targetAudience, // 'all_users', 'all_drivers', etc.
                    isBroadcast: true
                })
            }

            return { success: true }
        } catch (err: any) {
            console.error("Error sending notification:", err)
            setError(err.message)
            return { success: false, error: err.message }
        } finally {
            setSending(false)
        }
    }

    return { sendNotification, sending, error }
}
