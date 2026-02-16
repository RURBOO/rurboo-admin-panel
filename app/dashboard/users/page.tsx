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
import { MoreHorizontal, Ban, CheckCircle, Filter } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { useUsers } from "@/features/users/hooks/useUsers"
import { exportToCSV } from "@/lib/utils/export"
import { useState } from "react"

export default function UsersPage() {
    const { users, loading, toggleBlockUser } = useUsers()
    const [roleFilter, setRoleFilter] = useState<string | null>(null)

    const handleExport = () => {
        const dataToExport = roleFilter
            ? users.filter(u => u.role === roleFilter) // Assuming user has a role field, if not we export all
            : users
        exportToCSV(dataToExport, `rurboo_users_${roleFilter || 'all'}_export`)
    }

    const handleBlockToggle = async (userId: string, currentStatus: boolean) => {
        await toggleBlockUser(userId, currentStatus)
    }

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Users</h2>
                    <p className="text-muted-foreground">
                        Manage rider accounts and access control.
                    </p>
                </div>
                <div className="flex gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline"><Filter className="mr-2 h-4 w-4" /> {roleFilter ? roleFilter : 'All Roles'}</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuLabel>Filter by Role</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setRoleFilter(null)}>All Roles</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setRoleFilter('rider')}>Riders</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setRoleFilter('admin')}>Admins</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="outline" onClick={handleExport}>Export CSV</Button>
                </div>      </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">Image</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead className="text-right">Rides</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[80px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center h-24">
                                    Loading users...
                                </TableCell>
                            </TableRow>
                        ) : users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center h-24">
                                    No users found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <Avatar>
                                            <AvatarImage src="/avatars/user.png" alt={user.name} />
                                            <AvatarFallback>{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
                                        </Avatar>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium">{user.name || 'Guest User'}</div>
                                        <div className="text-xs text-muted-foreground">ID: {user.id.substring(0, 8)}</div>
                                    </TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>{user.phoneNumber || '-'}</TableCell>
                                    <TableCell className="text-right">{user.totalRides || 0}</TableCell>
                                    <TableCell>
                                        <Badge variant={user.isBlocked ? "destructive" : "secondary"}>
                                            {user.isBlocked ? "Blocked" : "Active"}
                                        </Badge>
                                    </TableCell>
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
                                                <DropdownMenuItem>Ride History</DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className={user.isBlocked ? "text-green-600" : "text-red-600"}
                                                    onClick={() => handleBlockToggle(user.id, user.isBlocked || false)}
                                                >
                                                    {user.isBlocked ? (
                                                        <><CheckCircle className="mr-2 h-4 w-4" /> Unblock User</>
                                                    ) : (
                                                        <><Ban className="mr-2 h-4 w-4" /> Block User</>
                                                    )}
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
