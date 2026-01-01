/**
 * Operações de dados para CRM (exportação, importação, impressão)
 */

/**
 * Exporta dados para CSV
 */
export function exportToCSV(data: any[], filename: string = 'export'): boolean {
  try {
    if (data.length === 0) {
      console.warn('No data to export');
      return false;
    }

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          const value = row[header];
          const escaped = String(value ?? '').replace(/"/g, '""');
          return `"${escaped}"`;
        }).join(',')
      )
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `${filename}.csv`);
    return true;
  } catch (error) {
    console.error('Export CSV error:', error);
    return false;
  }
}

/**
 * Exporta dados para Excel (formato CSV com BOM para compatibilidade)
 */
export function exportToExcel(data: any[], filename: string = 'export'): boolean {
  try {
    if (data.length === 0) {
      console.warn('No data to export');
      return false;
    }

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join('\t'),
      ...data.map(row =>
        headers.map(header => String(row[header] ?? '')).join('\t')
      )
    ];

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvRows.join('\n')], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    downloadBlob(blob, `${filename}.xls`);
    return true;
  } catch (error) {
    console.error('Export Excel error:', error);
    return false;
  }
}

interface ExportPDFOptions {
  title?: string;
  landscape?: boolean;
  template?: string;
}

/**
 * Exporta dados para PDF (simplificado - gera HTML para impressão)
 */
export async function exportToPDF(data: any[], filename: string = 'export', options?: ExportPDFOptions): Promise<boolean> {
  try {
    if (data.length === 0) {
      console.warn('No data to export');
      return false;
    }

    const headers = Object.keys(data[0]);
    const title = options?.title || filename;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #4a5568; color: white; }
          tr:nth-child(even) { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <table>
          <thead>
            <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${data.map(row => 
              `<tr>${headers.map(h => `<td>${row[h] ?? ''}</td>`).join('')}</tr>`
            ).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
    }
    return true;
  } catch (error) {
    console.error('Export PDF error:', error);
    return false;
  }
}

/**
 * Importa dados de CSV
 */
export async function importFromCSV(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
          resolve([]);
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        const data = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          const obj: Record<string, string> = {};
          headers.forEach((header, i) => {
            obj[header] = values[i] || '';
          });
          return obj;
        });

        resolve(data);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

/**
 * Imprime dados
 */
export function printData(data: any[], title: string = 'Relatório'): void {
  exportToPDF(data, title);
}

/**
 * Helper para download de blob
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
