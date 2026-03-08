import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MessageSquare, AlertTriangle, ShieldAlert, Navigation } from "lucide-react"

export function ChatMonitorPanel({ activeRides }: { activeRides: any[] }) {
    // We map any currently active or started rides to the monitor panel.
    const flaggedChats = activeRides.map(r => ({
        rideId: r.id,
        status: r.status,
        user: r.userId.substring(0, 8),
        driver: r.driverId?.substring(0, 8) || "N/A",
        snippet: "Live ride in progress. No safety flags detected.",
        aiScore: 0,
        timestamp: "Active Now"
    }))

    return (
        <Card className="border-red-200">
            <CardHeader className="bg-red-50/50 pb-4 border-b">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2 text-red-700">
                            <ShieldAlert className="w-5 h-5" /> Safety & Chat Radar
                        </CardTitle>
                        <CardDescription className="text-red-900/70">Real-time monitoring of active ride communications for safety triggers.</CardDescription>
                    </div>
                    <Badge variant={flaggedChats.length > 0 ? "secondary" : "outline"} className="animate-pulse">{flaggedChats.length} Active Audits</Badge>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {flaggedChats.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                        <MessageSquare className="w-8 h-8 mb-2 opacity-20" />
                        No aggressive or unsafe keywords detected in ongoing rides.
                    </div>
                ) : (
                    <div className="divide-y divide-red-100">
                        {flaggedChats.map(chat => (
                            <div key={chat.rideId} className="p-4 hover:bg-slate-50 transition-colors flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge variant="outline" className="text-xs font-mono">{chat.rideId}</Badge>
                                        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none text-[10px] px-1">Trigger: None</Badge>
                                    </div>
                                    <div className="text-sm font-medium">User: {chat.user} • Driver: {chat.driver}</div>
                                    <div className="text-sm mt-2 p-2 bg-muted/40 rounded-md border-l-2 border-l-emerald-500 italic text-emerald-700 font-mono">
                                        [{chat.status.toUpperCase()}] {chat.snippet}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 shrink-0 w-full md:w-auto">
                                    <Button size="sm" variant="destructive" className="w-full md:w-auto outline outline-1 outline-offset-2 outline-red-500">
                                        <AlertTriangle className="w-4 h-4 mr-2" /> Intervene
                                    </Button>
                                    <Button size="sm" variant="outline" className="w-full md:w-auto">
                                        <Navigation className="w-4 h-4 mr-2 text-blue-500" /> View Live Map
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
