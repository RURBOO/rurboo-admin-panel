"use client"

import { useState, useEffect } from "react"
import { collection, onSnapshot, query, orderBy, doc, updateDoc, getDoc, serverTimestamp, writeBatch, where, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Driver } from "@/lib/types"
import { DateRange } from "react-day-picker"

export function useDrivers(dateRange?: DateRange) {
    const [drivers, setDrivers] = useState<Driver[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Listen to 'drivers' collection
        let q = query(collection(db, "drivers"))

        if (dateRange?.from) {
            if (dateRange.to) {
                q = query(q,
                    where("createdAt", ">=", Timestamp.fromDate(dateRange.from)),
                    where("createdAt", "<=", Timestamp.fromDate(new Date(dateRange.to.setHours(23, 59, 59, 999))))
                )
            } else {
                q = query(q, where("createdAt", ">=", Timestamp.fromDate(dateRange.from)))
            }
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const driversData: Driver[] = []
            snapshot.forEach((doc) => {
                const data = doc.data()
                driversData.push({
                    id: doc.id,
                    ...data,
                    phone: data.phone || data.phoneNumber,
                    // Map multiple possible field names for pending commission
                    pendingCommission: data.pendingCommission ?? data.commissionDue ?? data.commission_pending ?? data.dueCommission ?? 0,
                } as Driver)
            })
            setDrivers(driversData)
            setLoading(false)
        }, (error) => {
            console.error("Error fetching drivers:", error)
            setLoading(false)
        })

        return () => unsubscribe()
    }, [dateRange?.from?.toISOString(), dateRange?.to?.toISOString()])

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


            const batch = writeBatch(db);

            batch.update(driverRef, {
                walletBalance: newBalance,
                updatedAt: serverTimestamp()
            });

            const historyRef = doc(collection(driverRef, 'walletHistory'));
            batch.set(historyRef, {
                amount: amount,
                type: type === 'recharge' ? 'credit' : 'debit',
                description: type === 'recharge' ? 'Admin Top-Up' : 'Admin Deduction',
                createdAt: serverTimestamp(),
            });

            await batch.commit();

        } catch (error) {
            console.error("Error updating driver wallet:", error)
            throw error
        }
    }

    return { drivers, loading, updateDriverStatus, updateDriverDocumentStatus, updateWalletBalance }
}
