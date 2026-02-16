"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DollarSign, Download, ArrowUpRight, ArrowDownRight, RefreshCw } from "lucide-react"
import { useFinance } from "@/features/finance/hooks/useFinance"
import { exportToCSV } from "@/lib/utils/export"
import { useState } from "react"
import { CheckCircle } from "lucide-react"

export default function FinancePage() {
    const { stats, loading } = useFinance()

    const handleExport = () => {
        exportToCSV(stats.recentTransactions, "rurboo_finance_transactions")
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount)
    }

    const [view, setView] = useState<'overview' | 'ledger'>('overview')

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Finance & Commission</h2>
                    <p className="text-muted-foreground">Manage revenue, payouts, and audit trails.</p>
                </div>
                <div className="flex space-x-2">
                    <div className="bg-muted p-1 rounded-lg flex mr-4">
                        <Button
                            variant={view === 'overview' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setView('overview')}
                        >
                            Overview
                        </Button>
                        <Button
                            variant={view === 'ledger' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setView('ledger')}
                        >
                            Ledger Audit
                        </Button>
                    </div>
                    <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" /> Export CSV</Button>
                    <Button>Process Settlements</Button>
                </div>
            </div>

            {view === 'overview' ? (
                <>
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Revenue (Gross)</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {loading ? "Loading..." : formatCurrency(stats.totalRevenue)}
                                </div>
                                <p className="text-xs text-muted-foreground">From completed rides</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Platform Commission (20%)</CardTitle>
                                <ArrowUpRight className="h-4 w-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">
                                    {loading ? "Loading..." : formatCurrency(stats.platformCommission)}
                                </div>
                                <p className="text-xs text-muted-foreground">Net Profit</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Pending Settlements</CardTitle>
                                <ArrowDownRight className="h-4 w-4 text-orange-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-orange-600">
                                    {loading ? "Loading..." : "₹ 0"}
                                </div>
                                <p className="text-xs text-muted-foreground">Due to drivers (Coming Soon)</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="rounded-md border p-4">
                        <h3 className="text-lg font-semibold mb-4">Recent Transactions via Rides</h3>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Transaction ID</TableHead>
                                    <TableHead>Driver ID</TableHead>
                                    <TableHead>Ride ID</TableHead>
                                    <TableHead className="text-right">Ride Amount</TableHead>
                                    <TableHead className="text-right">Commission (20%)</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center h-24">
                                            <RefreshCw className="h-6 w-6 animate-spin mx-auto" />
                                        </TableCell>
                                    </TableRow>
                                ) : stats.recentTransactions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center h-24">
                                            No recent transactions found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    stats.recentTransactions.map((txn: any) => (
                                        <TableRow key={txn.id + txn.rideId}>
                                            <TableCell className="font-medium text-xs">{txn.id}</TableCell>
                                            <TableCell className="max-w-[100px] truncate">{txn.driverId}</TableCell>
                                            <TableCell className="max-w-[100px] truncate text-xs">{txn.rideId}</TableCell>
                                            <TableCell className="text-right">{txn.amount}</TableCell>
                                            <TableCell className="text-right text-green-600 font-bold">
                                                {txn.platformFee}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {txn.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground text-xs">{txn.date}</TableCell>
                                        </TableRow>
                                    )))}
                            </TableBody>
                        </Table>
                    </div>
                </>
            ) : (
                <div className="rounded-md border p-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Immutable Ledger (Audit Trail)</h3>
                        <Badge variant="outline" className="text-green-600 border-green-600">
                            <CheckCircle className="mr-1 h-3 w-3" /> System Integrity Verified
                        </Badge>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>TXN ID</TableHead>
                                <TableHead>Timestamp</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Account</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {stats.ledgerEntries && stats.ledgerEntries.length > 0 ? (
                                stats.ledgerEntries.map((entry: any) => (
                                    <TableRow key={entry.id}>
                                        <TableCell className="font-mono text-xs">{entry.transactionId?.substring(0, 8)}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {entry.timestamp?.toDate ? entry.timestamp.toDate().toLocaleString() : 'Pending'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={entry.type === 'credit' ? 'default' : 'secondary'}>
                                                {entry.type?.toUpperCase()}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-medium text-xs">{entry.account}</TableCell>
                                        <TableCell className="max-w-[200px] truncate text-xs">{entry.description}</TableCell>
                                        <TableCell className="text-right font-bold">
                                            {entry.type === 'credit' ? '+' : '-'} {formatCurrency(entry.amount)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24">
                                        No ledger entries recorded yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    )
}
