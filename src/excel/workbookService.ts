import ExcelJS from "exceljs";

export interface WorkbookWriteInput {
  templatePath: string;
  outputFileName: string;
  data1SheetName: string;
  data2SheetName: string;
  data1Headers: string[];
  data2Headers: string[];
  data1Rows: string[][];
  data2Rows: string[][];
}

export async function writeAndDownloadWorkbook(input: WorkbookWriteInput): Promise<void> {
  const templateResponse = await fetch(input.templatePath);
  if (!templateResponse.ok) {
    throw new Error(`Template could not be loaded from ${input.templatePath}`);
  }

  const templateBuffer = await templateResponse.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(templateBuffer);

  const data1 = workbook.getWorksheet(input.data1SheetName);
  const data2 = workbook.getWorksheet(input.data2SheetName);

  if (!data1 || !data2) {
    const missing = [
      !data1 ? input.data1SheetName : "",
      !data2 ? input.data2SheetName : ""
    ]
      .filter(Boolean)
      .join(", ");
    throw new Error(`Worksheet not found in template: ${missing}`);
  }

  clearWorksheetValues(data1, input.data1Headers.length);
  clearWorksheetValues(data2, input.data2Headers.length);

  writeHeadersAndRows(data1, input.data1Headers, input.data1Rows);
  writeHeadersAndRows(data2, input.data2Headers, input.data2Rows);

  const outputBuffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([outputBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = input.outputFileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function clearWorksheetValues(sheet: ExcelJS.Worksheet, minColumns: number): void {
  const rowCount = Math.max(sheet.rowCount, 1);
  const columnCount = Math.max(sheet.columnCount, minColumns);

  for (let row = 1; row <= rowCount; row += 1) {
    for (let col = 1; col <= columnCount; col += 1) {
      sheet.getCell(row, col).value = null;
    }
  }
}

function writeHeadersAndRows(sheet: ExcelJS.Worksheet, headers: string[], rows: string[][]): void {
  headers.forEach((header, index) => {
    sheet.getCell(1, index + 1).value = header;
  });

  rows.forEach((row, rowIndex) => {
    row.forEach((value, colIndex) => {
      sheet.getCell(rowIndex + 2, colIndex + 1).value = value;
    });
  });
}
