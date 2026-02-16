
"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MessageSquare, Star, RefreshCw, User, Car } from "lucide-react"
import { useFeedback } from "@/features/feedback/hooks/useFeedback"

export default function FeedbackPage() {
    const { suggestions, driverFeedback, loading, refresh } = useFeedback()

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Feedback & Suggestions</h2>
                    <p className="text-muted-foreground">
                        Listen to your community. Review feedback from users and drivers.
                    </p>
                </div>
                <Button variant="outline" onClick={refresh} disabled={loading}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            <Tabs defaultValue="suggestions" className="w-full">
                <TabsList>
                    <TabsTrigger value="suggestions">User Suggestions ({suggestions.length})</TabsTrigger>
                    <TabsTrigger value="feedback">Driver Feedback ({driverFeedback.length})</TabsTrigger>
                </TabsList>

                {/* Users Tab */}
                <TabsContent value="suggestions">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                App Suggestions
                            </CardTitle>
                            <CardDescription>
                                Ideas and improvements suggested by users
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Suggestion</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {suggestions.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                                No suggestions found yet.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        suggestions.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium">{item.name || "Anonymous User"}</TableCell>
                                                <TableCell className="max-w-md truncate">{item.message}</TableCell>
                                                <TableCell className="text-muted-foreground text-sm">
                                                    {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : 'Just now'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">New</Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Drivers Tab */}
                <TabsContent value="feedback">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Car className="h-5 w-5" />
                                Driver Feedback
                            </CardTitle>
                            <CardDescription>
                                Ratings and feedback from your driver partners
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Driver</TableHead>
                                        <TableHead>Rating</TableHead>
                                        <TableHead>Feedback</TableHead>
                                        <TableHead>Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {driverFeedback.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                                No feedback found yet.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        driverFeedback.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium">{item.name || "Driver"}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center">
                                                        <span className="mr-1">{item.rating || 5}</span>
                                                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                                    </div>
                                                </TableCell>
                                                <TableCell className="max-w-md truncate">{item.message}</TableCell>
                                                <TableCell className="text-muted-foreground text-sm">
                                                    {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : 'Just now'}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
