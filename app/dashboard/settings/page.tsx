"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Settings as SettingsIcon, User, Bell, Shield, Key, RefreshCw } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OperatorManagement } from "./components/OperatorManagement"
import { useAuth } from "@/features/auth/AuthContext"
import { doc, updateDoc, getDoc, setDoc } from "firebase/firestore"
import { sendPasswordResetEmail } from "firebase/auth"
import { auth, db } from "@/lib/firebase"
import { toast } from "sonner"
import { useAppConfig } from "@/features/config/hooks/useAppConfig"
import Image from "next/image"

export default function SettingsPage() {
    const { user } = useAuth()
    const { config, toggleMaintenanceMode } = useAppConfig()

    // Local state for form inputs
    const [name, setName] = useState("")
    const [loading, setLoading] = useState(false)
    const [preferences, setPreferences] = useState({
        emailNotifications: true,
        pushNotifications: true,
        twoFactorAuth: false
    })

    // Fetch user details on load
    useEffect(() => {
        if (user) {
            setName(user.displayName || "")
            fetchPreferences()
        }
    }, [user])

    const fetchPreferences = async () => {
        if (!user) return
        try {
            const docRef = doc(db, "admins", user.uid)
            const docSnap = await getDoc(docRef)
            if (docSnap.exists()) {
                const data = docSnap.data()
                setPreferences(prev => ({
                    ...prev,
                    ...data.preferences
                }))
                // Also update name if exists in firestore but not in auth
                if (data.name && !user.displayName) setName(data.name)
            }
        } catch (error) {
            console.error("Error fetching preferences:", error)
        }
    }

    const handleUpdateProfile = async () => {
        if (!user) return
        setLoading(true)
        try {
            // Update Firestore Profile
            await updateDoc(doc(db, "admins", user.uid), {
                name: name
            })
            toast.success("Profile updated successfully")
        } catch (error) {
            toast.error("Failed to update profile")
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handlePasswordReset = async () => {
        if (!user?.email) return
        try {
            await sendPasswordResetEmail(auth, user.email)
            toast.success(`Password reset email sent to ${user.email}`)
        } catch (error) {
            toast.error("Failed to send reset email")
            console.error(error)
        }
    }

    const togglePreference = async (key: keyof typeof preferences) => {
        if (!user) return
        const newValue = !preferences[key]

        // Optimistic update
        setPreferences(prev => ({ ...prev, [key]: newValue }))

        try {
            await updateDoc(doc(db, "admins", user.uid), {
                [`preferences.${key}`]: newValue
            })
        } catch (error) {
            // Revert on failure
            setPreferences(prev => ({ ...prev, [key]: !newValue }))
            toast.error("Failed to update preference")
        }
    }

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                    <p className="text-muted-foreground">
                        Manage your admin account and application settings.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="profile" className="w-full">
                <TabsList>
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    <TabsTrigger value="notifications">Notifications</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Profile Settings
                            </CardTitle>
                            <CardDescription>
                                Update your admin profile information
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Your Name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" value={user?.email || ""} readOnly disabled className="bg-muted" />
                                <p className="text-xs text-muted-foreground">Email cannot be changed directly.</p>
                            </div>
                            <Button onClick={handleUpdateProfile} disabled={loading}>
                                {loading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                                Update Profile
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="notifications" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bell className="h-5 w-5" />
                                Notification Preferences
                            </CardTitle>
                            <CardDescription>
                                Manage how you receive notifications
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-medium">Email Notifications</div>
                                    <div className="text-sm text-muted-foreground">
                                        Receive email updates about platform activity
                                    </div>
                                </div>
                                <Button
                                    variant={preferences.emailNotifications ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => togglePreference("emailNotifications")}
                                >
                                    {preferences.emailNotifications ? "Enabled" : "Disabled"}
                                </Button>
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-medium">Push Notifications</div>
                                    <div className="text-sm text-muted-foreground">
                                        Get instant alerts for critical events
                                    </div>
                                </div>
                                <Button
                                    variant={preferences.pushNotifications ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => togglePreference("pushNotifications")}
                                >
                                    {preferences.pushNotifications ? "Enabled" : "Disabled"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="security" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Security Settings
                            </CardTitle>
                            <CardDescription>
                                Manage your account security options
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Key className="h-4 w-4" />
                                    <Label>Password</Label>
                                </div>
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-muted-foreground">Send a password reset email to your registered address.</p>
                                    <Button variant="outline" onClick={handlePasswordReset}>Reset Password</Button>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <div className="font-medium">Two-Factor Authentication</div>
                                    <div className="text-sm text-muted-foreground">
                                        Add an extra layer of security to your account (Placeholder)
                                    </div>
                                </div>
                                <Button
                                    variant={preferences.twoFactorAuth ? "destructive" : "outline"}
                                    onClick={() => togglePreference("twoFactorAuth")}
                                >
                                    {preferences.twoFactorAuth ? "Disable 2FA" : "Enable 2FA"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Operator Management - Only visible to super admins */}
            <OperatorManagement />

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <SettingsIcon className="h-5 w-5" />
                        Application Settings
                    </CardTitle>
                    <CardDescription>
                        Configure platform-wide settings
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="font-medium">Maintenance Mode</div>
                            <div className="text-sm text-muted-foreground">
                                Temporarily disable user access for maintenance
                            </div>
                        </div>
                        <Button
                            variant={config.maintenanceMode ? "destructive" : "outline"}
                            size="sm"
                            onClick={() => toggleMaintenanceMode(!config.maintenanceMode)}
                        >
                            {config.maintenanceMode ? "Enabled (Users Blocked)" : "Disabled (Live)"}
                        </Button>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="font-medium">Platform Commission</div>
                            <div className="text-sm text-muted-foreground">
                                Managed in Pricing settings
                            </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => window.location.href = '/dashboard/pricing'}>View Pricing</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
