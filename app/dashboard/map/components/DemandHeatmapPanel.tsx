import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { GoogleMap, LoadScript, HeatmapLayer } from "@react-google-maps/api"
import { Flame, Car, MapPin, TrendingUp, RefreshCw } from "lucide-react"

const mapContainerStyle = {
    width: '100%',
    height: '600px',
    borderRadius: '0.5rem'
}

const defaultCenter = {
    lat: 28.6139,
    lng: 77.2090
}

// Mocked Heatmap Data focusing around New Delhi CP & Airport
const MOCK_DEMAND_POINTS = [
    { lat: 28.6304, lng: 77.2177, weight: 10 }, // CP
    { lat: 28.6280, lng: 77.2120, weight: 8 },
    { lat: 28.6250, lng: 77.2090, weight: 7 },
    { lat: 28.5562, lng: 77.1000, weight: 15 }, // Airport
    { lat: 28.5580, lng: 77.0980, weight: 12 },
    { lat: 28.5600, lng: 77.1020, weight: 9 },
    { lat: 28.5400, lng: 77.1500, weight: 5 }, // Vasant Kunj
    { lat: 28.5420, lng: 77.1530, weight: 6 },
]

export function DemandHeatmapPanel() {
    const [layerType, setLayerType] = useState<'demand' | 'supply'>('demand')
    const MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""

    const heatmapData = useMemo(() => {
        if (typeof window === "undefined" || !window.google) return []

        return MOCK_DEMAND_POINTS.map(point => ({
            location: new window.google.maps.LatLng(point.lat, point.lng),
            weight: layerType === 'demand' ? point.weight : Math.max(1, 10 - point.weight)
        }))
    }, [layerType])

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
                <Card className={layerType === 'demand' ? 'border-primary' : ''}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">High Demand Zones</CardTitle>
                        <Flame className="w-4 h-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">14</div>
                        <p className="text-xs text-muted-foreground">Areas surging &gt;1.5x</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Supply Deficit</CardTitle>
                        <Car className="w-4 h-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">450</div>
                        <p className="text-xs text-muted-foreground">Drivers required in red zones</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Predicted Surge</CardTitle>
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+20%</div>
                        <p className="text-xs text-muted-foreground">Expected in next 30 mins</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="flex flex-row justify-between items-center bg-muted/10 pb-4">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="w-5 h-5" /> Analytics Heatmap
                        </CardTitle>
                        <CardDescription>Visualize rider demand density vs active driver supply.</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant={layerType === 'demand' ? 'default' : 'outline'}
                            onClick={() => setLayerType('demand')}
                            className={layerType === 'demand' ? 'bg-orange-600 hover:bg-orange-700' : ''}
                        >
                            <Flame className="w-4 h-4 mr-2" /> Rider Demand
                        </Button>
                        <Button
                            variant={layerType === 'supply' ? 'default' : 'outline'}
                            onClick={() => setLayerType('supply')}
                            className={layerType === 'supply' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                        >
                            <Car className="w-4 h-4 mr-2" /> Driver Supply
                        </Button>
                        <Button variant="outline" size="icon">
                            <RefreshCw className="w-4 h-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-4">
                    {!MAPS_API_KEY ? (
                        <div className="flex items-center justify-center h-[600px] bg-muted/20 border-2 border-dashed rounded-lg">
                            <p className="text-muted-foreground text-center">Google Maps API Key missing in environment.<br />Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to view heatmaps.</p>
                        </div>
                    ) : (
                        <div className="relative rounded-lg overflow-hidden border">
                            <LoadScript googleMapsApiKey={MAPS_API_KEY} libraries={['visualization']}>
                                <GoogleMap
                                    mapContainerStyle={mapContainerStyle}
                                    center={defaultCenter}
                                    zoom={12}
                                    options={{ zoomControl: true, mapTypeControl: false, streetViewControl: false }}
                                >
                                    {heatmapData.length > 0 && (
                                        <HeatmapLayer
                                            data={heatmapData}
                                            options={{
                                                radius: 30, // Larger radius for visual impact
                                                opacity: 0.8,
                                                gradient: layerType === 'demand'
                                                    ? ['rgba(0, 255, 255, 0)', 'rgba(0, 255, 255, 1)', 'rgba(0, 191, 255, 1)', 'rgba(0, 127, 255, 1)', 'rgba(0, 63, 255, 1)', 'rgba(0, 0, 255, 1)', 'rgba(0, 0, 223, 1)', 'rgba(0, 0, 191, 1)', 'rgba(0, 0, 159, 1)', 'rgba(0, 0, 127, 1)', 'rgba(63, 0, 91, 1)', 'rgba(127, 0, 63, 1)', 'rgba(191, 0, 31, 1)', 'rgba(255, 0, 0, 1)']
                                                    : ['rgba(0, 255, 0, 0)', 'rgba(0, 255, 0, 1)', 'rgba(0, 223, 0, 1)', 'rgba(0, 191, 0, 1)', 'rgba(0, 159, 0, 1)', 'rgba(0, 127, 0, 1)', 'rgba(63, 127, 0, 1)', 'rgba(127, 127, 0, 1)', 'rgba(191, 127, 0, 1)', 'rgba(255, 127, 0, 1)', 'rgba(255, 63, 0, 1)', 'rgba(255, 0, 0, 1)']
                                            }}
                                        />
                                    )}
                                </GoogleMap>
                            </LoadScript>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
