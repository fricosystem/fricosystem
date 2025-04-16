
interface GoogleSheetsResponse {
  feed: {
    entry: Array<{
      gs$cell: {
        row: string;
        col: string;
        $t: string;
      }
    }>
  }
}

// Convert spreadsheet data to a more usable format
export const parseGoogleSheetsData = (data: GoogleSheetsResponse) => {
  const entries = data.feed.entry;
  const rows: Record<string, Record<string, string>> = {};
  
  // Map of column indices to field names
  const columnMap: Record<string, string> = {};
  
  // Process header row to create column mapping
  entries
    .filter(entry => entry.gs$cell.row === "1")
    .forEach(entry => {
      const headerText = entry.gs$cell.$t.trim();
      const columnIndex = entry.gs$cell.col;
      
      // Map Google Sheets column headers to our field names
      switch (headerText) {
        case "Codigo material": columnMap[columnIndex] = "codigo"; break;
        case "Codigo estoque": columnMap[columnIndex] = "codigoEstoque"; break;
        case "Nome": columnMap[columnIndex] = "nome"; break;
        case "Unidade": columnMap[columnIndex] = "unidade"; break;
        case "Deposito": columnMap[columnIndex] = "deposito"; break;
        case "Quantidade": columnMap[columnIndex] = "quantidadeAtual"; break;
        case "Quantidade minima": columnMap[columnIndex] = "quantidadeMinima"; break;
        case "Detalhes": columnMap[columnIndex] = "detalhes"; break;
        case "Imagem": columnMap[columnIndex] = "imagem"; break;
        case "Valor unitario": columnMap[columnIndex] = "valorUnitario"; break;
        case "Prateleira": columnMap[columnIndex] = "prateleira"; break;
        case "Data vencimento": columnMap[columnIndex] = "dataVencimento"; break;
        case "Data criacao": columnMap[columnIndex] = "dataHora"; break;
        default: columnMap[columnIndex] = headerText.toLowerCase().replace(/\s/g, "_"); 
      }
    });

  // Process data rows
  entries
    .filter(entry => entry.gs$cell.row !== "1") // Skip header row
    .forEach(entry => {
      const rowIndex = entry.gs$cell.row;
      const colIndex = entry.gs$cell.col;
      const value = entry.gs$cell.$t;
      
      if (!rows[rowIndex]) {
        rows[rowIndex] = {};
      }
      
      const fieldName = columnMap[colIndex];
      if (fieldName) {
        rows[rowIndex][fieldName] = value;
      }
    });

  // Convert rows object to array and transform data types
  return Object.values(rows).map((row, index) => ({
    id: row.id || `sheet-${index + 1}`,
    codigo: row.codigo || "",
    codigoEstoque: row.codigoEstoque || "",
    nome: row.nome || "",
    unidade: row.unidade || "UN",
    deposito: row.deposito || "",
    quantidadeAtual: parseFloat(row.quantidadeAtual) || 0,
    quantidadeMinima: parseFloat(row.quantidadeMinima) || 0,
    detalhes: row.detalhes || "",
    imagem: row.imagem || "/placeholder.svg",
    valorUnitario: parseFloat(row.valorUnitario?.replace(",", ".")) || 0,
    prateleira: row.prateleira || "",
    dataVencimento: row.dataVencimento ? new Date(row.dataVencimento).toISOString() : "",
    dataHora: row.dataHora ? new Date(row.dataHora).toISOString() : new Date().toISOString(),
    centroDeCusto: row.centroDeCusto || "ESTOQUE-GERAL"
  }));
};

// Fetch Google Sheets data as JSON
export const fetchGoogleSheetsData = async (sheetId: string, sheetNumber = 1) => {
  try {
    const url = `https://spreadsheets.google.com/feeds/cells/${sheetId}/${sheetNumber}/public/full?alt=json`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch spreadsheet: ${response.status}`);
    }
    
    const data = await response.json();
    return parseGoogleSheetsData(data);
  } catch (error) {
    console.error("Error fetching Google Sheets data:", error);
    throw error;
  }
};
