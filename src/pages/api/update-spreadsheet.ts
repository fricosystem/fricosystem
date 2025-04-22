// pages/api/update-spreadsheet.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const { spreadsheetId, sheetId, productId, productCode, columnIndex, newValue } = req.body;

    if (!spreadsheetId || !productCode || columnIndex === undefined || !newValue) {
      return res.status(400).json({ 
        message: 'Dados insuficientes para atualizar a planilha' 
      });
    }

    // Autenticação com o Google Sheets API
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Primeiro, encontrar a linha do produto na planilha usando o código do produto
    const findResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetId}!A:A`, // Assumindo que o código do produto está na coluna A
    });

    const values = findResponse.data.values || [];
    let rowIndex = -1;

    for (let i = 0; i < values.length; i++) {
      if (values[i][0] === productCode) {
        rowIndex = i + 1; // +1 porque as linhas começam em 1 no Google Sheets
        break;
      }
    }

    if (rowIndex === -1) {
      return res.status(404).json({ message: 'Produto não encontrado na planilha' });
    }

    // Converter o índice da coluna para letra (12 = M)
    const columnLetter = String.fromCharCode(65 + columnIndex); // 65 é o código ASCII para 'A'
    
    // Atualizar a célula específica
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetId}!${columnLetter}${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[newValue]],
      },
    });

    return res.status(200).json({ message: 'Planilha atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar planilha:', error);
    return res.status(500).json({ 
      message: 'Erro ao atualizar planilha', 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
}