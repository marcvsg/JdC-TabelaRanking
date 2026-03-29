import { useState, useRef, useEffect } from 'react';
import { ScoreCell } from './ScoreCell';
import type { Column, Participant } from '../lib/types';

interface ParticipantRowProps {
  rank: number;
  participant: Participant;
  columns: Column[];
  total: number;
  isAdmin: boolean;
  onUpdateScore: (colId: string, value: number) => void;
  onUpdateName: (name: string) => void;
  onDelete: () => void;
}

export function ParticipantRow({
  rank,
  participant,
  columns,
  total,
  isAdmin,
  onUpdateScore,
  onUpdateName,
  onDelete,
}: ParticipantRowProps) {
  const [editingName, setEditingName] = useState(false);
  const [draft, setDraft] = useState(participant.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingName) inputRef.current?.select();
  }, [editingName]);

  function commitName() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== participant.name) {
      onUpdateName(trimmed);
    }
    setEditingName(false);
  }

  const rankClass =
    rank === 1
      ? 'rank-1'
      : rank === 2
        ? 'rank-2'
        : rank === 3
          ? 'rank-3'
          : 'rank-other';

  return (
    <tr className="participant-row">
      <td className={`rank-cell ${rankClass}`}>
        {rank <= 3 ? ['', '1st', '2nd', '3rd'][rank] : `${rank}th`}
      </td>

      <td className="name-cell">
        {isAdmin && editingName ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitName();
              if (e.key === 'Escape') setEditingName(false);
            }}
            className="name-edit-input"
          />
        ) : (
          <div className="name-display">
            <span
              onClick={() => {
                if (isAdmin) {
                  setDraft(participant.name);
                  setEditingName(true);
                }
              }}
              className={isAdmin ? 'name-editable' : undefined}
            >
              {participant.name}
            </span>
            {isAdmin && (
              <button
                onClick={onDelete}
                className="remove-btn"
                title="Remover participante"
              >
                remover
              </button>
            )}
          </div>
        )}
      </td>

      {columns.map((col) => (
        <ScoreCell
          key={col.id}
          value={participant.scores[col.id] ?? 0}
          isAdmin={isAdmin}
          onSave={(v) => onUpdateScore(col.id, v)}
        />
      ))}

      <td className="total-cell">{total}</td>
    </tr>
  );
}
