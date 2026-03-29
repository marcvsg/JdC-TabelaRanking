import { useState, type FormEvent } from 'react';

interface AddParticipantFormProps {
  onAdd: (name: string) => Promise<void>;
}

export function AddParticipantForm({ onAdd }: AddParticipantFormProps) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setLoading(true);
    await onAdd(trimmed);
    setName('');
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="add-participant-form">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nome do participante"
        className="form-input"
      />
      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="btn btn-green"
      >
        + Participante
      </button>
    </form>
  );
}
