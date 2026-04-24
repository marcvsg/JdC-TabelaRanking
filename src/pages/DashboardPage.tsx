import { useCallback, useMemo } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { useColumns } from '../hooks/useColumns';
import { useParticipants } from '../hooks/useParticipants';
import { Layout } from '../components/Layout';
import { RankingTable } from '../components/RankingTable';
import { AddParticipantForm } from '../components/AddParticipantForm';
import { AddColumnButton } from '../components/AddColumnButton';
import { AdminUserManager } from '../components/AdminUserManager';
import { useNavigate } from 'react-router-dom';


export function DashboardPage() {
  const { user, role } = useAuthContext();
  const { columns, addColumn, removeColumn, renameColumn } = useColumns();
  const {
    participants,
    addParticipant,
    removeParticipant,
    updateParticipantName,
    updateScore,
  } = useParticipants();
  const navigate = useNavigate();

  const isAdmin = role === 'admin';

  const sortedColumns = useMemo(
    () => [...columns].sort((a, b) => a.order - b.order),
    [columns]
  );

  const exportCSV = useCallback(() => {
    const cols = sortedColumns;

    // Ordenar participantes igual à tabela (total desc, tiebreaker por coluna recente)
    const colsByRecent = [...cols].sort((a, b) => b.order - a.order);
    const sorted = [...participants].sort((a, b) => {
      const totalA = cols.reduce((s, c) => s + (a.scores[c.id] ?? 0), 0);
      const totalB = cols.reduce((s, c) => s + (b.scores[c.id] ?? 0), 0);
      if (totalB !== totalA) return totalB - totalA;
      for (const col of colsByRecent) {
        const sA = a.scores[col.id] ?? 0;
        const sB = b.scores[col.id] ?? 0;
        if (sB !== sA) return sB - sA;
      }
      return 0;
    });

    // Escapar campos com vírgula ou aspas
    const esc = (v: string) =>
      v.includes(',') || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v;

    const header = ['#', 'Participante', ...cols.map((c) => esc(c.name)), 'Total'];
    const lines = [header.join(',')];

    sorted.forEach((p, i) => {
      const total = cols.reduce((s, c) => s + (p.scores[c.id] ?? 0), 0);
      const row = [
        String(i + 1),
        esc(p.name),
        ...cols.map((c) => String(p.scores[c.id] ?? 0)),
        String(total),
      ];
      lines.push(row.join(','));
    });

    const blob = new Blob(['\uFEFF' + lines.join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ranking.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [participants, sortedColumns]);

  return (
    <Layout>
      {isAdmin && (
        <div className="admin-controls">
          <div className="admin-controls-form">
            <AddParticipantForm onAdd={addParticipant} />
          </div>
          <AddColumnButton onAdd={addColumn} />
          <button onClick={() => navigate('/import')} className="btn btn-blue">
            Importar CSV
          </button>
          <button onClick={exportCSV} className="btn btn-green">
            Exportar CSV
          </button>
          <AdminUserManager currentUid={user!.uid} />
        </div>
      )}

      <RankingTable
        participants={participants}
        columns={columns}
        isAdmin={isAdmin}
        onUpdateScore={updateScore}
        onUpdateName={updateParticipantName}
        onDeleteParticipant={removeParticipant}
        onRenameColumn={renameColumn}
        onDeleteColumn={removeColumn}
      />

      {!isAdmin && participants.length === 0 && columns.length === 0 && (
        <p className="viewer-empty">
          O ranking ainda nao foi configurado. Aguarde um admin configurar.
        </p>
      )}
    </Layout>
  );
}
