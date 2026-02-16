"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function LiveMapPage() {
    return (
        <div className="p-8 space-y-8">
            <h2 className="text-3xl font-bold tracking-tight">Live Map</h2>
            <Card>
                <CardHeader>
                    <CardTitle>Real-time Fleet Tracking</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[400px] flex items-center justify-center bg-muted text-muted-foreground rounded-md">
                        Map Integration (Google Maps/Mapbox) will be displayed here.
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
