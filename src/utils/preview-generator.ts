/**
 * Gerador de preview HTML para impressão e exportação
 */

interface PreviewOptions {
  title?: string;
  columns?: { key: string; header: string }[];
  companyName?: string;
  logo?: string;
  showDate?: boolean;
  locale?: string;
}

/**
 * Gera HTML para preview de dados
 */
export function generatePreviewHTML(
  data: any[],
  moduleName?: string,
  title?: string,
  columns?: { key: string; header: string }[],
  locale?: string
): string {
  const options: PreviewOptions = {
    title: title || moduleName || 'Relatório',
    columns,
    showDate: true,
    locale: locale || 'pt-BR'
  };

  const headers = options.columns 
    ? options.columns.map(c => c.header)
    : data.length > 0 ? Object.keys(data[0]) : [];
  
  const keys = options.columns 
    ? options.columns.map(c => c.key)
    : headers;

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '-';
    if (value instanceof Date) return value.toLocaleDateString(options.locale);
    if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
    if (typeof value === 'number') {
      return value.toLocaleString(options.locale);
    }
    return String(value);
  };

  return `
    <!DOCTYPE html>
    <html lang="${options.locale}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${options.title}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          padding: 20px;
          color: #333;
          line-height: 1.6;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #3b82f6;
        }
        .header-left {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        .header-logo {
          max-height: 50px;
          max-width: 150px;
        }
        .header-title {
          font-size: 24px;
          font-weight: bold;
          color: #1e40af;
        }
        .header-date {
          color: #666;
          font-size: 14px;
        }
        .company-name {
          font-size: 12px;
          color: #666;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th {
          background-color: #3b82f6;
          color: white;
          padding: 12px 8px;
          text-align: left;
          font-weight: 600;
          font-size: 13px;
          text-transform: uppercase;
        }
        td {
          padding: 10px 8px;
          border-bottom: 1px solid #e5e7eb;
          font-size: 13px;
        }
        tr:nth-child(even) {
          background-color: #f9fafb;
        }
        tr:hover {
          background-color: #f3f4f6;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          color: #666;
          font-size: 12px;
        }
        .total-rows {
          margin-top: 15px;
          font-size: 14px;
          color: #666;
        }
        @media print {
          body {
            padding: 10px;
          }
          .header {
            margin-bottom: 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="header-left">
          ${options.logo ? `<img src="${options.logo}" alt="Logo" class="header-logo">` : ''}
          <div>
            <h1 class="header-title">${options.title}</h1>
            ${options.companyName ? `<p class="company-name">${options.companyName}</p>` : ''}
          </div>
        </div>
        ${options.showDate ? `<div class="header-date">Gerado em: ${new Date().toLocaleDateString(options.locale)} às ${new Date().toLocaleTimeString(options.locale)}</div>` : ''}
      </div>
      
      <table>
        <thead>
          <tr>
            ${headers.map(h => `<th>${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr>
              ${keys.map(key => `<td>${formatValue(row[key])}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="total-rows">
        Total de registros: ${data.length}
      </div>
      
      <div class="footer">
        Documento gerado automaticamente pelo sistema
      </div>
    </body>
    </html>
  `;
}

/**
 * Abre preview em nova janela
 */
export function openPreviewWindow(html: string): Window | null {
  const previewWindow = window.open('', '_blank');
  if (previewWindow) {
    previewWindow.document.write(html);
    previewWindow.document.close();
  }
  return previewWindow;
}

/**
 * Imprime preview
 */
export function printPreview(html: string): void {
  const previewWindow = openPreviewWindow(html);
  if (previewWindow) {
    previewWindow.onload = () => {
      previewWindow.print();
    };
  }
}
