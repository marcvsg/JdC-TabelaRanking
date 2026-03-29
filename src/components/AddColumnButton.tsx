import { useState } from 'react';

interface AddColumnButtonProps {
  onAdd: (name: string) => Promise<void>;
}

export function AddColumnButton({ onAdd }: AddColumnButtonProps) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');

  async function handleAdd() {
    const trimmed = name.trim();
    if (!trimmed) return;
    await onAdd(trimmed);
    setName('');
    setAdding(false);
  }

  if (!adding) {
    return (
      <button onClick={() => setAdding(true)} className="btn btn-blue">
        + Coluna / Evento
      </button>
    );
  }

  return (
    <div className="add-column-row">
      <input
        autoFocus
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleAdd();
          if (e.key === 'Escape') setAdding(false);
        }}
        placeholder="Nome do evento"
        className="form-input"
      />
      <button onClick={handleAdd} disabled={!name.trim()} className="btn btn-blue">
        Adicionar
      </button>
      <button
        onClick={() => {
          setAdding(false);
          setName('');
        }}
        className="btn btn-secondary"
      >
        Cancelar
      </button>
    </div>
  );
}
