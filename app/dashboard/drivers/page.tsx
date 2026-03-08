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
import { MoreHorizontal, ShieldCheck, ShieldAlert, CheckCircle, XCircle, Download, ArrowUpDown, Calendar as CalendarIcon, Upload } from "lucide-react"
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
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { KycApprovalPanel } from "./components/KycApprovalPanel"
import { PenaltiesDashboard } from "./components/PenaltiesDashboard"
import { useDrivers } from "@/features/drivers/hooks/useDrivers"
import { exportToExcel } from "@/lib/exportUtils"
import { toast } from "sonner"
import { doc, updateDoc, serverTimestamp, addDoc, collection } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Driver } from "@/lib/types"
import { useAuth } from "@/features/auth/AuthContext"
import { logDriverSuspend, logDriverApprove } from "@/lib/adminActions"

export default function DriversPage() {
    const [dateRange, setDateRange] = useState<{ from: Date, to?: Date } | undefined>()
    const { drivers, loading } = useDrivers(dateRange)
    const { user } = useAuth()
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [sortFilter, setSortFilter] = useState<string>("recent")
    const [exportRange, setExportRange] = useState<string>("all")
    const [selectedDriver, setSelectedDriver] = useState<any>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isAddDriverOpen, setIsAddDriverOpen] = useState(false)
    const [actionType, setActionType] = useState<'suspend' | 'approve' | 'activate' | 'verify_vehicle'>('suspend')
    const [processing, setProcessing] = useState(false)
    const [newDriverData, setNewDriverData] = useState({ name: '', email: '', phone: '' })
    const router = useRouter()

    const handleExport = () => {
        let exportables = statusFilter === "all"
            ? drivers
            : drivers.filter(d => d.status === statusFilter)

        const dataToExport = exportables.map(d => ({
            "Name": d.name || "N/A",
            "Email": d.email || "N/A",
            "Phone Number": d.phoneNumber || "N/A",
            "Status": d.status || "N/A",
            "Joined Date": new Date(d.createdAt?.toDate?.() || Date.now()).toLocaleDateString(),
            "Total Rides": d.totalRides || 0,
            "Rating": d.rating || 5.0
        }))

        exportToExcel(dataToExport, `Rurboo_Drivers_Export`)
        toast.success(`Exported ${dataToExport.length} drivers to Excel`)
    }

    const handleAddDriver = async () => {
        if (!newDriverData.name || !newDriverData.phone) {
            toast.error("Please provide at least Name and Phone");
            return;
        }
        setProcessing(true);
        try {
            await addDoc(collection(db, "drivers"), {
                name: newDriverData.name,
                email: newDriverData.email,
                phoneNumber: newDriverData.phone,
                status: 'pending',
                createdAt: serverTimestamp(),
                totalRides: 0,
                rating: 5.0
            });
            toast.success("Driver added successfully");
            setIsAddDriverOpen(false);
            setNewDriverData({ name: '', email: '', phone: '' });
        } catch (error) {
            console.error("Error adding driver", error);
            toast.error("Failed to add driver");
        } finally {
            setProcessing(false);
        }
    }

    const openActionDialog = (driverData: any, action: 'suspend' | 'approve' | 'activate' | 'verify_vehicle') => {
        setSelectedDriver(driverData)
        setActionType(action)
        setIsDialogOpen(true)
    }

    const handleStatusUpdate = async () => {
        if (!selectedDriver || !user) return

        setProcessing(true)
        try {
            if (actionType === 'verify_vehicle') {
                await updateDoc(doc(db, "drivers", selectedDriver.id), {
                    rcStatus: 'approved',
                    vehicleStatus: 'approved',
                    rcRejectionReason: null,
                    vehicleRejectionReason: null,
                    updatedAt: serverTimestamp(),
                    updatedBy: user.uid
                })

                toast.success(`Vehicle verified for ${selectedDriver.name || selectedDriver.email}`)
            } else {
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
    let filteredDrivers = statusFilter === "all"
        ? drivers
        : drivers.filter(d => d.status === statusFilter)

    // Sort drivers based on selection
    filteredDrivers = [...filteredDrivers].sort((a, b) => {
        if (sortFilter === 'alphabetical') {
            return (a.name || "").localeCompare(b.name || "");
        } else if (sortFilter === 'top') {
            return (b.totalRides || 0) - (a.totalRides || 0);
        } else {
            // Default: recent
            const aDate = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt ? new Date(a.createdAt as any).getTime() : 0);
            const bDate = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt ? new Date(b.createdAt as any).getTime() : 0);
            return bDate - aDate;
        }
    });

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
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="verified">Verified</SelectItem>
                            <SelectItem value="suspended">Suspended</SelectItem>
                            <SelectItem value="blocked">Blocked</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={sortFilter} onValueChange={setSortFilter}>
                        <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="recent">Recent Joined</SelectItem>
                            <SelectItem value="alphabetical">Alphabetical (A-Z)</SelectItem>
                            <SelectItem value="top">Top Bookings</SelectItem>
                        </SelectContent>
                    </Select>

                    <DatePickerWithRange date={dateRange} setDate={setDateRange as any} />

                    <Button variant="outline" className="gap-2" onClick={handleExport}>
                        <Download className="h-4 w-4" /> Export Excel
                    </Button>
                    <Button onClick={() => setIsAddDriverOpen(true)}>Add Driver</Button>
                </div>
            </div>

            <Tabs defaultValue="all" className="w-full">
                <TabsList className="mb-6 p-1 bg-secondary/50 border rounded-lg h-auto inline-flex flex-wrap gap-2">
                    <TabsTrigger value="all" className="py-2 px-4 shadow-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Driver Roster</TabsTrigger>
                    <TabsTrigger value="kyc" className="py-2 px-4 shadow-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">KYC Approvals</TabsTrigger>
                    <TabsTrigger value="penalties" className="py-2 px-4 shadow-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Penalties & Bans</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4">
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
                                                            {driver.rcStatus !== 'approved' || driver.vehicleStatus !== 'approved' ? (
                                                                <DropdownMenuItem
                                                                    onClick={(e) => { e.stopPropagation(); openActionDialog(driver, 'verify_vehicle'); }}
                                                                    className="text-blue-600"
                                                                >
                                                                    <CheckCircle className="mr-2 h-4 w-4" />
                                                                    Verify Vehicle
                                                                </DropdownMenuItem>
                                                            ) : null}
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
                </TabsContent>

                <TabsContent value="kyc" className="animate-in fade-in-50">
                    <KycApprovalPanel drivers={drivers} />
                </TabsContent>

                <TabsContent value="penalties" className="animate-in fade-in-50">
                    <PenaltiesDashboard drivers={drivers} />
                </TabsContent>
            </Tabs>

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
                            ) : actionType === 'verify_vehicle' ? (
                                <>
                                    <CheckCircle className="h-5 w-5 text-blue-600" />
                                    Verify Vehicle
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
                            ) : actionType === 'verify_vehicle' ? (
                                <>
                                    Are you sure you want to verify the vehicle for <strong>{selectedDriver?.name || selectedDriver?.email}</strong>?
                                    <br /><br />
                                    This will automatically mark their <strong>Registration (RC)</strong> and <strong>Vehicle Photo</strong> as Approved.
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
                            className={actionType === 'suspend' ? 'bg-destructive hover:bg-destructive/90' : actionType === 'verify_vehicle' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}
                        >
                            {processing ? 'Processing...' : (
                                actionType === 'suspend' ? 'Suspend Driver' :
                                    actionType === 'verify_vehicle' ? 'Verify Vehicle' :
                                        actionType === 'approve' ? 'Approve Driver' : 'Activate Driver'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            {/* Add Driver Dialog */}
            <AlertDialog open={isAddDriverOpen} onOpenChange={setIsAddDriverOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Add New Driver</AlertDialogTitle>
                        <AlertDialogDescription>
                            Create a new pending driver profile. They will need to log in and upload their documents.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium">Full Name</label>
                            <input
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={newDriverData.name}
                                onChange={(e) => setNewDriverData({ ...newDriverData, name: e.target.value })}
                                placeholder="John Doe"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium">Phone Number</label>
                            <input
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={newDriverData.phone}
                                onChange={(e) => setNewDriverData({ ...newDriverData, phone: e.target.value })}
                                placeholder="+91 9876543210"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium">Email Address (Optional)</label>
                            <input
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={newDriverData.email}
                                onChange={(e) => setNewDriverData({ ...newDriverData, email: e.target.value })}
                                placeholder="john@example.com"
                            />
                        </div>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleAddDriver} disabled={processing}>
                            {processing ? 'Adding...' : 'Add Driver'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
