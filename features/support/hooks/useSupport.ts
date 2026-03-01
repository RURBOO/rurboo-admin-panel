"use client"

import { useState, useEffect } from "react"
import { collection, onSnapshot, query, orderBy, where, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export interface SupportTicket {
    id: string;
    userId?: string;
    driverId?: string;
    userType: 'driver' | 'user';
    subject: string;
    message: string;
    status: string;
    createdAt: any;
    imageUrl?: string;
}

export function useSupport() {
    const [tickets, setTickets] = useState<SupportTicket[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Updated to listen to 'support_tickets' (User App Feature)
        const q = query(
            collection(db, "support_tickets"),
            orderBy("createdAt", "desc")
        )

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const ticketsData: SupportTicket[] = []
            snapshot.forEach((doc) => {
                const data = doc.data()
                ticketsData.push({
                    id: doc.id,
                    userId: data.userId,
                    driverId: data.driverId,
                    userType: data.userType || 'user',
                    subject: data.reason || data.subject || data.category || 'Support Request',
                    message: data.description || data.message || '',
                    status: data.status || 'open',
                    createdAt: data.createdAt,
                    imageUrl: data.imageUrl
                } as SupportTicket)
            })
            setTickets(ticketsData)
            setLoading(false)
        }, (error) => {
            console.error("Error fetching tickets:", error)
            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    const updateTicketStatus = async (ticketId: string, newStatus: string) => {
        try {
            await updateDoc(doc(db, "support_tickets", ticketId), {
                status: newStatus
            })
            // Optimistic update
            setTickets(prev => prev.map(t =>
                t.id === ticketId ? { ...t, status: newStatus as any } : t
            ))
        } catch (error) {
            console.error("Error updating ticket:", error)
        }
    }

    return { tickets, loading, updateTicketStatus }
}
