"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
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
import { useOperators } from "@/features/admin/hooks/useOperators"
import { useAdminRole } from "@/features/admin/hooks/useAdminRole"
import { Plus, Trash2, Shield, ShieldAlert } from "lucide-react"
import { toast } from "sonner"

export function OperatorManagement() {
    const { operators, loading, deleteOperator, refreshOperators } = useOperators()
    const { isSuperAdmin } = useAdminRole()
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [selectedOperator, setSelectedOperator] = useState<any>(null)
    const [processing, setProcessing] = useState(false)

    // Form state
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
            manageSOS: false
        }
    })

    const handleAddOperator = async () => {
        if (!formData.email || !formData.password || !formData.name) {
            toast.error("Please fill in all required fields")
            return
        }

        setProcessing(true)
        try {
            // Call API route to create operator
            const response = await fetch('/api/operators/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            const result = await response.json()

            if (result.success) {
                toast.success(`Operator ${formData.name} created successfully`)
                setIsAddDialogOpen(false)
                resetForm()
                refreshOperators()
            } else {
                toast.error(result.error || "Failed to create operator")
            }
        } catch (error) {
            console.error("Error creating operator:", error)
            toast.error("Failed to create operator. Please try again.")
        } finally {
            setProcessing(false)
        }
    }

    const handleDeleteOperator = async () => {
        if (!selectedOperator) return

        setProcessing(true)
        try {
            const result = await deleteOperator(selectedOperator.adminId)

            if (result.success) {
                toast.success(`Operator ${selectedOperator.name} deleted successfully`)
                setIsDeleteDialogOpen(false)
                setSelectedOperator(null)
            } else {
                toast.error("Failed to delete operator")
            }
        } catch (error) {
            console.error("Error deleting operator:", error)
            toast.error("Failed to delete operator. Please try again.")
        } finally {
            setProcessing(false)
        }
    }

    const resetForm = () => {
        setFormData({
            email: "",
            password: "",
            name: "",
            role: "operator",
            permissions: {
                manageDrivers: false,
                manageUsers: false,
                managePricing: false,
                manageAdmins: false,
                viewFinance: false,
                manageSOS: false
            }
        })
    }

    const updatePermission = (key: keyof typeof formData.permissions, value: boolean) => {
        setFormData(prev => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                [key]: value
            }
        }))
    }

    // Only show for super admins
    if (!isSuperAdmin) {
        return null
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Operator Management
                        </CardTitle>
                        <CardDescription>
                            Manage admin operators and their permissions
                        </CardDescription>
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
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {operators.map((operator) => (
                                <TableRow key={operator.adminId}>
                                    <TableCell className="font-medium">{operator.name}</TableCell>
                                    <TableCell>{operator.email}</TableCell>
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
                                    <TableCell className="text-right">
                                        {operator.role !== 'super_admin' && (
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
                        <DialogDescription>
                            Create a new admin operator with custom permissions
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="John Doe"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                    placeholder="operator@rurboo.com"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="password">Password *</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                    placeholder="Minimum 8 characters"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="role">Role *</Label>
                                <Select value={formData.role} onValueChange={(value: any) => setFormData(prev => ({ ...prev, role: value }))}>
                                    <SelectTrigger>
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

                        <div className="space-y-3 pt-4">
                            <Label>Permissions</Label>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="manage-drivers" className="font-normal">Manage Drivers</Label>
                                    <Switch
                                        id="manage-drivers"
                                        checked={formData.permissions.manageDrivers}
                                        onCheckedChange={(checked: boolean) => updatePermission('manageDrivers', checked)}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="manage-users" className="font-normal">Manage Users</Label>
                                    <Switch
                                        id="manage-users"
                                        checked={formData.permissions.manageUsers}
                                        onCheckedChange={(checked: boolean) => updatePermission('manageUsers', checked)}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="manage-pricing" className="font-normal">Manage Pricing</Label>
                                    <Switch
                                        id="manage-pricing"
                                        checked={formData.permissions.managePricing}
                                        onCheckedChange={(checked: boolean) => updatePermission('managePricing', checked)}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="view-finance" className="font-normal">View Finance</Label>
                                    <Switch
                                        id="view-finance"
                                        checked={formData.permissions.viewFinance}
                                        onCheckedChange={(checked: boolean) => updatePermission('viewFinance', checked)}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="manage-sos" className="font-normal">Manage SOS/Risk</Label>
                                    <Switch
                                        id="manage-sos"
                                        checked={formData.permissions.manageSOS}
                                        onCheckedChange={(checked: boolean) => updatePermission('manageSOS', checked)}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Label htmlFor="manage-admins" className="font-normal">Manage Admins</Label>
                                        <Badge variant="destructive" className="text-xs">Super Admin Only</Badge>
                                    </div>
                                    <Switch
                                        id="manage-admins"
                                        checked={formData.permissions.manageAdmins}
                                        onCheckedChange={(checked: boolean) => updatePermission('manageAdmins', checked)}
                                        disabled={formData.role !== 'super_admin'}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={processing}>
                            Cancel
                        </Button>
                        <Button onClick={handleAddOperator} disabled={processing}>
                            {processing ? 'Creating...' : 'Create Operator'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <ShieldAlert className="h-5 w-5 text-destructive" />
                            Delete Operator
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete operator <strong>{selectedOperator?.name}</strong>?
                            <br /><br />
                            This will permanently remove their access to the admin panel. This action cannot be undone.
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
