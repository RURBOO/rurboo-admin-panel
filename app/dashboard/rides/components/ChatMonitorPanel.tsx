import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MessageSquare, AlertTriangle, ShieldAlert, Navigation } from "lucide-react"

export function ChatMonitorPanel() {
    const [flaggedChats] = useState([
        {
            rideId: "RIDE-7781",
            status: "active",
            user: "Neha Sharma",
            driver: "Rajiv Kumar",
            snippet: "Bhaiya jaldi aao, rasta theek nahi lag raha...",
            aiScore: 85, // High risk sentiment
            timestamp: "2 mins ago"
        }
    ])

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
                    <Badge variant="destructive" className="animate-pulse">1 Active Alert</Badge>
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
                            <div key={chat.rideId} className="p-4 hover:bg-red-50/30 transition-colors flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge variant="outline" className="text-xs font-mono">{chat.rideId}</Badge>
                                        <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-none text-[10px] px-1">Trigger: Urgent/Scared</Badge>
                                    </div>
                                    <div className="text-sm font-medium">User: {chat.user} • Driver: {chat.driver}</div>
                                    <div className="text-sm mt-2 p-2 bg-muted/40 rounded-md border-l-2 border-l-red-500 italic">
                                        "{chat.snippet}"
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
