exports.checkMissingColumns = (data) => {
  if (!data) {
    return { error: true, message: "No data received" };
  }

  const { rangeA1Notation, range, rowValues } = data;
  let rowNumber =
    range?.rowStart || parseInt(rangeA1Notation.replace(/\D/g, ""), 10);

  const columnMapping = [
    { key: "missingKeyword", name: "Keyword" },
    { key: "missingTitle", name: "Title" },
    { key: "missingMeta", name: "Meta Description" },
    { key: "missingOutline", name: "Outline" },
  ];

  const rowData = rowValues[0];
  let missingData = { MissingCol: false };

  columnMapping.forEach((col, index) => {
    if (!rowData[index] || rowData[index].trim() === "") {
      missingData[col.key] = `${col.name} is missing on row ${rowNumber}`;
      missingData.MissingCol = true;
    }
  });

  if (missingData.MissingCol) {
    return { ...missingData, message: "Missing values detected", rowNumber };
  }

  return {
    error: false,
    message: "All required values are present",
    rowNumber,
  };
};
