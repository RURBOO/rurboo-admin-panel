"use client"

import { useState } from "react"
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
import { MoreHorizontal, Ban, CheckCircle, Shield } from "lucide-react"
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
import { useUsers } from "@/features/users/hooks/useUsers"
import { exportToCSV } from "@/lib/utils/export"
import { toast } from "sonner"
import { doc, updateDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/features/auth/AuthContext"
import { logUserBlock, logUserUnblock } from "@/lib/adminActions"

export default function UsersPage() {
    const { users, loading } = useUsers()
    const { user } = useAuth()
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [selectedUser, setSelectedUser] = useState<any>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [actionType, setActionType] = useState<'block' | 'unblock'>('block')
    const [processing, setProcessing] = useState(false)

    const handleExport = () => {
        const dataToExport = statusFilter === "all"
            ? users
            : users.filter(u => statusFilter === "blocked" ? u.isBlocked : !u.isBlocked)
        exportToCSV(dataToExport, `rurboo_users_${statusFilter}_export`)
        toast.success(`Exported ${dataToExport.length} users`)
    }

    const openBlockDialog = (userData: any, action: 'block' | 'unblock') => {
        setSelectedUser(userData)
        setActionType(action)
        setIsDialogOpen(true)
    }

    const handleBlockToggle = async () => {
        if (!selectedUser || !user) return

        setProcessing(true)
        try {
            const newBlockedStatus = actionType === 'block'

            await updateDoc(doc(db, "users", selectedUser.id), {
                isBlocked: newBlockedStatus,
                blockedBy: newBlockedStatus ? user.uid : null,
                blockedAt: newBlockedStatus ? serverTimestamp() : null,
                blockedReason: newBlockedStatus ? "Admin action" : null
            })

            // Log the action
            if (newBlockedStatus) {
                await logUserBlock(
                    user.uid,
                    user.email || "",
                    selectedUser.id,
                    selectedUser.name || selectedUser.email
                )
                toast.success(`User ${selectedUser.name || selectedUser.email} has been blocked`)
            } else {
                await logUserUnblock(
                    user.uid,
                    user.email || "",
                    selectedUser.id,
                    selectedUser.name || selectedUser.email
                )
                toast.success(`User ${selectedUser.name || selectedUser.email} has been unblocked`)
            }

            setIsDialogOpen(false)
            setSelectedUser(null)
        } catch (error) {
            console.error("Error updating user status:", error)
            toast.error("Failed to update user status. Please try again.")
        } finally {
            setProcessing(false)
        }
    }

    // Filter users based on selected status
    const filteredUsers = statusFilter === "all"
        ? users
        : statusFilter === "blocked"
            ? users.filter(u => u.isBlocked)
            : users.filter(u => !u.isBlocked)

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Users</h2>
                    <p className="text-muted-foreground">
                        Manage rider accounts and access control.
                    </p>
                </div>
                <div className="flex gap-2 items-center">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Users ({users.length})</SelectItem>
                            <SelectItem value="active">Active ({users.filter(u => !u.isBlocked).length})</SelectItem>
                            <SelectItem value="blocked">Blocked ({users.filter(u => u.isBlocked).length})</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={handleExport}>Export CSV</Button>
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Total Rides</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center h-24">
                                    Loading users...
                                </TableCell>
                            </TableRow>
                        ) : filteredUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center h-24">
                                    No users found for the selected filter.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredUsers.map((userData) => (
                                <TableRow key={userData.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={userData.photoURL} />
                                                <AvatarFallback>{userData.name?.charAt(0) || "U"}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-medium">{userData.name || "N/A"}</div>
                                                <div className="text-sm text-muted-foreground">ID: {userData.id.slice(0, 8)}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{userData.email || "N/A"}</TableCell>
                                    <TableCell>{userData.phoneNumber || "N/A"}</TableCell>
                                    <TableCell>{new Date(userData.createdAt?.toDate?.() || Date.now()).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        {userData.isBlocked ? (
                                            <Badge variant="destructive" className="gap-1">
                                                <Ban className="h-3 w-3" />
                                                Blocked
                                            </Badge>
                                        ) : (
                                            <Badge variant="default" className="gap-1 bg-green-600">
                                                <CheckCircle className="h-3 w-3" />
                                                Active
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>{userData.totalRides || 0}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => window.location.href = `/dashboard/users/${userData.id}`}>View Details</DropdownMenuItem>
                                                <DropdownMenuItem>View Ride History</DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                {userData.isBlocked ? (
                                                    <DropdownMenuItem
                                                        onClick={() => openBlockDialog(userData, 'unblock')}
                                                        className="text-green-600"
                                                    >
                                                        <CheckCircle className="mr-2 h-4 w-4" />
                                                        Unblock User
                                                    </DropdownMenuItem>
                                                ) : (
                                                    <DropdownMenuItem
                                                        onClick={() => openBlockDialog(userData, 'block')}
                                                        className="text-destructive"
                                                    >
                                                        <Ban className="mr-2 h-4 w-4" />
                                                        Block User
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
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
                            {actionType === 'block' ? (
                                <>
                                    <Ban className="h-5 w-5 text-destructive" />
                                    Block User
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                    Unblock User
                                </>
                            )}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {actionType === 'block' ? (
                                <>
                                    Are you sure you want to block <strong>{selectedUser?.name || selectedUser?.email}</strong>?
                                    <br /><br />
                                    This user will no longer be able to:
                                    <ul className="list-disc list-inside mt-2 space-y-1">
                                        <li>Book new rides</li>
                                        <li>Access their account</li>
                                        <li>Use the Rurboo platform</li>
                                    </ul>
                                    <br />
                                    This action will be logged in the admin audit trail.
                                </>
                            ) : (
                                <>
                                    Are you sure you want to unblock <strong>{selectedUser?.name || selectedUser?.email}</strong>?
                                    <br /><br />
                                    This will restore full account access and the user will be able to use the Rurboo platform again.
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleBlockToggle}
                            disabled={processing}
                            className={actionType === 'block' ? 'bg-destructive hover:bg-destructive/90' : ''}
                        >
                            {processing ? 'Processing...' : (actionType === 'block' ? 'Block User' : 'Unblock User')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
