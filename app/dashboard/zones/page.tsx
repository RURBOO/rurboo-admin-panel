"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { GoogleMap, useJsApiLoader, DrawingManager, Polygon } from "@react-google-maps/api"
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Loader2, Trash2, MapIcon } from "lucide-react"

// Types
interface Point { lat: number; lng: number }
interface ServiceZone {
    id: string
    name: string
    isActive: boolean
    coordinates: Point[]
}

const mapContainerStyle = { width: '100%', height: '100%' }
const defaultCenter = { lat: 26.8467, lng: 80.9462 } // Lucknow as default
const libraries: ("drawing" | "places")[] = ["drawing"]

export default function ZonesPage() {
    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        libraries,
    })

    const [zones, setZones] = useState<ServiceZone[]>([])
    const [loading, setLoading] = useState(true)
    const [map, setMap] = useState<google.maps.Map | null>(null)
    const drawingManagerRef = useRef<google.maps.drawing.DrawingManager>(null)

    const fetchZones = async () => {
        try {
            setLoading(true)
            const snapshot = await getDocs(collection(db, "service_zones"))
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as ServiceZone[]
            setZones(data)
        } catch (error) {
            console.error("Error fetching zones", error)
            toast.error("Failed to fetch zones")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchZones()
    }, [])

    const onPolygonComplete = async (polygon: google.maps.Polygon) => {
        // Extract Coordinates
        const path = polygon.getPath()
        const coordinates: Point[] = []
        for (let i = 0; i < path.getLength(); i++) {
            const latLng = path.getAt(i)
            coordinates.push({ lat: latLng.lat(), lng: latLng.lng() })
        }

        // Remove the drawn polygon from map so we can rely on our React state polygons
        polygon.setMap(null)

        const name = prompt("Enter a name for this new Service Zone (e.g. Lucknow City):")
        if (!name) return

        try {
            const newZone = {
                name,
                isActive: true, // defaults to active
                coordinates
            }
            const docRef = await addDoc(collection(db, 'service_zones'), newZone)
            setZones([...zones, { id: docRef.id, ...newZone }])
            toast.success("Zone added successfully!")
        } catch (error) {
            console.error("Error adding zone", error)
            toast.error("Failed to add zone.")
        }
    }

    const toggleZone = async (id: string, currentStatus: boolean) => {
        try {
            await updateDoc(doc(db, 'service_zones', id), { isActive: !currentStatus })
            setZones(zones.map(z => z.id === id ? { ...z, isActive: !currentStatus } : z))
            toast.success(`Zone ${!currentStatus ? 'activated' : 'deactivated'}.`)
        } catch (error) {
            console.error(error)
            toast.error("Failed to update status")
        }
    }

    const deleteZone = async (id: string) => {
        if (!confirm("Are you sure you want to delete this zone?")) return
        try {
            await deleteDoc(doc(db, 'service_zones', id))
            setZones(zones.filter(z => z.id !== id))
            toast.success("Zone deleted.")
        } catch (error) {
            console.error(error)
            toast.error("Failed to delete zone")
        }
    }

    if (loadError) return <div>Error loading maps</div>
    if (!isLoaded) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin w-8 h-8" /></div>

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] md:h-screen bg-neutral-100 p-6 overflow-hidden">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Service Zones</h1>
                    <p className="text-neutral-500">Draw polygons to define where the app allows ride bookings.</p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
                {/* Map Area */}
                <Card className="flex-1 shadow-sm border-0 h-[400px] lg:h-full overflow-hidden flex flex-col relative">
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg border border-neutral-200 text-sm font-medium text-neutral-700 flex items-center gap-2">
                        <MapIcon className="w-4 h-4 text-blue-500" />
                        Use the drawing tool (top mid) to enclose a new service area
                    </div>
                    <GoogleMap
                        mapContainerStyle={mapContainerStyle}
                        center={defaultCenter}
                        zoom={11}
                        onLoad={setMap}
                        options={{
                            mapTypeControl: false,
                            streetViewControl: false,
                        }}
                    >
                        {/* The Drawing Manager allows admins to raw new polygons */}
                        <DrawingManager
                            onLoad={(dm) => (drawingManagerRef.current = dm)}
                            onPolygonComplete={onPolygonComplete}
                            options={{
                                drawingControl: true,
                                drawingControlOptions: {
                                    position: window.google?.maps?.ControlPosition?.TOP_CENTER,
                                    drawingModes: [window.google?.maps?.drawing?.OverlayType?.POLYGON],
                                },
                                polygonOptions: {
                                    fillColor: "#3b82f6",
                                    fillOpacity: 0.2,
                                    strokeWeight: 2,
                                    strokeColor: "#2563eb",
                                    clickable: false,
                                    editable: false,
                                    zIndex: 1,
                                },
                            }}
                        />

                        {/* Render existing zones */}
                        {zones.map((zone) => (
                            <Polygon
                                key={zone.id}
                                paths={zone.coordinates}
                                options={{
                                    fillColor: zone.isActive ? "#10b981" : "#ef4444", // Green if active, Red if inactive
                                    fillOpacity: 0.35,
                                    strokeColor: zone.isActive ? "#059669" : "#dc2626",
                                    strokeOpacity: 0.8,
                                    strokeWeight: 2,
                                }}
                                onClick={() => {
                                    alert(`Zone: ${zone.name}\nActive: ${zone.isActive}`)
                                }}
                            />
                        ))}
                    </GoogleMap>
                </Card>

                {/* Sidebar Controls */}
                <Card className="w-full lg:w-96 flex flex-col shadow-sm border-0 overflow-hidden shrink-0">
                    <CardHeader className="bg-neutral-50 border-b pb-4">
                        <CardTitle className="text-lg">Configured Zones</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-auto p-0">
                        {loading && <div className="p-4 text-center text-neutral-500"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>}
                        {!loading && zones.length === 0 && (
                            <div className="p-8 text-center text-neutral-500 text-sm">
                                <MapIcon className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
                                No zones configured.<br/>
                                Draw a polygon on the map to create one.
                            </div>
                        )}
                        <div className="divide-y divide-neutral-100">
                            {zones.map(zone => (
                                <div key={zone.id} className="p-4 hover:bg-neutral-50 transition-colors flex items-center justify-between">
                                    <div className="min-w-0 pr-4">
                                        <p className="font-semibold text-neutral-900 truncate">{zone.name}</p>
                                        <p className="text-xs text-neutral-500 truncate">{zone.coordinates.length} points</p>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-neutral-500 w-10 text-right">
                                                {zone.isActive ? 'Active' : 'Off'}
                                            </span>
                                            <Switch 
                                                checked={zone.isActive}
                                                onCheckedChange={() => toggleZone(zone.id, zone.isActive)}
                                            />
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 text-neutral-400 hover:text-red-500 hover:bg-red-50"
                                            onClick={() => deleteZone(zone.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
