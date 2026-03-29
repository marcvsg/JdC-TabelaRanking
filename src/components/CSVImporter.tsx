import { useState, useRef } from 'react';
import { useCSVImport } from '../hooks/useCSVImport';
import type { Column, Participant } from '../lib/types';

interface CSVImporterProps {
  columns: Column[];
  participants: Participant[];
  onImportSuccess: () => void;
}

export function CSVImporter({
  columns,
  participants,
  onImportSuccess,
}: CSVImporterProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<Array<Record<string, unknown>>>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { parseCSV, importCSV } = useCSVImport();

  async function handleFileSelect(file: File) {
    setError('');
    setPreview([]);
    setSelectedFile(file);

    try {
      const content = await file.text();
      const rows = await parseCSV(content);
      setPreview(rows.slice(0, 5)); // Preview das primeiras 5 linhas
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao ler CSV');
    }
  }

  async function handleImport() {
    if (!selectedFile) return;
    setLoading(true);
    setError('');

    try {
      const result = await importCSV(selectedFile, columns, participants);
      setPreview([]);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      onImportSuccess();
      alert(`✓ Importado ${result.imported} linhas (${result.merged} mescladas)`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao importar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="csv-importer">
      <h3 className="importer-title">Importar CSV</h3>

      <div className="importer-upload">
        <input
          ref={fileInputRef}
          id="csv-file-input"
          type="file"
          accept=".csv"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
          }}
          className="file-input"
        />
        <label htmlFor="csv-file-input">
          Selecione um arquivo CSV
        </label>
      </div>

      {error && <p className="error-message">{error}</p>}

      {preview.length > 0 && (
        <div className="preview-section">
          <h4 className="preview-title">Preview ({preview.length} linhas)</h4>
          <div className="preview-table">
            <table>
              <thead>
                <tr>
                  {Object.keys(preview[0]).map((k) => (
                    <th key={k}>{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((v, j) => (
                      <td key={j}>{String(v)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="importer-actions">
            <button onClick={handleImport} disabled={loading} className="btn btn-green">
              {loading ? 'Importando...' : '✓ Importar'}
            </button>
            <button
              onClick={() => {
                setPreview([]);
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="btn btn-secondary"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
