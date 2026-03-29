import { doc, updateDoc, addDoc, collection, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Column, Participant } from '../lib/types';

interface CSVRow {
  [key: string]: string | number;
}

export function useCSVImport() {
  async function parseCSV(content: string): Promise<CSVRow[]> {
    const lines = content.trim().split('\n');
    if (lines.length < 2) throw new Error('CSV vazio ou inválido');

    const headers = lines[0].split(',').map((h) => h.trim());
    const rows: CSVRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim());
      const row: CSVRow = {};
      headers.forEach((h, j) => {
        row[h] = isNaN(Number(values[j])) ? values[j] : Number(values[j]);
      });
      rows.push(row);
    }

    return rows;
  }

  async function importCSV(
    file: File,
    columns: Column[],
    participants: Participant[]
  ) {
    const content = await file.text();
    const rows = await parseCSV(content);

    if (rows.length === 0) throw new Error('Nenhuma linha de dados no CSV');

    const headers = Object.keys(rows[0]);
    const nameCol = headers[0]; // Primeira coluna é o nome

    if (!nameCol) throw new Error('CSV precisa ter pelo menos uma coluna');

    // Validar que as colunas (exceto a primeira) existem
    const missingCols = headers
      .slice(1)
      .filter((h) => !columns.some((c) => c.name === h));

    if (missingCols.length > 0) {
      throw new Error(
        `Colunas não encontradas: ${missingCols.join(', ')}. Crie-as primeiro.`
      );
    }

    // Map de nomes de coluna -> ID
    const colMap: Record<string, string> = {};
    headers.slice(1).forEach((h) => {
      const col = columns.find((c) => c.name === h);
      if (col) colMap[h] = col.id;
    });

    // Processar linhas
    for (const row of rows) {
      const name = String(row[nameCol]).trim();
      if (!name) continue;

      // Verificar se a linha tem pelo menos um score válido (não 0 e não vazio)
      const hasValidScore = headers.slice(1).some((h) => {
        const value = Number(row[h]);
        return !isNaN(value) && value !== 0 && String(row[h]).trim() !== '';
      });
      if (!hasValidScore) continue;

      // Encontrar participante existente
      const existing = participants.find((p) => p.name === name);

      if (existing) {
        // Somar scores (ignorar 0 e vazios)
        const updatedScores = { ...existing.scores };
        headers.slice(1).forEach((h) => {
          const value = Number(row[h]);
          const colId = colMap[h];
          if (!isNaN(value) && value !== 0 && String(row[h]).trim() !== '') {
            updatedScores[colId] = (updatedScores[colId] ?? 0) + value;
          }
        });

        await updateDoc(doc(db, 'participants', existing.id), {
          scores: updatedScores,
        });
      } else {
        // Criar novo participante (ignorar 0 e vazios)
        const scores: Record<string, number> = {};
        headers.slice(1).forEach((h) => {
          const value = Number(row[h]);
          const colId = colMap[h];
          if (!isNaN(value) && value !== 0 && String(row[h]).trim() !== '') {
            scores[colId] = value;
          }
        });

        await addDoc(collection(db, 'participants'), {
          name,
          scores,
          createdAt: Date.now(),
        });
      }
    }

    return { imported: rows.length, merged: rows.filter(r => participants.some(p => p.name === String(r[nameCol]))).length };
  }

  return { parseCSV, importCSV };
}
