import { useState, useRef, useEffect } from 'react';

interface TableHeaderProps {
  name: string;
  isAdmin: boolean;
  onRename: (newName: string) => void;
  onDelete: () => void;
}

export function TableHeader({
  name,
  isAdmin,
  onRename,
  onDelete,
}: TableHeaderProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  function commit() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== name) {
      onRename(trimmed);
    }
    setEditing(false);
  }

  if (!isAdmin) {
    return <th>{name}</th>;
  }

  if (editing) {
    return (
      <th>
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') setEditing(false);
          }}
          className="th-edit-input"
        />
      </th>
    );
  }

  return (
    <th className="th-editable">
      <span
        onClick={() => {
          setDraft(name);
          setEditing(true);
        }}
        className="th-name"
      >
        {name}
      </span>
      <button onClick={onDelete} className="th-delete-btn" title="Remover coluna">
        x
      </button>
    </th>
  );
}
