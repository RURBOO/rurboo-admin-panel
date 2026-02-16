
import { useState, useEffect } from "react"
import { collection, query, getDocs, orderBy, limit } from "firebase/firestore"
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
            const suggestionsData = suggestionsSnap.docs.map(doc => ({
                id: doc.id,
                type: 'user_suggestion' as const,
                ...doc.data()
            })) as FeedbackItem[]
            setSuggestions(suggestionsData)

            // Fetch Driver Feedback
            const feedbackQuery = query(collection(db, "feedback"), limit(50))
            const feedbackSnap = await getDocs(feedbackQuery)
            const feedbackData = feedbackSnap.docs.map(doc => ({
                id: doc.id,
                type: 'driver_feedback' as const,
                ...doc.data()
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
