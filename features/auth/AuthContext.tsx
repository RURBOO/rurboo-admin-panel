"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { onAuthStateChanged, User } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { Role } from "@/lib/rbac"
import { useRouter } from "next/navigation"

interface AuthContextType {
    user: User | null;
    role: Role | null;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    role: null,
    loading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [role, setRole] = useState<Role | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser)
                // Fetch Role from Firestore
                try {
                    const adminDoc = await getDoc(doc(db, "admins", firebaseUser.uid))
                    if (adminDoc.exists()) {
                        const data = adminDoc.data()
                        setRole((data.role as Role) || 'support') // Default to lowest priv
                    } else {
                        // If no admin doc, they shouldn't be here (or needs init)
                        console.warn("No admin profile found for user")
                        setRole(null)
                    }
                } catch (error) {
                    console.error("Failed to fetch admin role", error)
                }
            } else {
                setUser(null)
                setRole(null)
            }
            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    return (
        <AuthContext.Provider value={{ user, role, loading }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
