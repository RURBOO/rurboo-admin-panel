"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
    Bell,
    Send,
    Users,
    Car,
    Globe,
    Search,
    X,
    CheckCircle2,
    History,
    Clock
} from "lucide-react"
import { useNotificationSender, TargetAudience } from "@/features/notifications/hooks/useNotificationSender"
import { toast } from "sonner"
import { collection, getDocs, query, limit, where, orderBy, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Skeleton } from "@/components/ui/skeleton"

export default function NotificationsPage() {
    const { sendNotification, sending } = useNotificationSender()

    const [title, setTitle] = useState("")
    const [body, setBody] = useState("")
    const [imageUrl, setImageUrl] = useState("")
    const [audience, setAudience] = useState<TargetAudience>('all_users')

    // Specific selection state
    const [searchQuery, setSearchQuery] = useState("")
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [selectedUsers, setSelectedUsers] = useState<any[]>([])
    const [searching, setSearching] = useState(false)

    // History state
    const [history, setHistory] = useState<any[]>([])
    const [loadingHistory, setLoadingHistory] = useState(true)

    // Handle User Search
    const handleSearch = async () => {
        if (!searchQuery) return
        setSearching(true)
        try {
            // Search Users
            const usersRef = collection(db, "users")
            const q = query(usersRef, where("fullName", ">=", searchQuery), where("fullName", "<=", searchQuery + '\uf8ff'), limit(5))
            const querySnapshot = await getDocs(q)

            const results = querySnapshot.docs.map(doc => ({
                id: doc.id,
                type: 'user',
                ...doc.data()
            }))

            setSearchResults(results)
            if (results.length === 0) {
                toast.info("No users found")
            }
        } catch (error) {
            console.error("Search failed", error)
            toast.error("Search failed")
        } finally {
            setSearching(false)
        }
    }

    const handleSelectUser = (user: any) => {
        if (!selectedUsers.find(u => u.id === user.id)) {
            setSelectedUsers([...selectedUsers, user])
        }
        setAudience('specific')
    }

    const handleRemoveUser = (userId: string) => {
        setSelectedUsers(selectedUsers.filter(u => u.id !== userId))
    }

    const handleSend = async () => {
        if (!title || !body) {
            toast.error("Please enter a title and body")
            return
        }

        if (audience === 'specific' && selectedUsers.length === 0) {
            toast.error("Please select at least one user")
            return
        }

        const result = await sendNotification({
            title,
            body,
            imageUrl,
            targetAudience: audience,
            targetIds: audience === 'specific' ? selectedUsers.map(u => u.id) : undefined
        })

        if (result.success) {
            toast.success("Notification sent successfully!")
            // Reset form
            setTitle("")
            setBody("")
            setImageUrl("")
            setSelectedUsers([])
            setAudience('all_users')
        } else {
            toast.error("Failed to send notification: " + result.error)
        }
    }

    // Load History
    useEffect(() => {
        // Query recent notifications sent by admins
        const q = query(
            collection(db, "notifications"),
            orderBy("createdAt", "desc"),
            limit(20)
        )

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const historyData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate()
            }))
            setHistory(historyData)
            setLoadingHistory(false)
        }, (error) => {
            console.error("Error fetching history:", error)
            setLoadingHistory(false)
        })

        return () => unsubscribe()
    }, [])

    return (
        <div className="p-8 space-y-8 h-full flex flex-col animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Notification Center</h2>
                    <p className="text-muted-foreground mt-1">
                        Send targeted messages to your users and drivers.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="compose" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="compose">Compose</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>

                <TabsContent value="compose">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
                        {/* Compose Column */}
                        <Card className="h-fit">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Send className="h-5 w-5" />
                                    Compose Message
                                </CardTitle>
                                <CardDescription>Create your notification content</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Title</Label>
                                    <Input
                                        placeholder="e.g., Big Sale This Weekend!"
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Body</Label>
                                    <Textarea
                                        placeholder="Enter your message here..."
                                        className="h-32 resize-none"
                                        value={body}
                                        onChange={e => setBody(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Image URL (Optional)</Label>
                                    <Input
                                        placeholder="https://..."
                                        value={imageUrl}
                                        onChange={e => setImageUrl(e.target.value)}
                                    />
                                </div>

                                {/* Preview */}
                                <div className="mt-6 p-4 border rounded-lg bg-gray-50 dark:bg-slate-900">
                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Preview</Label>
                                    <div className="flex gap-3 items-start">
                                        <div className="bg-primary/20 p-2 rounded-full">
                                            <Bell className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-sm">{title || "Notification Title"}</h4>
                                            <p className="text-sm text-muted-foreground">{body || "Notification body text will appear here..."}</p>
                                        </div>
                                    </div>
                                    {imageUrl && (
                                        <div className="mt-3 relative h-32 w-full rounded-md overflow-hidden">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Audience Column */}
                        <Card className="h-fit">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    Target Audience
                                </CardTitle>
                                <CardDescription>Select who receives this message</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Tabs defaultValue="general" className="w-full">
                                    <TabsList className="grid w-full grid-cols-3">
                                        <TabsTrigger value="general">Broadcast</TabsTrigger>
                                        <TabsTrigger value="segments">Segments</TabsTrigger>
                                        <TabsTrigger value="specific">Specific</TabsTrigger>
                                    </TabsList>

                                    {/* Broadcast Tab */}
                                    <TabsContent value="general" className="py-4 space-y-4">
                                        <div className="grid grid-cols-1 gap-3">
                                            <Button
                                                variant={audience === 'all_users' ? "default" : "outline"}
                                                className="justify-start h-auto py-3 relative overflow-hidden"
                                                onClick={() => setAudience('all_users')}
                                            >
                                                <Users className="mr-2 h-5 w-5" />
                                                <div className="text-left">
                                                    <div className="font-semibold">All Users</div>
                                                    <div className="text-xs opacity-70">Send to all registered customers</div>
                                                </div>
                                                {audience === 'all_users' && <div className="absolute right-0 top-0 bottom-0 w-1 bg-primary" />}
                                            </Button>
                                            <Button
                                                variant={audience === 'all_drivers' ? "default" : "outline"}
                                                className="justify-start h-auto py-3 relative overflow-hidden"
                                                onClick={() => setAudience('all_drivers')}
                                            >
                                                <Car className="mr-2 h-5 w-5" />
                                                <div className="text-left">
                                                    <div className="font-semibold">All Drivers</div>
                                                    <div className="text-xs opacity-70">Send to all partners</div>
                                                </div>
                                                {audience === 'all_drivers' && <div className="absolute right-0 top-0 bottom-0 w-1 bg-primary" />}
                                            </Button>
                                            <Button
                                                variant={audience === 'everyone' ? "default" : "outline"}
                                                className="justify-start h-auto py-3 relative overflow-hidden"
                                                onClick={() => setAudience('everyone')}
                                            >
                                                <Globe className="mr-2 h-5 w-5" />
                                                <div className="text-left">
                                                    <div className="font-semibold">Everyone</div>
                                                    <div className="text-xs opacity-70">Send to users and drivers</div>
                                                </div>
                                                {audience === 'everyone' && <div className="absolute right-0 top-0 bottom-0 w-1 bg-primary" />}
                                            </Button>
                                        </div>
                                    </TabsContent>

                                    {/* Segments Tab */}
                                    <TabsContent value="segments" className="py-4 space-y-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <Button
                                                variant={audience === 'active_users' ? "default" : "outline"}
                                                onClick={() => setAudience('active_users')}
                                                className="h-24 relative overflow-hidden"
                                            >
                                                <div className="flex flex-col items-center gap-2">
                                                    <CheckCircle2 className="h-6 w-6" />
                                                    <span>Active Users</span>
                                                </div>
                                                {audience === 'active_users' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary" />}
                                            </Button>
                                            <Button
                                                variant={audience === 'blocked_drivers' ? "default" : "outline"}
                                                onClick={() => setAudience('blocked_drivers')}
                                                className="h-24 relative overflow-hidden"
                                            >
                                                <div className="flex flex-col items-center gap-2">
                                                    <X className="h-6 w-6" />
                                                    <span>Blocked Drivers</span>
                                                </div>
                                                {audience === 'blocked_drivers' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary" />}
                                            </Button>
                                        </div>
                                    </TabsContent>

                                    {/* Specific Tab */}
                                    <TabsContent value="specific" className="py-4 space-y-4">
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Search user by name..."
                                                value={searchQuery}
                                                onChange={e => setSearchQuery(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                            />
                                            <Button size="icon" onClick={handleSearch} disabled={searching}>
                                                {searching ? <Clock className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                            </Button>
                                        </div>

                                        {/* Search Results */}
                                        {searchResults.length > 0 && (
                                            <div className="border rounded-md p-2 max-h-40 overflow-y-auto bg-muted/20">
                                                <Label className="text-xs mb-2 block px-2">Click to select</Label>
                                                {searchResults.map(user => (
                                                    <div
                                                        key={user.id}
                                                        className="flex items-center justify-between p-2 hover:bg-muted cursor-pointer rounded text-sm transition-colors"
                                                        onClick={() => handleSelectUser(user)}
                                                    >
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{user.fullName || "Unknown"}</span>
                                                            <span className="text-xs text-muted-foreground">{user.email}</span>
                                                        </div>
                                                        <Badge variant="outline" className="text-xs">{user.phone || "No Phone"}</Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Selected List */}
                                        <div className="space-y-2">
                                            <Label>Selected Recipients ({selectedUsers.length})</Label>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedUsers.length === 0 && <p className="text-sm text-muted-foreground italic">No users selected</p>}
                                                {selectedUsers.map(user => (
                                                    <Badge key={user.id} variant="secondary" className="pl-2 pr-1 py-1 flex items-center gap-1">
                                                        {user.fullName}
                                                        <X
                                                            className="h-3 w-3 hover:text-red-500 cursor-pointer transition-colors"
                                                            onClick={() => handleRemoveUser(user.id)}
                                                        />
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </TabsContent>
                                </Tabs>

                                <div className="mt-8 pt-6 border-t">
                                    <Button
                                        className="w-full"
                                        size="lg"
                                        onClick={handleSend}
                                        disabled={sending}
                                    >
                                        {sending ? (
                                            <>
                                                <Clock className="mr-2 h-4 w-4 animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            "Send Notification"
                                        )}
                                    </Button>
                                    <p className="text-xs text-center text-muted-foreground mt-2">
                                        Sending to: <span className="font-semibold text-primary">{audience === 'specific' ? `${selectedUsers.length} specific users` : audience.replace('_', ' ')}</span>
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="history">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <History className="h-5 w-5" />
                                Notification History
                            </CardTitle>
                            <CardDescription>Recent notifications sent from this panel.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loadingHistory ? (
                                <div className="space-y-4">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="flex flex-col gap-2 border-b pb-4">
                                            <Skeleton className="h-6 w-1/3" />
                                            <Skeleton className="h-4 w-full" />
                                            <Skeleton className="h-4 w-1/4" />
                                        </div>
                                    ))}
                                </div>
                            ) : history.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    No history available.
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {history.map((item) => (
                                        <div key={item.id} className="flex flex-col gap-2 border-b pb-4 last:border-0 last:pb-0">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-semibold text-base">{item.title}</h4>
                                                <span className="text-xs text-muted-foreground">
                                                    {item.createdAt?.toLocaleString()}
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground">{item.body}</p>
                                            <div className="flex gap-2 mt-1">
                                                <Badge variant="outline" className="text-xs">
                                                    Audience: {item.targetAudience}
                                                </Badge>
                                                {item.targetIds && (
                                                    <Badge variant="outline" className="text-xs">
                                                        {item.targetIds.length} Recipients
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
