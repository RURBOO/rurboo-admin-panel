"use client"

import { useState } from "react"
import { doc, setDoc, addDoc, collection, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useOperators } from "@/features/admin/hooks/useOperators"
import { useAdminRole } from "@/features/admin/hooks/useAdminRole"
import { useAuth } from "@/features/auth/AuthContext"
import { Plus, Trash2, Shield, ShieldAlert, PauseCircle, PlayCircle } from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { Timestamp } from "firebase/firestore"

export function OperatorManagement() {
    const { user } = useAuth()
    const { operators, loading, deleteOperator, updateOperatorStatus, refreshOperators } = useOperators()
    const { isSuperAdmin, adminData } = useAdminRole()
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [selectedOperator, setSelectedOperator] = useState<any>(null)
    const [processing, setProcessing] = useState(false)
    const [suspendingId, setSuspendingId] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        email: "",
        password: "",
        name: "",
        role: "operator" as 'super_admin' | 'admin' | 'operator',
        permissions: {
            manageDrivers: false,
            manageUsers: false,
            managePricing: false,
            manageAdmins: false,
            viewFinance: false,
            manageSOS: false,
        }
    })

    const handleAddOperator = async () => {
        if (!formData.email || !formData.password || !formData.name) {
            toast.error("Please fill in all required fields")
            return
        }
        if (formData.password.length < 8) {
            toast.error("Password must be at least 8 characters")
            return
        }

        setProcessing(true)
        try {
            // Step 1: Create Firebase Auth user via server route (no credentials needed)
            const response = await fetch('/api/operators/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    name: formData.name,
                })
            })
            const result = await response.json()

            if (!result.success) {
                toast.error(result.error || "Failed to create operator")
                return
            }

            const newUid: string = result.uid

            // Step 2: Write Firestore admins doc using current admin's auth session
            // (Firestore rules allow super_admin to create admins docs)
            await setDoc(doc(db, "admins", newUid), {
                adminId: newUid,
                email: formData.email,
                name: formData.name,
                role: formData.role,
                permissions: formData.permissions,
                status: "active",
                createdAt: serverTimestamp(),
                createdBy: user?.uid || "system",
                lastLogin: null,
            })

            // Step 3: Log the admin action
            await addDoc(collection(db, "adminActions"), {
                adminId: user?.uid || "system",
                adminEmail: user?.email || "",
                action: "create_admin",
                targetType: "admin",
                targetId: newUid,
                targetName: formData.name,
                metadata: { role: formData.role, email: formData.email },
                timestamp: serverTimestamp(),
            })

            toast.success(`Operator ${formData.name} created successfully!`)
            setIsAddDialogOpen(false)
            resetForm()
            refreshOperators()
        } catch (error: any) {
            console.error("Error creating operator:", error)
            toast.error(error?.message || "Failed to create operator. Please try again.")
        } finally {
            setProcessing(false)
        }
    }

    const handleDeleteOperator = async () => {
        if (!selectedOperator) return
        setProcessing(true)
        try {
            const response = await fetch('/api/operators/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    operatorId: selectedOperator.adminId,
                    requestingAdminId: user?.uid,
                })
            })
            const result = await response.json()

            if (result.success) {
                toast.success(`Operator ${selectedOperator.name} deleted successfully`)
                setIsDeleteDialogOpen(false)
                setSelectedOperator(null)
                refreshOperators()
            } else {
                toast.error(result.error || "Failed to delete operator")
            }
        } catch (error) {
            console.error("Error deleting operator:", error)
            toast.error("Failed to delete operator. Please try again.")
        } finally {
            setProcessing(false)
        }
    }

    const handleToggleSuspend = async (operator: any) => {
        setSuspendingId(operator.adminId)
        const newStatus = operator.status === 'active' ? 'suspended' : 'active'
        try {
            const result = await updateOperatorStatus(operator.adminId, newStatus)
            if (result.success) {
                toast.success(`Operator ${operator.name} ${newStatus === 'active' ? 'reactivated' : 'suspended'}`)
            } else {
                toast.error("Failed to update operator status")
            }
        } catch {
            toast.error("Failed to update operator status")
        } finally {
            setSuspendingId(null)
        }
    }

    const resetForm = () => {
        setFormData({
            email: "", password: "", name: "", role: "operator",
            permissions: {
                manageDrivers: false, manageUsers: false, managePricing: false,
                manageAdmins: false, viewFinance: false, manageSOS: false,
            }
        })
    }

    const updatePermission = (key: keyof typeof formData.permissions, value: boolean) => {
        setFormData(prev => ({ ...prev, permissions: { ...prev.permissions, [key]: value } }))
    }

    if (!isSuperAdmin) return null

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Operator Management
                        </CardTitle>
                        <CardDescription>Manage admin operators and their permissions</CardDescription>
                    </div>
                    <Button onClick={() => setIsAddDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Operator
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading operators...</div>
                ) : operators.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No operators found</div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Last Login</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {operators.map((operator) => (
                                <TableRow key={operator.adminId}>
                                    <TableCell className="font-medium">{operator.name}</TableCell>
                                    <TableCell className="text-muted-foreground">{operator.email}</TableCell>
                                    <TableCell>
                                        <Badge variant={operator.role === 'super_admin' ? 'default' : 'secondary'}>
                                            {operator.role.replace('_', ' ')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={operator.status === 'active' ? 'default' : 'destructive'}>
                                            {operator.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {operator.lastLogin
                                            ? formatDistanceToNow((operator.lastLogin as Timestamp).toDate(), { addSuffix: true })
                                            : "Never"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {operator.role !== 'super_admin' && (
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    disabled={suspendingId === operator.adminId}
                                                    onClick={() => handleToggleSuspend(operator)}
                                                    title={operator.status === 'active' ? 'Suspend' : 'Reactivate'}
                                                >
                                                    {operator.status === 'active'
                                                        ? <PauseCircle className="h-4 w-4 text-amber-500" />
                                                        : <PlayCircle className="h-4 w-4 text-green-500" />}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedOperator(operator)
                                                        setIsDeleteDialogOpen(true)
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>

            {/* Add Operator Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Add New Operator</DialogTitle>
                        <DialogDescription>Create a new admin operator with custom permissions</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="op-name">Full Name *</Label>
                                <Input
                                    id="op-name"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="John Doe"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="op-email">Email *</Label>
                                <Input
                                    id="op-email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                    placeholder="operator@rurboo.com"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="op-password">Password *</Label>
                                <Input
                                    id="op-password"
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                    placeholder="Min. 8 characters"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="op-role">Role *</Label>
                                <Select value={formData.role} onValueChange={(value: any) => setFormData(prev => ({ ...prev, role: value }))}>
                                    <SelectTrigger id="op-role">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="operator">Operator</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="super_admin">Super Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-3 pt-2">
                            <Label>Permissions</Label>
                            <div className="space-y-2 border rounded-lg p-3">
                                {[
                                    { key: "manageDrivers", label: "Manage Drivers" },
                                    { key: "manageUsers", label: "Manage Users" },
                                    { key: "managePricing", label: "Manage Pricing" },
                                    { key: "viewFinance", label: "View Finance" },
                                    { key: "manageSOS", label: "Manage SOS/Risk" },
                                    { key: "manageAdmins", label: "Manage Admins", superAdminOnly: true },
                                ].map(({ key, label, superAdminOnly }) => (
                                    <div key={key} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Label htmlFor={`perm-${key}`} className="font-normal">{label}</Label>
                                            {superAdminOnly && <Badge variant="destructive" className="text-xs">Super Admin Only</Badge>}
                                        </div>
                                        <Switch
                                            id={`perm-${key}`}
                                            checked={formData.permissions[key as keyof typeof formData.permissions]}
                                            onCheckedChange={(checked: boolean) => updatePermission(key as any, checked)}
                                            disabled={superAdminOnly && formData.role !== 'super_admin'}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm() }} disabled={processing}>
                            Cancel
                        </Button>
                        <Button onClick={handleAddOperator} disabled={processing}>
                            {processing ? 'Creating...' : 'Create Operator'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirm Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <ShieldAlert className="h-5 w-5 text-destructive" />
                            Delete Operator
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <strong>{selectedOperator?.name}</strong>?
                            <br /><br />
                            This will <strong>permanently remove their access</strong> from both the admin panel and Firebase Authentication. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteOperator}
                            disabled={processing}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            {processing ? 'Deleting...' : 'Delete Operator'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    )
}
