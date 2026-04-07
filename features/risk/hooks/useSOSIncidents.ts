"use client"

import { useState, useEffect } from "react"
import { collection, onSnapshot, query, orderBy, getDoc, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export interface SOSIncident {
    id: string;
    userId: string;
    timestamp: any;
    rideId?: string;
    status: string;
    type: string;
    callType: string;
    sentTo: string;
    recordingUrl?: string;
    // Hydrated properties
    userName?: string;
    userPhone?: string;
    driverName?: string;
    driverPhone?: string;
    carName?: string;
    carNumber?: string;
    createdAt?: string;
}

export function useSOSIncidents() {
    const [incidents, setIncidents] = useState<SOSIncident[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const q = query(
            collection(db, "sos_incidents"),
            orderBy("timestamp", "desc")
        )

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const incidentsData: SOSIncident[] = []
            
            for (const docSnap of snapshot.docs) {
                const data = docSnap.data()
                let incident: SOSIncident = {
                    id: docSnap.id,
                    userId: data.userId,
                    timestamp: data.timestamp,
                    rideId: data.rideId,
                    status: data.status,
                    type: data.type,
                    callType: data.callType,
                    sentTo: data.sentTo,
                    recordingUrl: data.recordingUrl,
                    createdAt: data.timestamp?.toDate ? data.timestamp.toDate().toLocaleString() : 'Just now'
                }

                // Hydrate details
                try {
                    // Fetch User Dets
                    if (data.userId) {
                        const userDoc = await getDoc(doc(db, "users", data.userId));
                        if (userDoc.exists()) {
                            incident.userName = userDoc.data().name;
                            incident.userPhone = userDoc.data().phone;
                        }
                    }

                    // Fetch Ride & Driver Details
                    if (data.rideId) {
                        const rideDoc = await getDoc(doc(db, "rideRequests", data.rideId));
                        if (rideDoc.exists()) {
                            const rideData = rideDoc.data();
                            incident.driverName = rideData.driverName || 'Unassigned';
                            incident.driverPhone = rideData.driverPhone;
                            incident.carName = rideData.carName;
                            incident.carNumber = rideData.carNumber;
                        }
                    }
                } catch (e) {
                    console.error("Error hydrating SOS details:", e);
                }

                incidentsData.push(incident)
            }

            setIncidents(incidentsData)
            setLoading(false)
        }, (error) => {
            console.error("Error fetching SOS incidents:", error)
            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    const resolveIncident = async (id: string) => {
        try {
            await updateDoc(doc(db, "sos_incidents", id), {
                status: 'resolved',
                resolvedAt: new Date() // You can use Timestamp from firebase but new Date() works since firestore SDK converts it. Wait, actually no, best to use serverTimestamp or just let it be. Wait, updateDoc needs to be imported. Let's just import updateDoc.
            })
        } catch (error) {
            console.error("Error resolving incident", error)
        }
    }

    return { incidents, loading, resolveIncident }
}
