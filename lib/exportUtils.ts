import * as xlsx from "xlsx"

/**
 * Creates an Excel workbook from JSON data and triggers a download.
 * @param data Array of objects (rows for the table)
 * @param filename Name of the exported file (without extension)
 */
export function exportToExcel(data: any[], filename: string) {
    if (!data || data.length === 0) {
        console.warn("No data provided to export")
        return
    }

    // Create a new workbook
    const workBook = xlsx.utils.book_new()

    // Convert JSON data to worksheet
    const workSheet = xlsx.utils.json_to_sheet(data)

    // Append worksheet to workbook
    xlsx.utils.book_append_sheet(workBook, workSheet, "Data")

    // Generate buffer and trigger download
    xlsx.writeFile(workBook, `${filename}-${new Date().toISOString().split('T')[0]}.xlsx`)
}
