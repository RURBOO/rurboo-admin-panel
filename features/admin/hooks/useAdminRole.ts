"use client"

import { useState, useEffect } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/features/auth/AuthContext"

export interface AdminPermissions {
    manageDrivers: boolean
    manageUsers: boolean
    managePricing: boolean
    manageAdmins: boolean
    viewFinance: boolean
    manageSOS: boolean
}

export interface AdminData {
    adminId: string
    email: string
    name: string
    role: 'super_admin' | 'admin' | 'operator'
    permissions: AdminPermissions
    createdAt: any
    createdBy: string
    lastLogin: any
    status: 'active' | 'suspended'
}

export function useAdminRole() {
    const { user } = useAuth()
    const [adminData, setAdminData] = useState<AdminData | null>(null)
    const [loading, setLoading] = useState(true)
    const [isSuperAdmin, setIsSuperAdmin] = useState(false)

    useEffect(() => {
        const fetchAdminData = async () => {
            if (!user) {
                setLoading(false)
                return
            }

            try {
                const adminDoc = await getDoc(doc(db, "admins", user.uid))

                if (adminDoc.exists()) {
                    const data = { adminId: adminDoc.id, ...adminDoc.data() } as AdminData
                    setAdminData(data)
                    setIsSuperAdmin(data.role === 'super_admin')
                } else {
                    setAdminData(null)
                    setIsSuperAdmin(false)
                }
            } catch (error) {
                console.error("Error fetching admin data:", error)
                setAdminData(null)
            } finally {
                setLoading(false)
            }
        }

        fetchAdminData()
    }, [user])

    const hasPermission = (permission: keyof AdminPermissions): boolean => {
        if (!adminData) return false
        if (isSuperAdmin) return true // Super admin has all permissions
        return adminData.permissions[permission] || false
    }

    return {
        adminData,
        loading,
        isSuperAdmin,
        hasPermission,
        isAdmin: !!adminData
    }
}
