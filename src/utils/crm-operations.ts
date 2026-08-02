/**
 * Operações utilitárias para CRM
 */

/**
 * Debounce function - delays execution until after wait milliseconds have elapsed since the last call
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return function (this: any, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, wait);
  };
}

/**
 * Formata valor como moeda
 */
export function formatCurrency(value: number, locale: string = 'pt-BR', currency: string = 'BRL'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency
  }).format(value);
}

/**
 * Formata data
 */
export function formatDate(date: Date | string | null | undefined, locale: string = 'pt-BR'): string {
  if (!date) return '-';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString(locale);
}

/**
 * Formata percentual
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Valida email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Gera ID único
 */
export function generateUniqueId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Busca em dados
 */
export function searchInData<T extends Record<string, any>>(
  data: T[],
  searchTerm: string,
  fields: string[]
): T[] {
  if (!searchTerm.trim()) return data;
  
  const term = searchTerm.toLowerCase();
  return data.filter(item =>
    fields.some(field => {
      const value = item[field];
      if (typeof value === 'string') {
        return value.toLowerCase().includes(term);
      }
      if (typeof value === 'number') {
        return value.toString().includes(term);
      }
      return false;
    })
  );
}

/**
 * Filtra por intervalo de datas
 */
export function filterByDateRange<T extends Record<string, any>>(
  data: T[],
  from: Date | null | undefined,
  to: Date | null | undefined,
  dateField: string
): T[] {
  if (!from && !to) return data;
  
  return data.filter(item => {
    const itemDate = item[dateField];
    if (!itemDate) return false;
    
    const date = itemDate instanceof Date ? itemDate : new Date(itemDate);
    if (isNaN(date.getTime())) return false;
    
    if (from && date < from) return false;
    if (to && date > to) return false;
    
    return true;
  });
}

interface ExportOptions {
  title?: string;
  landscape?: boolean;
  template?: string;
}

/**
 * Exportação para CSV
 */
export function exportToCSV(data: any[], filename: string): boolean {
  try {
    if (data.length === 0) return false;
    
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
 * Exportação para Excel
 */
export function exportToExcel(data: any[], filename: string): boolean {
  try {
    if (data.length === 0) return false;
    
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

/**
 * Exportação para PDF
 */
export async function exportToPDF(data: any[], filename: string, options?: ExportOptions): Promise<boolean> {
  try {
    if (data.length === 0) return false;
    
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
 * Exportação aprimorada
 */
export async function enhancedExport(
  data: any[],
  format: 'csv' | 'excel' | 'pdf',
  filename: string,
  options?: ExportOptions
): Promise<boolean> {
  try {
    switch (format) {
      case 'csv':
        return exportToCSV(data, filename);
      case 'excel':
        return exportToExcel(data, filename);
      case 'pdf':
        return await exportToPDF(data, filename, options);
      default:
        return false;
    }
  } catch (error) {
    console.error('Enhanced export error:', error);
    return false;
  }
}

/**
 * Importação aprimorada
 */
export async function enhancedImport(
  file: File,
  onSuccess?: (data: any[]) => void,
  requiredFields?: string[],
  customValidation?: (row: any) => boolean
): Promise<any[]> {
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
        let data = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          const obj: Record<string, string> = {};
          headers.forEach((header, i) => {
            obj[header] = values[i] || '';
          });
          return obj;
        });

        // Apply custom validation if provided
        if (customValidation) {
          data = data.filter(customValidation);
        }

        if (onSuccess) {
          onSuccess(data);
        }
        
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
