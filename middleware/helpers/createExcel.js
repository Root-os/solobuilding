const ExcelJS = require("exceljs")

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
