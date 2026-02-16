export function exportToCSV(data: object[], filename: string) {
    if (!data || !data.length) {
        console.warn("No data to export")
        return
    }

    const headers = Object.keys(data[0])
    const csvContent = [
        headers.join(","), // Header row
        ...data.map(row => headers.map(header => {
            const value = (row as any)[header]
            // Handle commas in data
            return typeof value === 'string' && value.includes(',')
                ? `"${value}"`
                : value
        }).join(","))
    ].join("\n")

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)
        link.setAttribute("download", `${filename}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }
}
