import { useState } from 'react';
import type { Championship, Column } from '../lib/types';

interface StartPhase2ModalProps {
  championship: Championship;
  columns: Column[];
  onStart: (columnIds: string[]) => Promise<void>;
  onCancel: () => void;
}

export function StartPhase2Modal({
  championship,
  columns,
  onStart,
  onCancel,
}: StartPhase2ModalProps) {
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectColumn = (colId: string) => {
    setSelectedColumns((prev) =>
      prev.includes(colId) ? prev.filter((c) => c !== colId) : [...prev, colId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedColumns.length === 0) {
      alert('Selecione pelo menos uma etapa para a Fase 2');
      return;
    }
    setIsLoading(true);
    try {
      await onStart(selectedColumns);
    } finally {
      setIsLoading(false);
    }
  };

  // Calcular quantos avançarão para o mata-mata
  const classifieds = championship.groups.reduce(
    (sum) => sum + championship.classifyCount,
    0
  );

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>🏆 Iniciar Mata-mata</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Etapas para Fase 2</label>
            <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '12px' }}>
              Selecione quais etapas determinarão os vencedores do mata-mata.
            </p>
            {columns.length === 0 ? (
              <p className="text-muted">Nenhuma etapa disponível</p>
            ) : (
              <div className="checkbox-group">
                {columns.map((col) => (
                  <label key={col.id} className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={selectedColumns.includes(col.id)}
                      onChange={() => handleSelectColumn(col.id)}
                    />
                    {col.name}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="phase2-info">
            <p>
              <strong>Classificados para mata-mata:</strong> {classifieds} participantes
            </p>
            <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginTop: '4px' }}>
              ({championship.groups.length} grupos × {championship.classifyCount} classificados)
            </p>
          </div>

          <div className="warning-section" style={{ marginBottom: '16px' }}>
            ⚠️ Após iniciar, não será possível voltar para a Fase 1
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-gray"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-blue"
              disabled={isLoading}
            >
              {isLoading ? 'Iniciando...' : 'Iniciar Mata-mata'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
