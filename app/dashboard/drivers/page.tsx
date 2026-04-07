"use client"

import { useState, useEffect } from "react"
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
import { MoreHorizontal, ShieldCheck, ShieldAlert, CheckCircle, XCircle, Download, ArrowUpDown, Calendar as CalendarIcon, Upload, MapPin, Bike, Car, Truck, Zap, Wallet, Users, AlertCircle, WifiIcon } from "lucide-react"
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
import { reverseGeocode } from "@/lib/reverseGeocode"

const VEHICLE_TYPES = ['bike', 'e-rikshaw', 'auto', 'comfort car', 'big car', 'carrier truck']
const VEHICLE_LABELS: Record<string, string> = {
    'bike': 'Bike',
    'e-rikshaw': 'E-Rikshaw',
    'auto': 'Auto Rikshaw',
    'comfort car': 'Comfort Car',
    'big car': 'Big Car',
    'carrier truck': 'Carrier Truck',
    // Legacy Firestore values from older app versions
    'bike taxi': 'Bike',
    'bike txi': 'Bike',
    'biketaxi': 'Bike',
    'e rikshaw': 'E-Rikshaw',
    'e-rickshaw': 'E-Rikshaw',
    'auto rickshaw': 'Auto Rikshaw',
    'auto rikshaw': 'Auto Rikshaw',
    'autorickshaw': 'Auto Rikshaw',
    'comfort': 'Comfort Car',
    'car': 'Comfort Car',
    'suv': 'Big Car',
    'truck': 'Carrier Truck',
    'carrier': 'Carrier Truck',
}
const getVehicleLabel = (v?: string) => {
    if (!v) return 'N/A'
    return VEHICLE_LABELS[v.toLowerCase().trim()] || v
}

export default function DriversPage() {
    const [dateRange, setDateRange] = useState<{ from: Date, to?: Date } | undefined>()
    const { drivers, loading } = useDrivers(dateRange)
    const { user } = useAuth()
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [vehicleFilter, setVehicleFilter] = useState<string>("all")
    const [sortFilter, setSortFilter] = useState<string>("recent")
    const [exportRange, setExportRange] = useState<string>("all")
    const [commissionFilter, setCommissionFilter] = useState<string>("all")
    const [onlineFilter, setOnlineFilter] = useState<string>("all")
    const [selectedDriver, setSelectedDriver] = useState<any>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isAddDriverOpen, setIsAddDriverOpen] = useState(false)
    const [actionType, setActionType] = useState<'suspend' | 'approve' | 'activate' | 'verify_vehicle'>('suspend')
    const [processing, setProcessing] = useState(false)
    const [newDriverData, setNewDriverData] = useState({ name: '', email: '', phone: '' })
    const [locationNames, setLocationNames] = useState<Record<string, string>>({})
    const router = useRouter()

    // Helper: pick the best available location coords from any field
    const getBestLocation = (d: any): { lat: number; lng: number; isLive: boolean } | null => {
        // Standard GeoPoint field (driver app saves this every 30s)
        if (d.currentLocation?.latitude && d.currentLocation?.longitude)
            return { lat: d.currentLocation.latitude, lng: d.currentLocation.longitude, isLive: !!d.isOnline }
        // GeoFlutterFire format: location.geopoint (used for proximity queries)
        if (d.location?.geopoint?.latitude && d.location?.geopoint?.longitude)
            return { lat: d.location.geopoint.latitude, lng: d.location.geopoint.longitude, isLive: !!d.isOnline }
        // Fallback: lastLocation field
        if (d.lastLocation?.latitude && d.lastLocation?.longitude)
            return { lat: d.lastLocation.latitude, lng: d.lastLocation.longitude, isLive: false }
        // Plain location object
        if (d.location?.latitude && d.location?.longitude)
            return { lat: d.location.latitude, lng: d.location.longitude, isLive: false }
        return null
    }

    // Reverse geocode all available locations whenever drivers list updates
    useEffect(() => {
        const pending = drivers.filter(d => getBestLocation(d) !== null && locationNames[d.id] === undefined)
        if (pending.length === 0) return
        pending.forEach(async (d) => {
            const loc = getBestLocation(d)!
            const name = await reverseGeocode(loc.lat, loc.lng)
            // Only update if we got a result (don't cache null so refresh can retry)
            if (name) setLocationNames(prev => ({ ...prev, [d.id]: `${name}|${loc.isLive}` }))
        })
    }, [drivers])

    const formatDateTime = (ts: any) => {
        if (!ts) return 'N/A'
        const d = ts?.toDate ? ts.toDate() : new Date(ts)
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
            + ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    }

    const getLocationLabel = (driver: any) => {
        // Priority 1: geocoded place name (live or last known)
        if (locationNames[driver.id]) {
            const [name, isLive] = locationNames[driver.id].split('|')
            if (name) return isLive === 'true' ? `${name} 📍` : `${name} 🕐`
        }
        // Priority 2: registration address
        if (driver.address) {
            const parts = driver.address.split(',')
            return parts.length > 1 ? parts.slice(-2).join(',').trim() : driver.address
        }
        return null
    }

    const handleExport = () => {
        const dataToExport = filteredDrivers.map((d, idx) => ({
            "S.No": idx + 1,
            "Name": d.name || "N/A",
            "Email": d.email || "N/A",
            "Phone Number": d.phoneNumber || d.phone || "N/A",
            "Vehicle Type": getVehicleLabel(d.vehicleType),
            "Vehicle Number": d.vehicleNumber || "N/A",
            "Status": d.status || "N/A",
            "Wallet Balance (₹)": d.walletBalance || 0,
            "Pending Commission (₹)": d.pendingCommission || 0,
            "Total Rides": d.totalRides || 0,
            "Rating": d.rating || "N/A",
            "Location": d.address || "N/A",
            "Joined Date": d.createdAt?.toDate ? d.createdAt.toDate().toLocaleDateString('en-IN') : "N/A",
            "Joined Time": d.createdAt?.toDate ? d.createdAt.toDate().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : "N/A",
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

    // Filter drivers
    let filteredDrivers = drivers.filter(d => {
        const statusMatch = statusFilter === 'all' || d.status === statusFilter
        const vt = (d.vehicleType || '').toLowerCase()
        const vehicleMatch = vehicleFilter === 'all' || vt === vehicleFilter
        const commissionMatch = commissionFilter === 'all'
            || (commissionFilter === 'has_pending' && (d.pendingCommission || 0) > 0)
            || (commissionFilter === 'no_pending' && (d.pendingCommission || 0) === 0)
            || (commissionFilter === 'negative_wallet' && (d.walletBalance || 0) < 0)
        const isOnline = d.isOnline === true
        const onlineMatch = onlineFilter === 'all'
            || (onlineFilter === 'online' && isOnline)
            || (onlineFilter === 'offline' && !isOnline)
        return statusMatch && vehicleMatch && commissionMatch && onlineMatch
    })

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
            driver.licenseImage && driver.licenseStatus === 'approved' &&
            driver.rcImage && driver.rcStatus === 'approved' &&
            driver.vehicleImage && driver.vehicleStatus === 'approved'
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
                <div className="flex gap-2 items-center flex-wrap">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[160px]">
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
                    <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
                        <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Vehicle type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Vehicles</SelectItem>
                            {VEHICLE_TYPES.map(v => (
                                <SelectItem key={v} value={v}>{VEHICLE_LABELS[v]}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {/* Pending Commission / Wallet Filter */}
                    <Select value={commissionFilter} onValueChange={setCommissionFilter}>
                        <SelectTrigger className="w-[190px]">
                            <SelectValue placeholder="Commission filter" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Drivers</SelectItem>
                            <SelectItem value="has_pending">Has Pending Commission</SelectItem>
                            <SelectItem value="no_pending">No Pending Commission</SelectItem>
                            <SelectItem value="negative_wallet">Negative Wallet (₹ &lt; 0)</SelectItem>
                        </SelectContent>
                    </Select>
                    {/* Online / Offline Filter */}
                    <Select value={onlineFilter} onValueChange={setOnlineFilter}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Online status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="online">🟢 Online</SelectItem>
                            <SelectItem value="offline">⚫ Offline</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={sortFilter} onValueChange={setSortFilter}>
                        <SelectTrigger className="w-[150px]">
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

            {/* ── Stats Cards ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Total Drivers */}
                <div className="rounded-xl border bg-card p-5 flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Drivers</span>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-3xl font-bold">{drivers.length}</div>
                    <div className="text-xs text-muted-foreground">{filteredDrivers.length} shown (filtered)</div>
                </div>

                {/* Online Now */}
                <div className="rounded-xl border bg-card p-5 flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Online Now</span>
                        <WifiIcon className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="text-3xl font-bold text-green-600">
                        {drivers.filter(d => d.isOnline).length}
                    </div>
                    <div className="text-xs text-muted-foreground">Currently active</div>
                </div>

                {/* Total Wallet Balance */}
                <div className="rounded-xl border bg-card p-5 flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Wallet</span>
                        <Wallet className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="text-3xl font-bold text-blue-600">
                        ₹{drivers.reduce((sum, d) => sum + (d.walletBalance || 0), 0).toLocaleString('en-IN')}
                    </div>
                    <div className="text-xs text-muted-foreground">Combined wallet balance</div>
                </div>

                {/* Low Balance Alert */}
                <div className="rounded-xl border bg-card p-5 flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Low Balance</span>
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                    </div>
                    <div className="text-3xl font-bold text-orange-600">
                        {drivers.filter(d => (d.walletBalance || 0) < 100).length}
                    </div>
                    <div className="text-xs text-muted-foreground">Drivers with wallet &lt; ₹100</div>
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
                                    <TableHead className="w-12 text-center">#</TableHead>
                                    <TableHead>Driver</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead>Vehicle</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Rides</TableHead>
                                    <TableHead>Joined</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={10} className="text-center h-24">
                                            Loading drivers...
                                        </TableCell>
                                    </TableRow>
                                ) : filteredDrivers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={10} className="text-center h-24">
                                            No drivers found for the selected filter.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredDrivers.map((driver, index) => (
                                        <TableRow
                                            key={driver.id}
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => router.push(`/dashboard/drivers/${driver.id}`)}
                                        >
                                            {/* S.No */}
                                            <TableCell className="text-center text-xs font-mono text-muted-foreground">{index + 1}</TableCell>
                                            {/* Driver Name Cell */}
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar>
                                                        <AvatarImage src={driver.photoURL} />
                                                        <AvatarFallback>{driver.name?.charAt(0) || "D"}</AvatarFallback>
                                                    </Avatar>
                                                     <div>
                                                        <div className="font-medium">{driver.name || "N/A"}</div>
                                                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground flex-wrap">
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
                                                        {/* Wallet + Pending Commission */}
                                                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5">
                                                                <Wallet className="h-2.5 w-2.5" />
                                                                ₹{(driver.walletBalance || 0).toLocaleString('en-IN')}
                                                            </span>
                                                            {(driver.pendingCommission || 0) > 0 && (
                                                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-orange-50 text-orange-700 border border-orange-200 rounded-full px-2 py-0.5">
                                                                    <AlertCircle className="h-2.5 w-2.5" />
                                                                    Pending ₹{(driver.pendingCommission || 0).toLocaleString('en-IN')}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{driver.phone || driver.phoneNumber || "N/A"}</TableCell>
                                            {/* Location */}
                                            <TableCell>
                                                {getLocationLabel(driver) ? (
                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                        <MapPin className="h-3 w-3 shrink-0 text-blue-500" />
                                                        <span title={getLocationLabel(driver) ?? ''}>{getLocationLabel(driver)}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">—</span>
                                                )}
                                            </TableCell>
                                            {/* Vehicle */}
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium text-sm">{getVehicleLabel(driver.vehicleType)}</div>
                                                    <div className="text-xs text-muted-foreground">{driver.vehicleNumber || ""}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(driver.status, driver.verified || false)}</TableCell>
                                            <TableCell>{driver.totalRides || 0}</TableCell>
                                            {/* Joined Date+Time */}
                                            <TableCell>
                                                <div className="text-xs">
                                                    <div>{driver.createdAt?.toDate ? driver.createdAt.toDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</div>
                                                    <div className="text-muted-foreground">{driver.createdAt?.toDate ? driver.createdAt.toDate().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : ''}</div>
                                                </div>
                                            </TableCell>
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
