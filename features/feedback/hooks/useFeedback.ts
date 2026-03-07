
import { useState, useEffect } from "react"
import { collection, query, getDocs, limit, doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export interface FeedbackItem {
    id: string
    userId?: string
    driverId?: string
    name?: string
    rating?: number
    message: string // suggestion or feedback text
    createdAt: any
    type: 'driver_feedback' | 'user_suggestion'
}

export function useFeedback() {
    const [suggestions, setSuggestions] = useState<FeedbackItem[]>([])
    const [driverFeedback, setDriverFeedback] = useState<FeedbackItem[]>([])
    const [loading, setLoading] = useState(true)

    const fetchData = async () => {
        setLoading(true)
        try {
            // Fetch User Suggestions
            // Note: In a real app, you might need to join with Users collection to get names if not stored in suggestion
            const suggestionsQuery = query(collection(db, "suggestions"), limit(50)) // Add orderBy('createdAt', 'desc') if index exists
            const suggestionsSnap = await getDocs(suggestionsQuery)
            const suggestionsData = await Promise.all(suggestionsSnap.docs.map(async (docSnap) => {
                const data = docSnap.data()
                let name = data.name;
                if (!name && data.userId) {
                    try {
                        const userDoc = await getDoc(doc(db, "users", data.userId));
                        if (userDoc.exists()) {
                            name = userDoc.data().name;
                        }
                    } catch (e) {
                        console.error("Error fetching user:", e);
                    }
                }
                return {
                    id: docSnap.id,
                    type: 'user_suggestion' as const,
                    ...data,
                    name: name || "Unknown User"
                }
            })) as FeedbackItem[]
            setSuggestions(suggestionsData)

            // Fetch Driver Feedback
            const feedbackQuery = query(collection(db, "feedback"), limit(50))
            const feedbackSnap = await getDocs(feedbackQuery)
            const feedbackData = await Promise.all(feedbackSnap.docs.map(async (docSnap) => {
                const data = docSnap.data()
                let name = data.name;
                if (!name && data.driverId) {
                    try {
                        const driverDoc = await getDoc(doc(db, "drivers", data.driverId));
                        if (driverDoc.exists()) {
                            name = driverDoc.data().name;
                        }
                    } catch (e) {
                        console.error("Error fetching driver:", e);
                    }
                }
                return {
                    id: docSnap.id,
                    type: 'driver_feedback' as const,
                    ...data,
                    name: name || "Unknown Driver"
                }
            })) as FeedbackItem[]
            setDriverFeedback(feedbackData)

        } catch (error) {
            console.error("Error fetching feedback:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    return { suggestions, driverFeedback, loading, refresh: fetchData }
}
