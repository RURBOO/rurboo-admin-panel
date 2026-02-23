"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { User } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Phone, Mail, MapPin, Calendar, CreditCard, Ban, CheckCircle, Plus, Minus } from "lucide-react"
import { useUsers } from "@/features/users/hooks/useUsers"
import { useAuth } from "@/features/auth/AuthContext"
import { logUserBlock, logUserUnblock, logWalletAdjustment } from "@/lib/adminActions"
import { toast } from "sonner"

export default function UserDetailPage() {
    const { toggleBlockUser, updateWalletBalance } = useUsers()
    const { user: admin } = useAuth()
    const params = useParams()
    const router = useRouter()
    const userId = params.id as string
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [rides, setRides] = useState<any[]>([])
    const [loadingRides, setLoadingRides] = useState(true)
    const [processing, setProcessing] = useState(false)

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const docRef = doc(db, "users", userId)
                const docSnap = await getDoc(docRef)

                if (docSnap.exists()) {
                    setUser({ id: docSnap.id, ...docSnap.data() } as User)
                }
            } catch (error) {
                console.error("Error fetching user:", error)
            } finally {
                setLoading(false)
            }
        }

        const fetchRides = async () => {
            try {
                const ridesRef = collection(db, "rideRequests")
                const q = query(
                    ridesRef,
                    where("userId", "==", userId),
                    orderBy("createdAt", "desc"),
                    limit(10)
                )
                const querySnapshot = await getDocs(q)
                const ridesData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate()
                }))
                setRides(ridesData)
            } catch (error) {
                console.error("Error fetching rides:", error)
            } finally {
                setLoadingRides(false)
            }
        }

        if (userId) {
            fetchUser()
            fetchRides()
        }
    }, [userId])

    if (loading) {
        return (
            <div className="p-8 space-y-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-8 w-48" />
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="p-8 flex flex-col items-center justify-center h-[50vh]">
                <h2 className="text-2xl font-bold mb-2">User Not Found</h2>
                <Button onClick={() => router.back()}>Go Back</Button>
            </div>
        )
    }

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                            <AvatarImage src={user.photoURL} />
                            <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                                {user.name}
                                {user.isBlocked && <Ban className="h-5 w-5 text-destructive" />}
                            </h2>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <span className="text-sm">User ID: {user.id}</span>
                                <Badge variant={user.isBlocked ? 'destructive' : 'default'} className={!user.isBlocked ? 'bg-green-600' : ''}>
                                    {user.isBlocked ? 'BLOCKED' : 'ACTIVE'}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={user.isBlocked ? "outline" : "destructive"}
                        disabled={processing}
                        onClick={async () => {
                            if (!admin) return
                            setProcessing(true)
                            try {
                                await toggleBlockUser(user.id, user.isBlocked || false)
                                if (user.isBlocked) {
                                    await logUserUnblock(admin.uid, admin.email || "", user.id, user.name || "N/A")
                                    toast.success("User unblocked successfully")
                                } else {
                                    await logUserBlock(admin.uid, admin.email || "", user.id, user.name || "N/A", "Admin Action")
                                    toast.warning("User blocked successfully")
                                }
                                setUser(prev => prev ? ({ ...prev, isBlocked: !prev.isBlocked }) : null)
                            } catch (e) {
                                toast.error("Failed to update user status")
                            } finally {
                                setProcessing(false)
                            }
                        }}
                    >
                        {processing ? "Processing..." : (user.isBlocked ? "Unblock Account" : "Block Account")}
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Personal Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{user.phoneNumber || "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{user.email || "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>Joined {user.createdAt?.toDate?.()?.toLocaleDateString() || "N/A"}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Wallet Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>Wallet & Payments</span>
                            <Badge variant="outline" className="bg-blue-50">₹</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Wallet Balance</span>
                            <div className="font-bold text-2xl">₹{user.walletBalance?.toFixed(2) || "0.00"}</div>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button
                                size="sm"
                                className="flex-1 bg-green-600 hover:bg-green-700"
                                disabled={processing}
                                onClick={async () => {
                                    const amountStr = prompt("Enter amount to recharge (₹):")
                                    const amount = parseFloat(amountStr || "0")
                                    if (isNaN(amount) || amount <= 0) return

                                    if (!admin) return
                                    setProcessing(true)
                                    try {
                                        await updateWalletBalance(user.id, amount, 'recharge')

                                        // Create Ledger Entry
                                        await addDoc(collection(db, "ledger_entries"), {
                                            amount,
                                            type: 'credit',
                                            account: 'user_wallet',
                                            userId: user.id,
                                            description: `Admin Recharge: ${amount}`,
                                            timestamp: serverTimestamp(),
                                            adminId: admin.uid
                                        })

                                        await logWalletAdjustment(admin.uid, admin.email || "", 'user', user.id, user.name || "N/A", amount, 'recharge')

                                        setUser(prev => prev ? ({ ...prev, walletBalance: (prev.walletBalance || 0) + amount }) : null)
                                        toast.success(`Recharged ₹${amount} successfully`)
                                    } catch (e) {
                                        toast.error("Recharge failed")
                                    } finally {
                                        setProcessing(false)
                                    }
                                }}
                            >
                                <Plus className="mr-1 h-3 w-3" /> Recharge
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 text-red-600 hover:text-red-700"
                                disabled={processing}
                                onClick={async () => {
                                    const amountStr = prompt("Enter amount to deduct (₹):")
                                    const amount = parseFloat(amountStr || "0")
                                    if (isNaN(amount) || amount <= 0) return

                                    if (!admin) return
                                    setProcessing(true)
                                    try {
                                        await updateWalletBalance(user.id, amount, 'deduct')

                                        // Create Ledger Entry
                                        await addDoc(collection(db, "ledger_entries"), {
                                            amount,
                                            type: 'debit',
                                            account: 'user_wallet',
                                            userId: user.id,
                                            description: `Admin Deduction: ${amount}`,
                                            timestamp: serverTimestamp(),
                                            adminId: admin.uid
                                        })

                                        await logWalletAdjustment(admin.uid, admin.email || "", 'user', user.id, user.name || "N/A", amount, 'deduct')

                                        setUser(prev => prev ? ({ ...prev, walletBalance: (prev.walletBalance || 0) - amount }) : null)
                                        toast.error(`Deducted ₹${amount} successfully`)
                                    } catch (e) {
                                        toast.error("Deduction failed")
                                    } finally {
                                        setProcessing(false)
                                    }
                                }}
                            >
                                <Minus className="mr-1 h-3 w-3" /> Deduct
                            </Button>
                        </div>

                        <div className="flex items-center gap-3 mt-2">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Default Payment: Cash</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats */}
                <Card>
                    <CardHeader>
                        <CardTitle>Activity Stats</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Total Rides</span>
                            <span className="font-bold">{user.totalRides || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Last Active</span>
                            <span className="text-sm">{new Date().toLocaleDateString()}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs for History */}
            <Tabs defaultValue="rides" className="w-full">
                <TabsList>
                    <TabsTrigger value="rides">Ride History</TabsTrigger>
                </TabsList>

                <TabsContent value="rides" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Rides</CardTitle>
                            <CardDescription>Last 10 rides taken by this user.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loadingRides ? (
                                <div className="space-y-2">
                                    <Skeleton className="h-12 w-full" />
                                    <Skeleton className="h-12 w-full" />
                                </div>
                            ) : rides.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">No rides found.</div>
                            ) : (
                                <div className="space-y-4">
                                    {rides.map(ride => (
                                        <div key={ride.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                            <div>
                                                <div className="font-medium">Ride #{ride.id.slice(0, 8)}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {ride.createdAt?.toLocaleDateString()} • {ride.createdAt?.toLocaleTimeString()}
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-1 truncate max-w-[300px]">
                                                    To: {ride.dropLocation?.address || "Unknown"}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold">₹{ride.fare?.toFixed(2)}</div>
                                                <Badge variant="outline" className={
                                                    ride.status === 'completed' ? 'text-green-600 border-green-200' :
                                                        ride.status === 'cancelled' ? 'text-red-600 border-red-200' : ''
                                                }>{ride.status}</Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
