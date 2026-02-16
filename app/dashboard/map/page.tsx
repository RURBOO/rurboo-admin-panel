"use client"

import { useState, useMemo } from "react"
import { GoogleMap, LoadScript, Marker, InfoWindow } from "@react-google-maps/api"
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

export default function LiveMapPage() {
    const { locations, drivers, loading } = useLiveLocations()
    const [selectedLocation, setSelectedLocation] = useState<any>(null)
    const [vehicleFilter, setVehicleFilter] = useState<string>("all")

    // Get API key from environment
    const MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""

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
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Active Drivers
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{drivers.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Bike className="h-4 w-4" />
                            Bikes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{vehicleStats['bike'] || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Car className="h-4 w-4" />
                            Autos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{vehicleStats['auto'] || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Car className="h-4 w-4" />
                            Cars
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{vehicleStats['car'] || 0}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Map */}
            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center h-[600px]">
                            <div className="text-center">
                                <div className="text-lg font-medium">Loading map...</div>
                                <div className="text-sm text-muted-foreground mt-2">Fetching live locations</div>
                            </div>
                        </div>
                    ) : (
                        <LoadScript googleMapsApiKey={MAPS_API_KEY}>
                            <GoogleMap
                                mapContainerStyle={mapContainerStyle}
                                center={filteredDrivers.length > 0 ? {
                                    lat: filteredDrivers[0].lat,
                                    lng: filteredDrivers[0].lng
                                } : defaultCenter}
                                zoom={13}
                                options={mapOptions}
                            >
                                {filteredDrivers.map((location) => (
                                    <Marker
                                        key={location.id}
                                        position={{ lat: location.lat, lng: location.lng }}
                                        onClick={() => setSelectedLocation(location)}
                                        icon={getMarkerIcon(location)}
                                    />
                                ))}

                                {selectedLocation && (
                                    <InfoWindow
                                        position={{ lat: selectedLocation.lat, lng: selectedLocation.lng }}
                                        onCloseClick={() => setSelectedLocation(null)}
                                    >
                                        <div className="p-2">
                                            <div className="font-medium flex items-center gap-2 mb-1">
                                                {selectedLocation.type === 'driver' ? (
                                                    <Car className="h-4 w-4" />
                                                ) : (
                                                    <User className="h-4 w-4" />
                                                )}
                                                {selectedLocation.name}
                                            </div>
                                            {selectedLocation.vehicleType && (
                                                <div className="text-sm text-gray-600">
                                                    Vehicle: {selectedLocation.vehicleType}
                                                </div>
                                            )}
                                            <div className="text-sm text-gray-600">
                                                Status: <Badge variant="default" className="ml-1 bg-green-600">
                                                    {selectedLocation.isOnline ? 'Online' : 'Offline'}
                                                </Badge>
                                            </div>
                                        </div>
                                    </InfoWindow>
                                )}
                            </GoogleMap>
                        </LoadScript>
                    )}
                </CardContent>
            </Card>

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
