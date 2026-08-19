export function parseCsv(csv) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < csv.length; i++) {
    const char = csv[i];
    const next = csv[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        i++;
      }

      row.push(field);

      if (row.some(value => value !== "")) {
        rows.push(row);
      }

      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  const [headers, ...dataRows] = rows;

  return dataRows.map(values =>
    Object.fromEntries(
      headers.map((header, index) => [
        header,
        values[index] ?? ""
      ])
    )
  );
}

const CSV_HEADERS = [
  "title",
  "summary",
  "url",
  "release_date",
  "display_date",
  "org",
  "updated",
  "status"
];

export function stringifyCsv(publications) {
  const rows = [
    CSV_HEADERS,
    ...publications.map(publication =>
      CSV_HEADERS.map(header => publication[header] ?? "")
    )
  ];

  return rows
    .map(row =>
      row
        .map(escapeCsvField)
        .join(",")
    )
    .join("\n") + "\n";
}

function escapeCsvField(value) {
  const stringValue = String(value ?? "");

  const needsQuotes =
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n") ||
    stringValue.includes("\r");

  if (!needsQuotes) {
    return stringValue;
  }

  const escapedValue = stringValue.replaceAll('"', '""');

  return `"${escapedValue}"`;
}