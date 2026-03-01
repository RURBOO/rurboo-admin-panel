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
import { MessageSquare, CheckCircle, ExternalLink } from "lucide-react"
import { useSupport } from "@/features/support/hooks/useSupport"

export default function SupportPage() {
    const { tickets, loading, updateTicketStatus } = useSupport()

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Support & Feedback</h2>
                    <p className="text-muted-foreground">
                        Resolve user inquiries and view feedback.
                    </p>
                </div>
                <Button>Create Ticket</Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Ticket ID</TableHead>
                            <TableHead>User Type</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>Message</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Attachment</TableHead>
                            <TableHead className="text-right">Date</TableHead>
                            <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center h-24">
                                    Loading tickets...
                                </TableCell>
                            </TableRow>
                        ) : tickets.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center h-24">
                                    No tickets found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            tickets.map((ticket) => (
                                <TableRow key={ticket.id}>
                                    <TableCell className="font-medium text-xs">{ticket.id.substring(0, 8)}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{ticket.userType.toUpperCase()}</Badge>
                                    </TableCell>
                                    <TableCell className="font-medium">{ticket.subject}</TableCell>
                                    <TableCell className="max-w-[300px] truncate text-muted-foreground">
                                        {ticket.message}
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={
                                            ticket.status.toLowerCase() === 'closed' || ticket.status.toLowerCase() === 'resolved' ? 'bg-green-600' :
                                                ticket.status.toLowerCase() === 'in progress' || ticket.status.toLowerCase() === 'pending' ? 'bg-blue-600' :
                                                    ticket.status.toLowerCase() === 'open' ? 'bg-orange-600' : 'bg-gray-600'
                                        }>
                                            {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {ticket.imageUrl ? (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => window.open(ticket.imageUrl, '_blank')}
                                                className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                                View
                                            </Button>
                                        ) : (
                                            <span className="text-muted-foreground text-xs italic">None</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right text-xs text-muted-foreground">
                                        {ticket.createdAt?.toDate ? ticket.createdAt.toDate().toLocaleDateString() : 'Recent'}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2 justify-end">
                                            {ticket.status === 'Open' && (
                                                <Button
                                                    size="sm" variant="outline"
                                                    onClick={() => updateTicketStatus(ticket.id, 'In Progress')}
                                                >
                                                    Start
                                                </Button>
                                            )}
                                            {ticket.status.toLowerCase() !== 'closed' && ticket.status.toLowerCase() !== 'resolved' && (
                                                <Button
                                                    size="sm" variant="default"
                                                    className="bg-green-600 hover:bg-green-700"
                                                    onClick={() => updateTicketStatus(ticket.id, 'closed')}
                                                >
                                                    Close
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
