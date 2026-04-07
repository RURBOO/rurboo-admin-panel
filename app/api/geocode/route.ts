import { NextRequest, NextResponse } from 'next/server'

// Server-side in-memory cache — survives across requests
const cache = new Map<string, string | null>()
let lastFetch = 0

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const lat = parseFloat(searchParams.get('lat') || '')
    const lng = parseFloat(searchParams.get('lng') || '')

    if (isNaN(lat) || isNaN(lng)) {
        return NextResponse.json({ name: null })
    }

    const key = `${lat.toFixed(4)},${lng.toFixed(4)}`
    if (cache.has(key)) {
        return NextResponse.json({ name: cache.get(key) })
    }

    // Nominatim: 1 req/sec rate limit — enforce on server
    const now = Date.now()
    const wait = Math.max(0, 1100 - (now - lastFetch))
    if (wait > 0) await new Promise(r => setTimeout(r, wait))
    lastFetch = Date.now()

    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=15&addressdetails=1`,
            {
                headers: {
                    'User-Agent': 'RurbooAdminPanel/1.0 (admin@rurboo.in)',
                    'Accept-Language': 'en'
                },
                next: { revalidate: 86400 } // cache 24h in Next.js
            }
        )

        if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`)

        const data = await res.json()
        const addr = data.address || {}

        const village =
            addr.hamlet || addr.village || addr.neighbourhood ||
            addr.suburb || addr.residential || ''

        const tehsil =
            addr.town || addr.city_district ||
            addr.county || addr.state_district || ''

        let name: string | null = null
        if (village && tehsil && village !== tehsil) {
            name = `${village}, ${tehsil}`
        } else {
            name = village || tehsil || addr.city || addr.locality || null
        }

        cache.set(key, name)
        return NextResponse.json({ name })
    } catch (e) {
        console.error('Geocode error:', e)
        return NextResponse.json({ name: null })
    }
}
