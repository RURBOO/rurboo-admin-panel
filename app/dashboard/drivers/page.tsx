"use client"

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
import { MoreHorizontal, ShieldCheck, ShieldAlert } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useDrivers } from "@/features/drivers/hooks/useDrivers"
import { exportToCSV } from "@/lib/utils/export"

export default function DriversPage() {
    const { drivers, loading, updateDriverStatus } = useDrivers()

    const handleExport = () => {
        exportToCSV(drivers, "rurboo_drivers_export")
    }

    const handleStatusUpdate = async (driverId: string, status: string) => {
        try {
            await updateDriverStatus(driverId, status)
            // Optional: Add toast notification here
        } catch (error) {
            console.error("Failed to update status", error)
        }
    }

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Drivers</h2>
                    <p className="text-muted-foreground">
                        Manage driver verification, approval, and account status.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExport}>Export CSV</Button>
                    <Button>Add Driver</Button>
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">Image</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Vehicle</TableHead>
                            <TableHead className="text-right">Rating</TableHead>
                            <TableHead className="w-[80px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24">
                                    Loading drivers...
                                </TableCell>
                            </TableRow>
                        ) : drivers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24">
                                    No drivers found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            drivers.map((driver) => (
                                <TableRow key={driver.id}>
                                    <TableCell>
                                        <Avatar>
                                            <AvatarImage src="/avatars/01.png" alt={driver.name} />
                                            <AvatarFallback>{driver.name ? driver.name.charAt(0).toUpperCase() : 'D'}</AvatarFallback>
                                        </Avatar>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium">{driver.name || 'Unknown Name'}</div>
                                        <div className="text-sm text-muted-foreground">{driver.email || 'No Email'}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={
                                            driver.status === 'active' ? 'default' :
                                                driver.status === 'suspended' ? 'destructive' : 'secondary'
                                        }>
                                            {driver.status === 'suspended' && (driver as any).suspensionReason?.includes('Automated')
                                                ? 'Auto-Suspended'
                                                : driver.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {driver.vehicleDetails ?
                                            `${driver.vehicleDetails.model} (${driver.vehicleDetails.number})` :
                                            'No Vehicle'}
                                    </TableCell>
                                    <TableCell className="text-right">{driver.rating && driver.rating > 0 ? driver.rating : 'N/A'}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem>View Profile</DropdownMenuItem>
                                                <DropdownMenuItem>View Documents</DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-green-600 cursor-pointer"
                                                    onClick={() => handleStatusUpdate(driver.id, 'active')}
                                                >
                                                    <ShieldCheck className="mr-2 h-4 w-4" /> Approve
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-red-600 cursor-pointer"
                                                    onClick={() => handleStatusUpdate(driver.id, 'suspended')}
                                                >
                                                    <ShieldAlert className="mr-2 h-4 w-4" /> Suspend
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            )))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
