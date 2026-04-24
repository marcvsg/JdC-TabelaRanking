import { useState } from 'react';
import type { Column } from '../lib/types';

interface CreateChampionshipModalProps {
  columns: Column[];
  onCreate: (
    name: string,
    columnIds: string[],
    groupCount: number,
    classifyCount: number
  ) => Promise<void>;
  onCancel: () => void;
}

export function CreateChampionshipModal({
  columns,
  onCreate,
  onCancel,
}: CreateChampionshipModalProps) {
  const [name, setName] = useState('');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [groupCount, setGroupCount] = useState(2);
  const [classifyCount, setClassifyCount] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectColumn = (colId: string) => {
    setSelectedColumns((prev) =>
      prev.includes(colId) ? prev.filter((c) => c !== colId) : [...prev, colId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || selectedColumns.length === 0) {
      alert('Preencha todos os campos');
      return;
    }
    if (classifyCount < 1 || classifyCount >= groupCount) {
      alert('Quantos classificam deve ser menor que o número de grupos');
      return;
    }
    setIsLoading(true);
    try {
      await onCreate(name, selectedColumns, groupCount, classifyCount);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Novo Campeonato</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Nome do Campeonato</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Copa 2024"
            />
          </div>

          <div className="form-group">
            <label>Etapas (selecione pelo menos uma)</label>
            <div className="checkbox-group">
              {columns.length === 0 ? (
                <p className="text-muted">Nenhuma etapa disponível</p>
              ) : (
                columns.map((col) => (
                  <label key={col.id} className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={selectedColumns.includes(col.id)}
                      onChange={() => handleSelectColumn(col.id)}
                    />
                    {col.name}
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="groups">Número de Grupos</label>
              <input
                id="groups"
                type="number"
                min="2"
                max="8"
                value={groupCount}
                onChange={(e) => setGroupCount(Math.max(2, parseInt(e.target.value) || 2))}
              />
            </div>

            <div className="form-group">
              <label htmlFor="classify">Qtd Classif p/ grupo</label>
              <input
                id="classify"
                type="number"
                min="1"
                max={groupCount - 1}
                value={classifyCount}
                onChange={(e) => setClassifyCount(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onCancel} className="btn btn-gray" disabled={isLoading}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-blue" disabled={isLoading}>
              {isLoading ? 'Criando...' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
