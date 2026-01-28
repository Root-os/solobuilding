const PDFDocument = require("pdfkit")

function generatePDF(headers, rows, title = "Report") {
  const doc = new PDFDocument()

  doc.fontSize(18).text(title, { align: "center" }).moveDown()

  const tableTop = 120
  const columnWidth = 100

  doc.font("Courier-Bold").fontSize(12)
  headers.forEach((header, index) => {
    doc.text(header, 50 + index * columnWidth, tableTop, {
      width: columnWidth,
      align: "left",
    })
  })

  doc.font("Courier").fontSize(10)
  rows.forEach((row, rowIndex) => {
    const rowTop = tableTop + 25 + rowIndex * 20
    row.forEach((cell, colIndex) => {
      doc.text(cell, 50 + colIndex * columnWidth, rowTop, {
        width: columnWidth,
        align: "left",
      })
    })
  })

  doc.end()

  return doc
}

module.exports = generatePDF
