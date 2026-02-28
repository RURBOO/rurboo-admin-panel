"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MoreHorizontal, ShieldCheck, ShieldAlert, CheckCircle, XCircle } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
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
import { exportToCSV } from "@/lib/utils/export"
import { toast } from "sonner"
import { doc, updateDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Driver } from "@/lib/types"
import { useAuth } from "@/features/auth/AuthContext"
import { logDriverSuspend, logDriverApprove } from "@/lib/adminActions"

export default function DriversPage() {
    const { drivers, loading } = useDrivers()
    const { user } = useAuth()
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [selectedDriver, setSelectedDriver] = useState<any>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [actionType, setActionType] = useState<'suspend' | 'approve' | 'activate'>('suspend')
    const [processing, setProcessing] = useState(false)
    const router = useRouter()

    const handleExport = () => {
        const dataToExport = statusFilter === "all"
            ? drivers
            : drivers.filter(d => d.status === statusFilter)
        exportToCSV(dataToExport, `rurboo_drivers_${statusFilter}_export`)
        toast.success(`Exported ${dataToExport.length} drivers`)
    }

    const openActionDialog = (driverData: any, action: 'suspend' | 'approve' | 'activate') => {
        setSelectedDriver(driverData)
        setActionType(action)
        setIsDialogOpen(true)
    }

    const handleStatusUpdate = async () => {
        if (!selectedDriver || !user) return

        setProcessing(true)
        try {
            let newStatus = ''

            switch (actionType) {
                case 'suspend':
                    newStatus = 'suspended'
                    break
                case 'approve':
                case 'activate':
                    newStatus = 'verified'
                    break
            }

            await updateDoc(doc(db, "drivers", selectedDriver.id), {
                status: newStatus,
                updatedAt: serverTimestamp(),
                updatedBy: user.uid
            })

            // Log the action
            if (actionType === 'suspend') {
                await logDriverSuspend(
                    user.uid,
                    user.email || "",
                    selectedDriver.id,
                    selectedDriver.name || selectedDriver.email,
                    "Admin action"
                )
                toast.success(`Driver ${selectedDriver.name || selectedDriver.email} has been suspended`)
            } else {
                await logDriverApprove(
                    user.uid,
                    user.email || "",
                    selectedDriver.id,
                    selectedDriver.name || selectedDriver.email
                )
                toast.success(`Driver ${selectedDriver.name || selectedDriver.email} has been ${actionType === 'approve' ? 'approved' : 'activated'}`)
            }

            setIsDialogOpen(false)
            setSelectedDriver(null)
        } catch (error) {
            console.error("Error updating driver status:", error)
            toast.error("Failed to update driver status. Please try again.")
        } finally {
            setProcessing(false)
        }
    }

    // Filter drivers based on selected status
    const filteredDrivers = statusFilter === "all"
        ? drivers
        : drivers.filter(d => d.status === statusFilter)

    const getStatusBadge = (status: string, verified: boolean) => {
        switch (status) {
            case 'verified':
                return (
                    <Badge variant="default" className="gap-1 bg-green-600">
                        <CheckCircle className="h-3 w-3" />
                        Verified
                    </Badge>
                )
            case 'suspended':
                return (
                    <Badge variant="destructive" className="gap-1">
                        <ShieldAlert className="h-3 w-3" />
                        Suspended
                    </Badge>
                )
            case 'blocked':
                return (
                    <Badge variant="destructive" className="gap-1 bg-black">
                        <XCircle className="h-3 w-3" />
                        Blocked
                    </Badge>
                )
            case 'pending':
                return (
                    <Badge variant="secondary" className="gap-1">
                        <XCircle className="h-3 w-3" />
                        Pending
                    </Badge>
                )
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    const canActivateDriver = (driver: Driver) => {
        return Boolean(
            driver.profileImage && driver.profileStatus === 'approved' &&
            driver.licenseImage && driver.licenseStatus === 'approved' &&
            driver.rcImage && driver.rcStatus === 'approved'
        );
    };

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Drivers</h2>
                    <p className="text-muted-foreground">
                        Manage driver verification, approval, and account status.
                    </p>
                </div>
                <div className="flex gap-2 items-center">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Drivers ({drivers.length})</SelectItem>
                            <SelectItem value="verified">Verified ({drivers.filter(d => d.status === 'verified').length})</SelectItem>
                            <SelectItem value="suspended">Suspended ({drivers.filter(d => d.status === 'suspended').length})</SelectItem>
                            <SelectItem value="blocked">Blocked ({drivers.filter(d => d.status === 'blocked').length})</SelectItem>
                            <SelectItem value="pending">Pending ({drivers.filter(d => d.status === 'pending').length})</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={handleExport}>Export CSV</Button>
                    <Button>Add Driver</Button>
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Driver</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Vehicle</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Rating</TableHead>
                            <TableHead>Total Rides</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center h-24">
                                    Loading drivers...
                                </TableCell>
                            </TableRow>
                        ) : filteredDrivers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center h-24">
                                    No drivers found for the selected filter.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredDrivers.map((driver) => (
                                <TableRow
                                    key={driver.id}
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => router.push(`/dashboard/drivers/${driver.id}`)}
                                >
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={driver.photoURL} />
                                                <AvatarFallback>{driver.name?.charAt(0) || "D"}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-medium">{driver.name || "N/A"}</div>
                                                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                                    {driver.verified && (
                                                        <span className="flex items-center gap-1">
                                                            <ShieldCheck className="h-3 w-3 text-blue-600" />
                                                            Verified
                                                        </span>
                                                    )}
                                                    <Badge variant="outline" className={`text-[10px] px-1 py-0 h-4 ${driver.isOnline ? "border-green-500 text-green-600" : "text-muted-foreground"}`}>
                                                        {driver.isOnline ? "Online" : "Offline"}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{driver.phone || driver.phoneNumber || "N/A"}</TableCell>
                                    <TableCell>
                                        <div>
                                            <div className="font-medium">{driver.vehicleType || "N/A"}</div>
                                            <div className="text-sm text-muted-foreground">{driver.vehicleNumber || ""}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{getStatusBadge(driver.status, driver.verified || false)}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            ⭐ {driver.rating?.toFixed(1) || "N/A"}
                                        </div>
                                    </TableCell>
                                    <TableCell>{driver.totalRides || 0}</TableCell>
                                    <TableCell className="text-right">
                                        <div onClick={(e) => e.stopPropagation()}>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/drivers/${driver.id}`); }}>
                                                        View Profile
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/drivers/${driver.id}?tab=documents`); }}>
                                                        View Documents
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/rides?driverId=${driver.id}`); }}>
                                                        View Ride History
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    {driver.status === 'pending' && (
                                                        <DropdownMenuItem
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (!canActivateDriver(driver)) {
                                                                    e.preventDefault();
                                                                    toast.error("Cannot approve: All documents must be uploaded and approved first.");
                                                                    return;
                                                                }
                                                                openActionDialog(driver, 'approve');
                                                            }}
                                                            className="text-green-600"
                                                        >
                                                            <CheckCircle className="mr-2 h-4 w-4" />
                                                            Approve Driver
                                                        </DropdownMenuItem>
                                                    )}
                                                    {driver.status === 'suspended' && (
                                                        <DropdownMenuItem
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (!canActivateDriver(driver)) {
                                                                    e.preventDefault();
                                                                    toast.error("Cannot activate: All documents must be uploaded and approved first.");
                                                                    return;
                                                                }
                                                                openActionDialog(driver, 'activate');
                                                            }}
                                                            className="text-green-600"
                                                        >
                                                            <CheckCircle className="mr-2 h-4 w-4" />
                                                            Activate Driver
                                                        </DropdownMenuItem>
                                                    )}
                                                    {driver.status === 'verified' && (
                                                        <DropdownMenuItem
                                                            onClick={(e) => { e.stopPropagation(); openActionDialog(driver, 'suspend'); }}
                                                            className="text-destructive"
                                                        >
                                                            <ShieldAlert className="mr-2 h-4 w-4" />
                                                            Suspend Driver
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Confirmation Dialog */}
            <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            {actionType === 'suspend' ? (
                                <>
                                    <ShieldAlert className="h-5 w-5 text-destructive" />
                                    Suspend Driver
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                    {actionType === 'approve' ? 'Approve Driver' : 'Activate Driver'}
                                </>
                            )}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {actionType === 'suspend' ? (
                                <>
                                    Are you sure you want to suspend <strong>{selectedDriver?.name || selectedDriver?.email}</strong>?
                                    <br /><br />
                                    Suspended drivers will:
                                    <ul className="list-disc list-inside mt-2 space-y-1">
                                        <li>Not be able to accept new rides</li>
                                        <li>Not appear in availability searches</li>
                                        <li>Not have access to the driver app</li>
                                    </ul>
                                    <br />
                                    This action will be logged in the admin audit trail.
                                </>
                            ) : actionType === 'approve' ? (
                                <>
                                    Are you sure you want to approve <strong>{selectedDriver?.name || selectedDriver?.email}</strong>?
                                    <br /><br />
                                    This driver will:
                                    <ul className="list-disc list-inside mt-2 space-y-1">
                                        <li>Get access to the driver app</li>
                                        <li>Be able to accept ride requests</li>
                                        <li>Appear in user searches based on vehicle type</li>
                                    </ul>
                                    <br />
                                    Make sure you've verified all documents before approving.
                                </>
                            ) : (
                                <>
                                    Are you sure you want to activate <strong>{selectedDriver?.name || selectedDriver?.email}</strong>?
                                    <br /><br />
                                    This will restore full driver access and allow them to accept rides again.
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleStatusUpdate}
                            disabled={processing}
                            className={actionType === 'suspend' ? 'bg-destructive hover:bg-destructive/90' : 'bg-green-600 hover:bg-green-700'}
                        >
                            {processing ? 'Processing...' : (
                                actionType === 'suspend' ? 'Suspend Driver' :
                                    actionType === 'approve' ? 'Approve Driver' : 'Activate Driver'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
