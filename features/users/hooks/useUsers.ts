"use client"

import { useState, useEffect } from "react"
import { collection, onSnapshot, query, orderBy, doc, updateDoc, getDoc, serverTimestamp } from "firebase/firestore"
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

    const updateWalletBalance = async (userId: string, amount: number, type: 'recharge' | 'deduct') => {
        try {
            const userRef = doc(db, "users", userId)
            const userSnap = await getDoc(userRef)
            if (!userSnap.exists()) throw new Error("User not found")

            const currentBalance = userSnap.data().walletBalance || 0
            const newBalance = type === 'recharge' ? currentBalance + amount : currentBalance - amount

            await updateDoc(userRef, {
                walletBalance: newBalance,
                updatedAt: serverTimestamp()
            })

            // Note: Ledger entry creation should ideally be handled centrally to ensure consistency
        } catch (error) {
            console.error("Error updating user wallet:", error)
            throw error
        }
    }

    const toggleBlockUser = async (userId: string, currentStatus: boolean) => {
        try {
            await updateDoc(doc(db, "users", userId), {
                isBlocked: !currentStatus,
                updatedAt: serverTimestamp()
            })
        } catch (error) {
            console.error("Error toggling block status:", error)
            throw error
        }
    }

    return { users, loading, toggleBlockUser, updateWalletBalance }
}
