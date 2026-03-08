"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Settings as SettingsIcon, User, Bell, Shield, Key, RefreshCw, Clock, Activity } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OperatorManagement } from "./components/OperatorManagement"
import { AppVersionPanel } from "./components/AppVersionPanel"
import { DriverTiersPanel } from "./components/DriverTiersPanel"
import { CronJobsPanel } from "./components/CronJobsPanel"
import { useAuth } from "@/features/auth/AuthContext"
import { doc, updateDoc, getDoc, collection, query, orderBy, limit, getDocs, Timestamp } from "firebase/firestore"
import { sendPasswordResetEmail, updateProfile } from "firebase/auth"
import { auth, db } from "@/lib/firebase"
import { toast } from "sonner"
import { useAppConfig } from "@/features/config/hooks/useAppConfig"
import { formatDistanceToNow } from "date-fns"

export default function SettingsPage() {
    const { user } = useAuth()
    const { config, toggleMaintenanceMode } = useAppConfig()

    const [name, setName] = useState("")
    const [loading, setLoading] = useState(false)
    const [resetSent, setResetSent] = useState(false)
    const [preferences, setPreferences] = useState({
        emailNotifications: true,
        pushNotifications: true,
    })
    const [auditLogs, setAuditLogs] = useState<any[]>([])
    const [auditLoading, setAuditLoading] = useState(false)
    const [adminData, setAdminData] = useState<any>(null)

    useEffect(() => {
        if (user) {
            setName(user.displayName || "")
            fetchPreferences()
            fetchAdminData()
        }
    }, [user])

    const fetchAdminData = async () => {
        if (!user) return
        try {
            const docSnap = await getDoc(doc(db, "admins", user.uid))
            if (docSnap.exists()) setAdminData(docSnap.data())
        } catch (e) { console.error(e) }
    }

    const fetchPreferences = async () => {
        if (!user) return
        try {
            const docSnap = await getDoc(doc(db, "admins", user.uid))
            if (docSnap.exists()) {
                const data = docSnap.data()
                setPreferences(prev => ({ ...prev, ...data.preferences }))
                if (data.name && !user.displayName) setName(data.name)
            }
        } catch (error) {
            console.error("Error fetching preferences:", error)
        }
    }

    const fetchAuditLogs = async () => {
        setAuditLoading(true)
        try {
            const q = query(
                collection(db, "adminActions"),
                orderBy("timestamp", "desc"),
                limit(30)
            )
            const snap = await getDocs(q)
            setAuditLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        } catch (e) {
            console.error("Error fetching audit logs:", e)
            toast.error("Could not load audit logs")
        } finally {
            setAuditLoading(false)
        }
    }

    const handleUpdateProfile = async () => {
        if (!user) return
        setLoading(true)
        try {
            // Update Firebase Auth displayName
            await updateProfile(user, { displayName: name })
            // Update Firestore
            await updateDoc(doc(db, "admins", user.uid), { name })
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
            setResetSent(true)
            // Re-enable after 60s
            setTimeout(() => setResetSent(false), 60000)
        } catch (error) {
            toast.error("Failed to send reset email")
        }
    }

    const togglePreference = async (key: keyof typeof preferences) => {
        if (!user) return
        const newValue = !preferences[key]
        setPreferences(prev => ({ ...prev, [key]: newValue }))
        try {
            await updateDoc(doc(db, "admins", user.uid), {
                [`preferences.${key}`]: newValue
            })
        } catch {
            setPreferences(prev => ({ ...prev, [key]: !newValue }))
            toast.error("Failed to update preference")
        }
    }

    const formatActionLabel = (action: string) => {
        const labels: Record<string, string> = {
            create_admin: "Created Operator",
            delete_admin: "Deleted Operator",
            block_user: "Blocked User",
            unblock_user: "Unblocked User",
            suspend_driver: "Suspended Driver",
            approve_driver: "Approved Driver",
            wallet_adjustment: "Wallet Adjustment",
            document_verify: "Document Verified",
            document_reject: "Document Rejected",
            update_pricing: "Updated Pricing",
        }
        return labels[action] || action
    }

    const getActionBadgeVariant = (action: string) => {
        if (action.includes("delete") || action.includes("block") || action.includes("suspend") || action.includes("reject")) return "destructive"
        if (action.includes("create") || action.includes("approve") || action.includes("verify") || action.includes("unblock")) return "default"
        return "secondary"
    }

    return (
        <div className="p-8 space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">
                    Manage your admin account and application settings.
                </p>
            </div>

            <Tabs defaultValue="profile" className="w-full">
                <TabsList>
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    <TabsTrigger value="notifications">Notifications</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                    <TabsTrigger value="audit" onClick={fetchAuditLogs}>Audit Log</TabsTrigger>
                    <TabsTrigger value="version">App Versions</TabsTrigger>
                    <TabsTrigger value="tiers">Driver Tiers</TabsTrigger>
                    <TabsTrigger value="cron">Automated Tasks</TabsTrigger>
                </TabsList>

                {/* PROFILE TAB */}
                <TabsContent value="profile" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Profile Settings
                            </CardTitle>
                            <CardDescription>Update your admin profile information</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {adminData && (
                                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                                        {(name || user?.email || "A")[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="font-medium">{name || "Admin"}</div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={adminData.role === "super_admin" ? "default" : "secondary"} className="text-xs">
                                                {adminData.role?.replace("_", " ")}
                                            </Badge>
                                            <Badge variant={adminData.status === "active" ? "default" : "destructive"} className="text-xs">
                                                {adminData.status}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="name">Display Name</Label>
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

                {/* NOTIFICATIONS TAB */}
                <TabsContent value="notifications" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bell className="h-5 w-5" />
                                Notification Preferences
                            </CardTitle>
                            <CardDescription>These preferences are saved to your admin profile in Firestore</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                    <div className="font-medium">Email Notifications</div>
                                    <div className="text-sm text-muted-foreground">Receive email updates about platform activity</div>
                                </div>
                                <Button
                                    variant={preferences.emailNotifications ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => togglePreference("emailNotifications")}
                                >
                                    {preferences.emailNotifications ? "Enabled" : "Disabled"}
                                </Button>
                            </div>
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                    <div className="font-medium">Push Notifications</div>
                                    <div className="text-sm text-muted-foreground">Get instant alerts for critical events</div>
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

                {/* SECURITY TAB */}
                <TabsContent value="security" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Security Settings
                            </CardTitle>
                            <CardDescription>Manage your account security</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Key className="h-4 w-4" />
                                    <Label>Password Reset</Label>
                                </div>
                                <div className="flex items-center justify-between p-3 border rounded-lg">
                                    <p className="text-sm text-muted-foreground">
                                        Send a password reset email to <strong>{user?.email}</strong>.
                                    </p>
                                    <Button
                                        variant="outline"
                                        onClick={handlePasswordReset}
                                        disabled={resetSent}
                                    >
                                        {resetSent ? "Email Sent ✓" : "Reset Password"}
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    <Label>Session Info</Label>
                                </div>
                                <div className="p-3 border rounded-lg space-y-2 text-sm text-muted-foreground">
                                    <div className="flex justify-between">
                                        <span>Account Email</span>
                                        <span className="font-medium text-foreground">{user?.email}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Admin Role</span>
                                        <Badge variant="outline">{adminData?.role?.replace("_", " ") || "—"}</Badge>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Last Login</span>
                                        <span className="font-medium text-foreground">
                                            {adminData?.lastLogin
                                                ? formatDistanceToNow((adminData.lastLogin as Timestamp).toDate(), { addSuffix: true })
                                                : user?.metadata?.lastSignInTime
                                                    ? formatDistanceToNow(new Date(user.metadata.lastSignInTime), { addSuffix: true })
                                                    : "—"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Account Created</span>
                                        <span className="font-medium text-foreground">
                                            {user?.metadata?.creationTime
                                                ? formatDistanceToNow(new Date(user.metadata.creationTime), { addSuffix: true })
                                                : "—"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* AUDIT LOG TAB */}
                <TabsContent value="audit" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Activity className="h-5 w-5" />
                                        Admin Audit Log
                                    </CardTitle>
                                    <CardDescription>Recent administrative actions performed on the platform</CardDescription>
                                </div>
                                <Button variant="outline" size="sm" onClick={fetchAuditLogs} disabled={auditLoading}>
                                    <RefreshCw className={`h-4 w-4 mr-2 ${auditLoading ? "animate-spin" : ""}`} />
                                    Refresh
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {auditLoading ? (
                                <div className="text-center py-8 text-muted-foreground">Loading audit logs...</div>
                            ) : auditLogs.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">No audit logs found. Actions will appear here.</div>
                            ) : (
                                <div className="space-y-2">
                                    {auditLogs.map((log) => (
                                        <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <Badge variant={getActionBadgeVariant(log.action) as any}>
                                                    {formatActionLabel(log.action)}
                                                </Badge>
                                                <div>
                                                    <div className="text-sm font-medium">
                                                        {log.targetName || log.targetId}
                                                        <span className="text-muted-foreground font-normal"> ({log.targetType})</span>
                                                    </div>
                                                    {log.reason && <div className="text-xs text-muted-foreground">Reason: {log.reason}</div>}
                                                </div>
                                            </div>
                                            <div className="text-right text-xs text-muted-foreground">
                                                {log.timestamp ? formatDistanceToNow(
                                                    (log.timestamp as Timestamp).toDate(), { addSuffix: true }
                                                ) : "—"}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* APP VERSION TAB */}
                <TabsContent value="version" className="space-y-4">
                    <AppVersionPanel />
                </TabsContent>

                {/* DRIVER TIERS TAB */}
                <TabsContent value="tiers" className="space-y-4">
                    <DriverTiersPanel />
                </TabsContent>

                {/* CRON JOBS TAB */}
                <TabsContent value="cron" className="space-y-4">
                    <CronJobsPanel />
                </TabsContent>
            </Tabs>

            {/* Operator Management - Only visible to super admins */}
            <OperatorManagement />

            {/* App-level Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <SettingsIcon className="h-5 w-5" />
                        Application Settings
                    </CardTitle>
                    <CardDescription>Configure platform-wide settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                            <div className="font-medium">Maintenance Mode</div>
                            <div className="text-sm text-muted-foreground">Temporarily disable user access for maintenance</div>
                        </div>
                        <Button
                            variant={config.maintenanceMode ? "destructive" : "outline"}
                            size="sm"
                            onClick={() => toggleMaintenanceMode(!config.maintenanceMode)}
                        >
                            {config.maintenanceMode ? "🔴 Active — Users Blocked" : "🟢 Disabled — Live"}
                        </Button>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                            <div className="font-medium">Platform Commission</div>
                            <div className="text-sm text-muted-foreground">Managed in Pricing settings</div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => window.location.href = '/dashboard/pricing'}>
                            View Pricing →
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
