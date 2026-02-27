"use client"

import { useState, useMemo, useEffect } from "react"
import { GoogleMap, LoadScript, Marker, InfoWindow } from "@react-google-maps/api"
import Link from "next/link"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useLiveLocations } from "@/features/map/hooks/useLiveLocations"
import { MapPin, Bike, Car, User } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

// Default center (you can update this to your preferred location)
const defaultCenter = {
    lat: 28.6139,  // New Delhi coordinates
    lng: 77.2090
}

const mapContainerStyle = {
    width: '100%',
    height: '600px'
}

const mapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: false,
    fullscreenControl: true,
}

function LiveMapContent() {
    const { locations, drivers, loading } = useLiveLocations()
    const searchParams = useSearchParams()
    const [selectedLocation, setSelectedLocation] = useState<any>(null)
    const [vehicleFilter, setVehicleFilter] = useState<string>("all")

    // Get API key from environment
    const MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""

    // Check for target driver from URL
    useEffect(() => {
        const targetId = searchParams.get('driverId')
        if (targetId && !loading && drivers.length > 0) {
            const target = drivers.find(d => d.id === targetId)
            if (target) {
                setSelectedLocation(target)
            }
        }
    }, [searchParams, drivers, loading])

    // Filter drivers by vehicle type
    const filteredDrivers = useMemo(() => {
        if (vehicleFilter === "all") return drivers
        return drivers.filter(d => d.vehicleType === vehicleFilter)
    }, [drivers, vehicleFilter])

    // Get vehicle statistics
    const vehicleStats = useMemo(() => {
        const stats: Record<string, number> = {}
        drivers.forEach(driver => {
            const type = driver.vehicleType || "unknown"
            stats[type] = (stats[type] || 0) + 1
        })
        return stats
    }, [drivers])

    const getMarkerIcon = (location: any) => {
        // In a real implementation, you'd return different marker icons
        // based on vehicle type. For now, we'll use default markers
        return undefined
    }

    if (!MAPS_API_KEY) {
        return (
            <div className="p-8 space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Live Map</h2>
                        <p className="text-muted-foreground">
                            Real-time tracking of drivers and active rides
                        </p>
                    </div>
                </div>

                <Card className="border-destructive">
                    <CardHeader>
                        <CardTitle className="text-destructive">Google Maps API Key Missing</CardTitle>
                        <CardDescription>
                            Please configure your Google Maps API key to enable the live map feature.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-sm">
                            <p className="font-medium mb-2">Setup Instructions:</p>
                            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                                <li>Get your Google Maps API key from Google Cloud Console</li>
                                <li>Add it to your `.env.local` file as `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`</li>
                                <li>Restart the development server</li>
                                <li>Refresh this page</li>
                            </ol>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Live Map</h2>
                    <p className="text-muted-foreground">
                        Real-time tracking of drivers and active rides
                    </p>
                </div>
                <div className="flex gap-2 items-center">
                    <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by vehicle" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Vehicles ({drivers.length})</SelectItem>
                            <SelectItem value="bike">Bikes ({vehicleStats['bike'] || 0})</SelectItem>
                            <SelectItem value="auto">Autos ({vehicleStats['auto'] || 0})</SelectItem>
                            <SelectItem value="car">Cars ({vehicleStats['car'] || 0})</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Fleet Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-blue-50/30">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                            Active Drivers
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{drivers.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <Bike className="h-3 w-3" />
                            Bikes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{vehicleStats['bike'] || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <Car className="h-3 w-3" />
                            Autos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{vehicleStats['auto'] || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <Car className="h-3 w-3" />
                            Cars
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{vehicleStats['car'] || 0}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Map & Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <Card className="lg:col-span-3 overflow-hidden">
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex items-center justify-center h-[600px] bg-muted/20">
                                <div className="text-center">
                                    <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
                                    <div className="text-lg font-medium">Loading Map...</div>
                                    <div className="text-sm text-muted-foreground mt-2">Fetching live driver data</div>
                                </div>
                            </div>
                        ) : (
                            <LoadScript googleMapsApiKey={MAPS_API_KEY}>
                                <GoogleMap
                                    mapContainerStyle={mapContainerStyle}
                                    center={selectedLocation ? {
                                        lat: selectedLocation.lat,
                                        lng: selectedLocation.lng
                                    } : filteredDrivers.length > 0 ? {
                                        lat: filteredDrivers[0].lat,
                                        lng: filteredDrivers[0].lng
                                    } : defaultCenter}
                                    zoom={selectedLocation ? 16 : 13}
                                    options={mapOptions}
                                >
                                    {filteredDrivers.map((location) => (
                                        <Marker
                                            key={location.id}
                                            position={{ lat: location.lat, lng: location.lng }}
                                            onClick={() => setSelectedLocation(location)}
                                            icon={getMarkerIcon(location)}
                                            label={{
                                                text: location.name?.split(' ')[0] || "Driver",
                                                className: "bg-white/90 px-2 py-0.5 rounded border border-gray-200 text-xs font-bold text-gray-800 shadow-sm whitespace-nowrap -mt-12",
                                                color: "#1e293b"
                                            }}
                                        />
                                    ))}

                                    {selectedLocation && (
                                        <InfoWindow
                                            position={{ lat: selectedLocation.lat, lng: selectedLocation.lng }}
                                            onCloseClick={() => setSelectedLocation(null)}
                                        >
                                            <div className="p-2 min-w-[200px]">
                                                <div className="font-bold flex items-center gap-2 mb-2 border-b pb-1">
                                                    <Badge className="bg-blue-600">{selectedLocation.vehicleType?.toUpperCase()}</Badge>
                                                    <span className="truncate">{selectedLocation.name}</span>
                                                </div>
                                                <div className="space-y-1.5 pt-1">
                                                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                                                        <MapPin className="h-3 w-3" />
                                                        Lat: {selectedLocation.lat.toFixed(4)}, Lng: {selectedLocation.lng.toFixed(4)}
                                                    </div>
                                                    <div className="flex items-center justify-between mt-2 pt-2 border-t">
                                                        <Badge variant="outline" className={selectedLocation.isOnline ? "border-green-500 text-green-600" : "text-muted-foreground"}>
                                                            {selectedLocation.isOnline ? "Online" : "Offline"}
                                                        </Badge>
                                                        <Button size="xs" variant="ghost" className="h-6 text-[10px]" asChild>
                                                            <Link href={`/dashboard/drivers/${selectedLocation.id}`}>View Profile</Link>
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </InfoWindow>
                                    )}
                                </GoogleMap>
                            </LoadScript>
                        )}
                    </CardContent>
                </Card>

                {/* Sidebar List */}
                <Card className="flex flex-col h-[600px]">
                    <CardHeader className="pb-3 border-b">
                        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                            Active Drivers ({filteredDrivers.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto p-0">
                        {filteredDrivers.length === 0 ? (
                            <div className="p-8 text-center text-sm text-muted-foreground">
                                No drivers online.
                            </div>
                        ) : (
                            <div className="divide-y">
                                {filteredDrivers.map(driver => (
                                    <button
                                        key={driver.id}
                                        onClick={() => setSelectedLocation(driver)}
                                        className={`w-full p-4 text-left hover:bg-muted/50 transition-colors flex items-start gap-3 ${selectedLocation?.id === driver.id ? 'bg-blue-50/50 ring-1 ring-inset ring-blue-500/20' : ''}`}
                                    >
                                        <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${driver.isOnline ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-gray-300'}`} />
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-sm truncate">{driver.name}</div>
                                            <div className="text-[10px] text-muted-foreground capitalize flex items-center gap-1">
                                                {driver.vehicleType === 'bike' ? <Bike className="h-3 w-3" /> : <Car className="h-3 w-3" />}
                                                {driver.vehicleType || "unknown"}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Instructions */}
            {drivers.length === 0 && !loading && (
                <Card>
                    <CardHeader>
                        <CardTitle>No Active Drivers</CardTitle>
                        <CardDescription>
                            There are currently no drivers online. Drivers will appear on the map when they:
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                            <li>Have an active status</li>
                            <li>Are online in the driver app</li>
                            <li>Have location sharing enabled</li>
                            <li>Have a valid current location in Firestore</li>
                        </ul>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

export default function LiveMapPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center p-8 h-screen">
                <div className="text-muted-foreground animate-pulse">Loading Map...</div>
            </div>
        }>
            <LiveMapContent />
        </Suspense>
    )
}
