"use client"

import { useState, useEffect } from "react"
import { collection, onSnapshot, query, orderBy, doc, updateDoc, getDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Driver } from "@/lib/types"

export function useDrivers() {
    const [drivers, setDrivers] = useState<Driver[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Listen to 'drivers' collection
        const q = query(collection(db, "drivers"))

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const driversData: Driver[] = []
            snapshot.forEach((doc) => {
                driversData.push({
                    id: doc.id,
                    ...doc.data(),
                } as Driver)
            })
            setDrivers(driversData)
            setLoading(false)
        }, (error) => {
            console.error("Error fetching drivers:", error)
            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    const updateDriverStatus = async (driverId: string, status: string) => {
        try {
            await updateDoc(doc(db, "drivers", driverId), {
                status: status,
                verificationStatus: status === 'active' ? 'approved' : status === 'suspended' ? 'rejected' : 'pending', // Simplified mapping
                updatedAt: new Date()
            })
        } catch (error) {
            console.error("Error updating driver status:", error)
            throw error
        }
    }

    const updateDriverDocumentStatus = async (
        driverId: string,
        docType: string,
        status: 'approved' | 'rejected',
        reason?: string
    ) => {
        try {
            const driverRef = doc(db, "drivers", driverId);
            const statusKey = `${docType}Status`;
            const reasonKey = `${docType}RejectionReason`;

            const updateData: any = {
                [statusKey]: status,
                updatedAt: new Date()
            };

            if (status === 'rejected' && reason) {
                updateData[reasonKey] = reason;
            } else if (status === 'approved') {
                updateData[reasonKey] = null;
            }

            await updateDoc(driverRef, updateData);
        } catch (error) {
            console.error("Error updating document status:", error);
            throw error;
        }
    };

    const updateWalletBalance = async (driverId: string, amount: number, type: 'recharge' | 'deduct') => {
        try {
            const driverRef = doc(db, "drivers", driverId)
            const driverSnap = await getDoc(driverRef)
            if (!driverSnap.exists()) throw new Error("Driver not found")

            const currentBalance = driverSnap.data().walletBalance || 0
            const newBalance = type === 'recharge' ? currentBalance + amount : currentBalance - amount

            await updateDoc(driverRef, {
                walletBalance: newBalance,
                updatedAt: serverTimestamp()
            })
        } catch (error) {
            console.error("Error updating driver wallet:", error)
            throw error
        }
    }

    return { drivers, loading, updateDriverStatus, updateDriverDocumentStatus, updateWalletBalance }
}
