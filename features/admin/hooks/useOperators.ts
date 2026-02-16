"use client"

import { useState, useEffect } from "react"
import { collection, query, getDocs, doc, deleteDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { AdminData } from "./useAdminRole"

export function useOperators() {
    const [operators, setOperators] = useState<AdminData[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchOperators()
    }, [])

    const fetchOperators = async () => {
        try {
            const q = query(collection(db, "admins"))
            const querySnapshot = await getDocs(q)
            const operatorsList = querySnapshot.docs.map(doc => ({
                adminId: doc.id,
                ...doc.data()
            })) as AdminData[]
            setOperators(operatorsList)
        } catch (error) {
            console.error("Error fetching operators:", error)
        } finally {
            setLoading(false)
        }
    }

    const deleteOperator = async (adminId: string) => {
        try {
            await deleteDoc(doc(db, "admins", adminId))
            setOperators(prev => prev.filter(op => op.adminId !== adminId))
            return { success: true }
        } catch (error) {
            console.error("Error deleting operator:", error)
            return { success: false, error }
        }
    }

    const updateOperatorStatus = async (adminId: string, status: 'active' | 'suspended') => {
        try {
            await updateDoc(doc(db, "admins", adminId), { status })
            setOperators(prev => prev.map(op =>
                op.adminId === adminId ? { ...op, status } : op
            ))
            return { success: true }
        } catch (error) {
            console.error("Error updating operator status:", error)
            return { success: false, error }
        }
    }

    const refreshOperators = () => {
        fetchOperators()
    }

    return {
        operators,
        loading,
        deleteOperator,
        updateOperatorStatus,
        refreshOperators
    }
}
