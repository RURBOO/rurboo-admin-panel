"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { onAuthStateChanged, User } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { Role } from "@/lib/rbac"
import { useRouter } from "next/navigation"

export interface AdminPermissions {
    manageDrivers: boolean;
    manageUsers: boolean;
    managePricing: boolean;
    manageAdmins: boolean;
    viewFinance: boolean;
    manageSOS: boolean;
}

interface AuthContextType {
    user: User | null;
    role: Role | null;
    permissions: AdminPermissions | null;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    role: null,
    permissions: null,
    loading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [role, setRole] = useState<Role | null>(null)
    const [permissions, setPermissions] = useState<AdminPermissions | null>(null)
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
                        setRole((data.role as Role) || 'support')
                        setPermissions(data.permissions || null)
                    } else {
                        console.warn("No admin profile found for user")
                        setRole(null)
                        setPermissions(null)
                    }
                } catch (error) {
                    console.error("Failed to fetch admin role", error)
                }
            } else {
                setUser(null)
                setRole(null)
                setPermissions(null)
            }
            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    return (
        <AuthContext.Provider value={{ user, role, permissions, loading }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
