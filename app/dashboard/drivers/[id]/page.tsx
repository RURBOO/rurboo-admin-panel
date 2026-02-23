"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { db } from "@/lib/firebase"
import { Driver } from "@/lib/types"
import { useAuth } from "@/features/auth/AuthContext"
import { logDriverSuspend, logDriverApprove, logWalletAdjustment, logDocumentVerification } from "@/lib/adminActions"
import { toast } from "sonner"
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs, addDoc, serverTimestamp } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Phone, Mail, Car, MapPin, Calendar, Star, ShieldCheck, FileText, Plus, Minus, CreditCard } from "lucide-react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useDrivers } from "@/features/drivers/hooks/useDrivers"

export default function DriverDetailPage() {
    const { updateDriverStatus, updateDriverDocumentStatus, updateWalletBalance } = useDrivers()
    const { user: admin } = useAuth()
    const params = useParams()
    const router = useRouter()
    const driverId = params.id as string
    const [driver, setDriver] = useState<Driver | null>(null)
    const [loading, setLoading] = useState(true)
    const [rides, setRides] = useState<any[]>([])
    const [loadingRides, setLoadingRides] = useState(true)
    const [processingDoc, setProcessingDoc] = useState<string | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [actionType, setActionType] = useState<'suspended' | 'active' | 'blocked'>('suspended')
    const [processingAction, setProcessingAction] = useState(false)

    const openActionDialog = (type: 'suspended' | 'active' | 'blocked') => {
        setActionType(type)
        setIsDialogOpen(true)
    }

    const handleStatusUpdate = async () => {
        if (!driver || !admin) return
        setProcessingAction(true)
        try {
            await updateDriverStatus(driver.id, actionType)

            if (actionType === 'suspended' || actionType === 'blocked') {
                await logDriverSuspend(admin.uid, admin.email || "", driver.id, driver.name || "N/A", "Admin Action")
                toast.warning(`Driver ${actionType} successfully`)
            } else {
                await logDriverApprove(admin.uid, admin.email || "", driver.id, driver.name || "N/A")
                toast.success("Driver activated successfully")
            }

            setDriver(prev => prev ? ({ ...prev, status: actionType }) : null)
            setIsDialogOpen(false)
        } catch (error) {
            console.error("Error updating status:", error)
            toast.error("Failed to update status")
        } finally {
            setProcessingAction(false)
        }
    }

    useEffect(() => {
        const fetchDriver = async () => {
            try {
                const docRef = doc(db, "drivers", driverId)
                const docSnap = await getDoc(docRef)

                if (docSnap.exists()) {
                    setDriver({ id: docSnap.id, ...docSnap.data() } as Driver)
                }
            } catch (error) {
                console.error("Error fetching driver:", error)
            } finally {
                setLoading(false)
            }
        }

        const fetchRides = async () => {
            try {
                const ridesRef = collection(db, "rideRequests")
                const q = query(
                    ridesRef,
                    where("driverId", "==", driverId),
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

        if (driverId) {
            fetchDriver()
            fetchRides()
        }
    }, [driverId])

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

    if (!driver) {
        return (
            <div className="p-8 flex flex-col items-center justify-center h-[50vh]">
                <h2 className="text-2xl font-bold mb-2">Driver Not Found</h2>
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
                            <AvatarImage src={driver.photoURL} />
                            <AvatarFallback>{driver.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                                {driver.name}
                                {driver.verified && <ShieldCheck className="h-5 w-5 text-blue-500" />}
                            </h2>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <span className="text-sm">Driver ID: {driver.id}</span>
                                <Badge variant={driver.status === 'active' ? 'default' : 'secondary'} className={driver.status === 'active' ? 'bg-green-600' : ''}>
                                    {driver.status?.toUpperCase()}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    {driver.status !== 'blocked' && (
                        <Button
                            variant="destructive"
                            onClick={() => openActionDialog('blocked')}
                        >
                            Block Account
                        </Button>
                    )}
                    {driver.status === 'active' ? (
                        <Button variant="outline" onClick={() => openActionDialog('suspended')}>Suspend Account</Button>
                    ) : driver.status === 'suspended' || driver.status === 'blocked' ? (
                        <Button className="bg-green-600 hover:bg-green-700" onClick={() => openActionDialog('active')}>Activate Account</Button>
                    ) : null}
                    <Button>Edit Profile</Button>
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
                            <span>{driver.phoneNumber || "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{driver.email || "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate">{driver.address || "Address not provided"}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>Joined {driver.createdAt?.toDate?.()?.toLocaleDateString() || "N/A"}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Vehicle Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>Vehicle Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Car className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold">{driver.vehicleType}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="text-muted-foreground">Number:</div>
                            <div>{driver.vehicleNumber}</div>
                            <div className="text-muted-foreground">Model:</div>
                            <div>{driver.vehicleModel || "N/A"}</div>
                            <div className="text-muted-foreground">Color:</div>
                            <div>{driver.vehicleColor || "N/A"}</div>
                        </div>
                    </CardContent>
                </Card>

                {/* Performance */}
                <Card>
                    <CardHeader>
                        <CardTitle>Performance</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Rating</span>
                            <div className="flex items-center gap-1 font-bold">
                                {driver.rating?.toFixed(1) || "New"} <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Total Rides</span>
                            <span className="font-bold">{driver.totalRides || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Wallet Balance</span>
                            <span className="font-bold text-lg">₹{driver.walletBalance?.toFixed(2) || "0.00"}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Wallet Management Card (New) */}
                <Card className="md:col-span-3">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5" /> Wallet Management
                        </CardTitle>
                        <CardDescription>Recharge driver wallet or deduct commission dues manually.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                            <div>
                                <div className="text-sm text-muted-foreground">Current Balance</div>
                                <div className="text-3xl font-bold">₹{driver.walletBalance?.toFixed(2) || "0.00"}</div>
                            </div>
                            <div className="flex gap-4">
                                <Button
                                    className="bg-green-600 hover:bg-green-700"
                                    disabled={processingAction}
                                    onClick={async () => {
                                        const amountStr = prompt("Enter amount to recharge (₹):")
                                        const amount = parseFloat(amountStr || "0")
                                        if (isNaN(amount) || amount <= 0) return

                                        if (!admin) return
                                        setProcessingAction(true)
                                        try {
                                            await updateWalletBalance(driver.id, amount, 'recharge')

                                            // Ledger Entry
                                            await addDoc(collection(db, "ledger_entries"), {
                                                amount,
                                                type: 'credit',
                                                account: 'driver_wallet',
                                                driverId: driver.id,
                                                description: `Admin Recharge: ${amount}`,
                                                timestamp: serverTimestamp(),
                                                adminId: admin.uid
                                            })

                                            await logWalletAdjustment(admin.uid, admin.email || "", 'driver', driver.id, driver.name || "N/A", amount, 'recharge')

                                            setDriver(prev => prev ? ({ ...prev, walletBalance: (prev.walletBalance || 0) + amount }) : null)
                                            toast.success(`Recharged ₹${amount} successfully`)
                                        } catch (e) {
                                            toast.error("Recharge failed")
                                        } finally {
                                            setProcessingAction(false)
                                        }
                                    }}
                                >
                                    <Plus className="mr-2 h-4 w-4" /> Recharge Wallet
                                </Button>
                                <Button
                                    variant="outline"
                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                    disabled={processingAction}
                                    onClick={async () => {
                                        const amountStr = prompt("Enter amount to deduct (₹):")
                                        const amount = parseFloat(amountStr || "0")
                                        if (isNaN(amount) || amount <= 0) return

                                        if (!admin) return
                                        setProcessingAction(true)
                                        try {
                                            await updateWalletBalance(driver.id, amount, 'deduct')

                                            // Ledger Entry
                                            await addDoc(collection(db, "ledger_entries"), {
                                                amount,
                                                type: 'debit',
                                                account: 'driver_wallet',
                                                driverId: driver.id,
                                                description: `Admin Deduction: ${amount}`,
                                                timestamp: serverTimestamp(),
                                                adminId: admin.uid
                                            })

                                            await logWalletAdjustment(admin.uid, admin.email || "", 'driver', driver.id, driver.name || "N/A", amount, 'deduct')

                                            setDriver(prev => prev ? ({ ...prev, walletBalance: (prev.walletBalance || 0) - amount }) : null)
                                            toast.error(`Deducted ₹${amount} successfully`)
                                        } catch (e) {
                                            toast.error("Deduction failed")
                                        } finally {
                                            setProcessingAction(false)
                                        }
                                    }}
                                >
                                    <Minus className="mr-2 h-4 w-4" /> Deduct Amount
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs for History & Docs */}
            <Tabs defaultValue="rides" className="w-full">
                <TabsList>
                    <TabsTrigger value="rides">Ride History</TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                </TabsList>

                <TabsContent value="rides" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Rides</CardTitle>
                            <CardDescription>Last 10 rides completed by this driver.</CardDescription>
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

                <TabsContent value="documents" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Driver Documents</CardTitle>
                            <CardDescription>Verified documents uploaded by the driver.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {Object.entries(driver.documents || {}).length === 0 ? (
                                    <div className="col-span-3 text-center py-8 text-muted-foreground">
                                        No documents uploaded yet.
                                    </div>
                                ) : (
                                    <>
                                        {/* Profile Photo Verification (Always first) */}
                                        <div className="border rounded-lg p-4 flex flex-col gap-3 bg-blue-50/30">
                                            <div className="flex items-center justify-between">
                                                <div className="bg-blue-100 p-2 rounded-full">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={driver.photoURL} />
                                                        <AvatarFallback>{driver.name?.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                </div>
                                                <Badge variant="outline" className="bg-white">PROFILE PHOTO</Badge>
                                            </div>
                                            <div>
                                                <div className="font-medium">Profile Picture</div>
                                                <div className="text-xs text-muted-foreground">
                                                    Primary identification photo
                                                </div>
                                            </div>
                                            <div className="mt-auto">
                                                <Button variant="outline" size="sm" className="w-full" asChild>
                                                    <a href={driver.photoURL} target="_blank" rel="noopener noreferrer">View Full Size</a>
                                                </Button>
                                            </div>
                                        </div>

                                        {Object.entries(driver.documents || {}).map(([docType, docData]: [string, any]) => (
                                            <div key={docType} className="border rounded-lg p-4 flex flex-col gap-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="bg-muted p-2 rounded-full">
                                                        <FileText className="h-5 w-5" />
                                                    </div>
                                                    <Badge variant={
                                                        docData.status === 'approved' ? 'secondary' :
                                                            docData.status === 'rejected' ? 'destructive' : 'outline'
                                                    } className={docData.status === 'approved' ? 'bg-green-100 text-green-800' : ''}>
                                                        {docData.status.toUpperCase()}
                                                    </Badge>
                                                </div>
                                                <div>
                                                    <div className="font-medium capitalize">{docType.replace(/_/g, ' ')}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        Uploaded: {docData.updatedAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                                                    </div>
                                                </div>
                                                <div className="mt-auto space-y-2">
                                                    <Button variant="outline" size="sm" className="w-full" asChild>
                                                        <a href={docData.url} target="_blank" rel="noopener noreferrer">View Document</a>
                                                    </Button>
                                                    {docData.status === 'pending' && (
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <Button
                                                                variant="default"
                                                                size="sm"
                                                                className="bg-green-600 hover:bg-green-700"
                                                                disabled={processingDoc === docType}
                                                                onClick={async () => {
                                                                    if (!admin) return
                                                                    setProcessingDoc(docType);
                                                                    try {
                                                                        await updateDriverDocumentStatus(driver.id, docType, 'approved');
                                                                        await logDocumentVerification(admin.uid, admin.email || "", driver.id, driver.name || "N/A", docType, 'verify')

                                                                        // Refresh driver data locally
                                                                        setDriver(prev => prev ? ({
                                                                            ...prev,
                                                                            documents: {
                                                                                ...prev.documents,
                                                                                [docType]: { ...prev.documents![docType], status: 'approved' }
                                                                            }
                                                                        }) : null)
                                                                        toast.success(`${docType} approved`)
                                                                    } catch (e) {
                                                                        toast.error("Verification failed")
                                                                    } finally {
                                                                        setProcessingDoc(null);
                                                                    }
                                                                }}
                                                            >
                                                                Approve
                                                            </Button>
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                disabled={processingDoc === docType}
                                                                onClick={async () => {
                                                                    if (!admin) return
                                                                    const reason = prompt("Enter rejection reason:")
                                                                    if (reason === null) return // Canceled

                                                                    setProcessingDoc(docType);
                                                                    try {
                                                                        await updateDriverDocumentStatus(driver.id, docType, 'rejected', reason);
                                                                        await logDocumentVerification(admin.uid, admin.email || "", driver.id, driver.name || "N/A", docType, 'reject', reason)

                                                                        setDriver(prev => prev ? ({
                                                                            ...prev,
                                                                            documents: {
                                                                                ...prev.documents,
                                                                                [docType]: { ...prev.documents![docType], status: 'rejected', rejectionReason: reason }
                                                                            }
                                                                        }) : null)
                                                                        toast.error(`${docType} rejected`)
                                                                    } catch (e) {
                                                                        toast.error("Rejection failed")
                                                                    } finally {
                                                                        setProcessingDoc(null);
                                                                    }
                                                                }}
                                                            >
                                                                Reject
                                                            </Button>
                                                        </div>
                                                    )}
                                                    {docData.status === 'rejected' && docData.rejectionReason && (
                                                        <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                                                            Reason: {docData.rejectionReason}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
            {/* Confirmation Dialog */}
            <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {actionType === 'suspended' ? 'Suspend Driver Account' :
                                actionType === 'blocked' ? 'Block Driver Account' : 'Activate Driver Account'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {actionType === 'suspended' ?
                                "Are you sure you want to suspend this driver? They will not be able to accept new rides." :
                                actionType === 'blocked' ?
                                    "Are you sure you want to BLOCK this driver? This is a severe action for policy violations." :
                                    "Are you sure you want to activate this driver? They will be able to accept rides immediately."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={processingAction}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleStatusUpdate}
                            disabled={processingAction}
                            className={
                                actionType === 'suspended' || actionType === 'blocked'
                                    ? 'bg-destructive hover:bg-destructive/90'
                                    : 'bg-green-600 hover:bg-green-700'
                            }
                        >
                            {processingAction ? 'Processing...' : 'Confirm'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
