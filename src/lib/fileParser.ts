import ExcelJS from "exceljs";

export interface ParsedRow {
  [key: string]: string | number;
}

export interface FileParseResult {
  rows: ParsedRow[];
  headers: string[];
  startIndex: number;
}

/**
 * Parse CSV file content
 */
export function parseCSV(content: string): FileParseResult {
  // Split into lines but do not trim entire lines so quoted values retain spaces
  const lines = content.split(/\r?\n/).filter((l) => l.length > 0);

  if (lines.length === 0) {
    throw new Error("File is empty");
  }

  let startIdx = 0;
  const parseCsvLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote inside quoted field
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
    result.push(current);
    return result;
  };

  const headerLower = parseCsvLine(lines[0]).join(",").toLowerCase();
  let headerUsed = false;

  // Check if first line contains common field names
  const commonFields = [
    "reference",
    "customer",
    "phone",
    "address",
    "package",
    "description",
    "sender",
    "delivery",
  ];
  const hasCommonFields = commonFields.some((field) =>
    headerLower.includes(field)
  );

  if (hasCommonFields) {
    startIdx = 1;
    headerUsed = true;
  } else {
    const firstLineParts = parseCsvLine(lines[0]).map((p) => p.trim());
    if (
      firstLineParts.length > 3 &&
      firstLineParts.every((p) => p.length > 0)
    ) {
      startIdx = 0;
      headerUsed = false;
    } else {
      startIdx = 1;
      headerUsed = true;
    }
  }

  let headers: string[];
  if (headerUsed) {
    headers = parseCsvLine(lines[0]).map((p) => p.trim());
  } else {
    const sampleParts = parseCsvLine(lines[startIdx] || "").map((p) =>
      p.trim()
    );
    headers = sampleParts.map((_, i) => `col${i + 1}`);
  }

  const rows: ParsedRow[] = [];
  const expandScientific = (val: string): string => {
    // Convert scientific-notation numeric strings to full digit strings
    // e.g., 9.66501E+11 -> 966501000000 or similar; we prefer integer truncation
    const sciRe = /^\s*\d+(?:\.\d+)?e[+\-]?\d+\s*$/i;
    if (sciRe.test(val)) {
      const num = Number(val);
      if (Number.isFinite(num)) {
        return String(Math.trunc(num));
      }
    }
    return val;
  };
  for (let i = startIdx; i < lines.length; i++) {
    const raw = lines[i];
    const parts = parseCsvLine(raw).map((p) => p.trim());

    const row: ParsedRow = {};
    headers.forEach((header, index) => {
      const original = parts[index] || "";
      row[header] = expandScientific(original);
    });
    rows.push(row);
  }

  return { rows, headers, startIndex: startIdx };
}

/**
 * Parse XLSX file buffer
 */
export async function parseXLSX(buffer: ArrayBuffer): Promise<FileParseResult> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.getWorksheet(1); // Get first worksheet
  if (!worksheet) {
    throw new Error("No worksheet found in Excel file");
  }

  const rows: ParsedRow[] = [];
  let headers: string[] = [];
  let startIndex = 0;
  let headerUsed = false;

  // Check if first row contains headers
  const firstRow = worksheet.getRow(1);
  const firstRowValues = firstRow.values as (
    | string
    | number
    | null
    | undefined
  )[];

  if (firstRowValues && firstRowValues.length > 1) {
    const firstRowText = firstRowValues
      .slice(1)
      .map((val) => (val ? val.toString().toLowerCase() : ""));

    const commonFields = [
      "reference",
      "customer",
      "phone",
      "address",
      "package",
      "description",
      "sender",
      "delivery",
    ];

    const hasCommonFields = commonFields.some((field) =>
      firstRowText.some((text) => text.includes(field))
    );

    if (hasCommonFields) {
      headers = firstRowValues
        .slice(1)
        .map((val) => (val ? val.toString().trim() : ""));
      startIndex = 2; // Excel rows are 1-indexed
      headerUsed = true;
    }
  }

  if (!headerUsed) {
    // Generate column headers
    const maxColumns = worksheet.columnCount || 20;
    headers = Array.from({ length: maxColumns }, (_, i) => `col${i + 1}`);
    startIndex = 1;
  }

  // Helper to normalize cell values consistently
  const normalizeCell = (cellValue: unknown): string => {
    if (cellValue == null) return "";
    if (typeof cellValue === "number") {
      // Avoid scientific notation for long integers
      return String(Math.trunc(cellValue));
    }
    const text = cellValue.toString().trim();
    // Handle scientific-notation numeric strings
    const sciRe = /^\s*\d+(?:\.\d+)?e[+\-]?\d+\s*$/i;
    if (sciRe.test(text)) {
      const num = Number(text);
      if (Number.isFinite(num)) return String(Math.trunc(num));
    }
    return text;
  };

  // Parse data rows
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber < startIndex) return;

    const rowValues = row.values as (string | number | null | undefined)[];
    if (!rowValues || rowValues.length <= 1) return;

    const parsedRow: ParsedRow = {};
    headers.forEach((header, index) => {
      const cellValue = rowValues[index + 1]; // Excel values are 1-indexed
      parsedRow[header] = normalizeCell(cellValue);
    });

    // Only add rows that have some content
    if (Object.values(parsedRow).some((val) => val !== "")) {
      rows.push(parsedRow);
    }
  });

  return { rows, headers, startIndex: headerUsed ? 1 : 0 };
}

/**
 * Parse file based on its type
 */
export async function parseFile(file: File): Promise<FileParseResult> {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();

  if (fileType === "text/csv" || fileName.endsWith(".csv")) {
    const content = await file.text();
    return parseCSV(content);
  } else if (
    fileType ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    fileName.endsWith(".xlsx")
  ) {
    const buffer = await file.arrayBuffer();
    return parseXLSX(buffer);
  } else {
    throw new Error("Unsupported file type. Please upload a CSV or XLSX file.");
  }
}

/**
 * Validate delivery data from parsed row
 */
export function validateDeliveryRow(
  row: ParsedRow,
  headers: string[]
): {
  isValid: boolean;
  reason: string;
  data?: {
    serviceType: string;
    reference: string;
    customerName: string;
    customerPhone: string;
    deliveryAddress: string;
    deliveryCity: string;
    deliveryPostalCode: string;
    packageType: string;
    description: string;
    priority: string;
    paymentMethod: string;
    deliveryFee: number;
    codAmount: number;
    notes: string;
    customerStoreName?: string; // Store name from customer account
    senderName: string;
    senderPhone: string;
    senderAddress: string;
    senderCity: string;
    senderPostalCode: string;
  };
} {
  // Map common column variations to standard fields
  const getFieldValue = (possibleNames: string[]): string => {
    for (const name of possibleNames) {
      const exactMatch = row[name];
      if (exactMatch) return exactMatch.toString().trim();

      // Case-insensitive search
      const header = headers.find(
        (h) => h.toLowerCase() === name.toLowerCase()
      );
      if (header && row[header]) return row[header].toString().trim();
    }
    return "";
  };

  const reference = getFieldValue(["reference", "ref", "Reference", "REF"]);
  const customerName = getFieldValue([
    "customerName",
    "customer_name",
    "customer",
    "Customer Name",
    "Customer",
  ]);
  const customerPhone = getFieldValue([
    "customerPhone",
    "customer_phone",
    "phone",
    "Phone",
    "Customer Phone",
  ]);
  const senderName = getFieldValue([
    "senderName",
    "sender_name",
    "sender",
    "Sender Name",
    "Sender",
  ]);
  const senderPhone = getFieldValue([
    "senderPhone",
    "sender_phone",
    "Sender Phone",
  ]);
  const senderAddress = getFieldValue([
    "senderAddress",
    "sender_address",
    "Sender Address",
  ]);
  const senderCity = getFieldValue([
    "senderCity",
    "sender_city",
    "Sender City",
  ]);
  const senderPostalCode = getFieldValue([
    "senderPostalCode",
    "sender_postal_code",
    "Sender Postal Code",
  ]);
  const deliveryAddress = getFieldValue([
    "deliveryAddress",
    "delivery_address",
    "address",
    "Address",
    "Delivery Address",
  ]);
  const deliveryCity = getFieldValue([
    "deliveryCity",
    "delivery_city",
    "city",
    "City",
    "Delivery City",
  ]);

  const deliveryPostalCode = getFieldValue([
    "deliveryPostalCode",
    "delivery_postal_code",
    "postal_code",
    "Postal Code",
    "Delivery Postal Code",
  ]);
  const packageType =
    getFieldValue([
      "packageType",
      "package_type",
      "package",
      "Package Type",
      "Package",
    ]) || "Package";
  const description = getFieldValue(["description", "Description"]);
  const priority = getFieldValue(["priority", "Priority"]) || "standard";
  const paymentMethod =
    getFieldValue([
      "paymentMethod",
      "payment_method",
      "payment",
      "Payment Method",
      "Payment",
    ]) || "cod";
  const serviceType = getFieldValue(["serviceType", "Service Type"]) || "1";
  const deliveryFee =
    parseFloat(
      getFieldValue([
        "deliveryFee",
        "delivery_fee",
        "fee",
        "Fee",
        "Delivery Fee",
      ]) || "0"
    ) || 0;
  const codAmount =
    parseFloat(
      getFieldValue(["codAmount", "cod_amount", "cod", "COD Amount", "COD"]) ||
        "0"
    ) || 0;
  const notes = getFieldValue(["notes", "Notes"]);

  // Validation
  const missingFields = [];
  if (!reference) missingFields.push("reference");
  if (!customerName) missingFields.push("customer name");
  if (!customerPhone) missingFields.push("customer phone");
  if (!deliveryAddress) missingFields.push("delivery address");

  if (missingFields.length > 0) {
    return {
      isValid: false,
      reason: `Missing required fields: ${missingFields.join(", ")}`,
    };
  }

  // Basic phone validation
  if (customerPhone.replace(/[\s\-\(\)]/g, "").length !== 9) {
    return {
      isValid: false,
      reason: "Customer phone must be exactly 9 digits (without country code)",
    };
  }

  if (senderPhone && senderPhone.replace(/[\s\-\(\)]/g, "").length !== 9) {
    return {
      isValid: false,
      reason: "Sender phone must be exactly 9 digits (without country code)",
    };
  }

  return {
    isValid: true,
    reason: "",
    data: {
      reference,
      customerName,
      customerPhone,
      customerStoreName: "", // Will be populated from user account
      senderName,
      senderPhone,
      senderAddress,
      senderCity,
      senderPostalCode,
      deliveryAddress,
      deliveryCity,
      deliveryPostalCode,
      packageType,
      description,
      priority,
      paymentMethod,
      serviceType,
      deliveryFee,
      codAmount,
      notes,
    },
  };
}
