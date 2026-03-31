import { useState, type FormEvent } from 'react';

interface AddParticipantFormProps {
  onAdd: (name: string) => Promise<void>;
}

export function AddParticipantForm({ onAdd }: AddParticipantFormProps) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    setError('');
    setLoading(true);

    try {
      await onAdd(trimmed);
      setName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar participante');
    } finally {
      setLoading(false);
    }
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
      {error && <p className="error-message">{error}</p>}
    </form>
  );
}
