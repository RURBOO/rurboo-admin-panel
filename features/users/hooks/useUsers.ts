"use client"

import { useState, useEffect } from "react"
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { User } from "@/lib/types"

export function useUsers() {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Listen to 'users' collection
        // Note: If users collection is large, pagination is required. 
        // For Admin MVP, we limit to recent 50 or similar, but let's fetch all for now.
        const q = query(collection(db, "users"))

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const usersData: User[] = []
            snapshot.forEach((doc) => {
                usersData.push({
                    id: doc.id,
                    ...doc.data(),
                } as User)
            })
            setUsers(usersData)
            setLoading(false)
        }, (error) => {
            console.error("Error fetching users:", error)
            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    const toggleBlockUser = async (userId: string, currentStatus: boolean) => {
        try {
            await updateDoc(doc(db, "users", userId), {
                isBlocked: !currentStatus
            })
        } catch (error) {
            console.error("Error toggling block status:", error)
            throw error
        }
    }

    return { users, loading, toggleBlockUser }
}
