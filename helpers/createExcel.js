const ExcelJS = require("exceljs")

/**
 * Generate an Excel workbook with dynamic tabular data
 * @param {Array} headers - Array of column headers for the table.
 * @param {Array} rows - Array of row data (each row is an array of cell values).
 * @param {String} title - The title of the report.
 * @returns {Stream.Writable} - A writable stream of the Excel workbook.
 */
function generateExcel(headers, rows, title = "Report") {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet(title)

  // Add headers
  worksheet.columns = headers.map((header) => ({
    header,
    key: header.toLowerCase().replace(/\s+/g, "_"),
    width: 20,
  }))

  // Add rows
  worksheet.addRows(rows)

  // Create a writable stream
  const stream = new require("stream").PassThrough()
  workbook.xlsx.write(stream).then(() => {
    stream.end()
  })

  return stream
}

module.exports = generateExcel
