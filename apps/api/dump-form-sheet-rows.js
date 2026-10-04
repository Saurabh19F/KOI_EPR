const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

async function run() {
  const url = 'https://docs.google.com/spreadsheets/d/13Pu2DEbKwjUF-jw2WZz2JR33Gb_9xPYMNW4BWCs4mcg/export?format=xlsx';
  const filePath = path.join(__dirname, 'sheet.xlsx');

  const res = await fetch(url);
  const arrayBuffer = await res.arrayBuffer();
  fs.writeFileSync(filePath, Buffer.from(arrayBuffer));

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const formSheet = workbook.getWorksheet('Form');
  console.log(`Inspecting sheet: ${formSheet.name}`);

  // Dump cells from row 11 to 30, cols 1 to 20
  for (let r = 11; r <= 35; r++) {
    const row = formSheet.getRow(r);
    const rowValues = [];
    let hasValue = false;
    for (let c = 1; c <= 20; c++) {
      const cell = row.getCell(c);
      let val = cell.value;
      if (val && typeof val === 'object' && val.formula) {
        val = `=${val.formula} [res: ${val.result}]`;
      }
      rowValues.push(val !== null && val !== undefined ? String(val) : '');
      if (val !== null && val !== undefined && val !== '') {
        hasValue = true;
      }
    }
    if (hasValue) {
      console.log(`Row ${r}:`, rowValues.map((v, i) => `${i+1}: ${v}`).filter(v => v.split(': ')[1]).join(' | '));
    }
  }

  fs.unlinkSync(filePath);
}

run().catch(console.error);
