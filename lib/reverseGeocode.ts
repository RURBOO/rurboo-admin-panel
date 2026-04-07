// Client-side cache
const cache = new Map<string, string | null>()

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
    const key = `${lat.toFixed(4)},${lng.toFixed(4)}`
    if (cache.has(key)) return cache.get(key)!

    try {
        // Use our own server-side API route — avoids CORS/rate-limit issues
        const res = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`, {
            signal: AbortSignal.timeout(10000)
        })
        if (!res.ok) throw new Error(`API error ${res.status}`)
        const data = await res.json()
        cache.set(key, data.name ?? null)
        return data.name ?? null
    } catch (e) {
        console.warn('reverseGeocode failed', e)
        return null
    }
}
