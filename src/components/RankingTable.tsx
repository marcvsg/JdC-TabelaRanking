import { useMemo } from 'react';
import { TableHeader } from './TableHeader';
import { ParticipantRow } from './ParticipantRow';
import type { Column, Participant } from '../lib/types';

interface RankingTableProps {
  participants: Participant[];
  columns: Column[];
  isAdmin: boolean;
  onUpdateScore: (participantId: string, colId: string, value: number) => void;
  onUpdateName: (participantId: string, name: string) => void;
  onDeleteParticipant: (participantId: string) => void;
  onRenameColumn: (colId: string, name: string) => void;
  onDeleteColumn: (colId: string) => void;
}

function calcTotal(scores: Record<string, number>, columns: Column[]): number {
  return columns.reduce((sum, col) => sum + (scores[col.id] ?? 0), 0);
}

function sortParticipants(participants: Participant[], columns: Column[]) {
  const colsByRecent = [...columns].sort((a, b) => b.order - a.order);

  return [...participants].sort((a, b) => {
    const totalA = calcTotal(a.scores, columns);
    const totalB = calcTotal(b.scores, columns);
    if (totalB !== totalA) return totalB - totalA;

    // Tiebreaker: most recent column first
    for (const col of colsByRecent) {
      const scoreA = a.scores[col.id] ?? 0;
      const scoreB = b.scores[col.id] ?? 0;
      if (scoreB !== scoreA) return scoreB - scoreA;
    }
    return 0;
  });
}

export function RankingTable({
  participants,
  columns,
  isAdmin,
  onUpdateScore,
  onUpdateName,
  onDeleteParticipant,
  onRenameColumn,
  onDeleteColumn,
}: RankingTableProps) {
  const sortedColumns = useMemo(
    () => [...columns].sort((a, b) => a.order - b.order),
    [columns]
  );

  const sorted = useMemo(
    () => sortParticipants(participants, sortedColumns),
    [participants, sortedColumns]
  );

  if (sortedColumns.length === 0 && participants.length === 0) {
    return (
      <div className="empty-state">
        <p>Nenhum dado ainda.</p>
        {isAdmin && (
          <p className="hint">
            Adicione colunas (eventos) e participantes para começar.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table className="ranking-table">
        <thead>
          <tr>
            <th className="th-rank">#</th>
            <th className="th-participant">Participante</th>
            {sortedColumns.map((col) => (
              <TableHeader
                key={col.id}
                name={col.name}
                isAdmin={isAdmin}
                onRename={(n) => onRenameColumn(col.id, n)}
                onDelete={() => onDeleteColumn(col.id)}
              />
            ))}
            <th className="th-total">Total</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((p, i) => (
            <ParticipantRow
              key={p.id}
              rank={i + 1}
              participant={p}
              columns={sortedColumns}
              total={calcTotal(p.scores, sortedColumns)}
              isAdmin={isAdmin}
              onUpdateScore={(colId, v) => onUpdateScore(p.id, colId, v)}
              onUpdateName={(name) => onUpdateName(p.id, name)}
              onDelete={() => onDeleteParticipant(p.id)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
