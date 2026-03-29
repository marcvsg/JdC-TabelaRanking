import { useState, useRef, useEffect } from 'react';

interface ScoreCellProps {
  value: number;
  isAdmin: boolean;
  onSave: (value: number) => void;
}

export function ScoreCell({ value, isAdmin, onSave }: ScoreCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  function commit() {
    const num = Number(draft);
    if (!isNaN(num) && num !== value) {
      onSave(num);
    }
    setEditing(false);
  }

  if (!isAdmin) {
    return <td className="score-cell">{value}</td>;
  }

  if (editing) {
    return (
      <td className="score-cell score-cell-editing">
        <input
          ref={inputRef}
          type="number"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') setEditing(false);
          }}
          className="score-input"
        />
      </td>
    );
  }

  return (
    <td
      onClick={() => {
        setDraft(String(value));
        setEditing(true);
      }}
      className="score-cell score-cell-editable"
    >
      {value}
    </td>
  );
}
