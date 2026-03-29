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

  return (
    <Layout>
      {isAdmin && (
        <div className="admin-controls">
          <div className="admin-controls-form">
            <AddParticipantForm onAdd={addParticipant} />
          </div>
          <AddColumnButton onAdd={addColumn} />
          <button onClick={() => navigate('/import')} className="btn btn-blue">
            📥 Importar CSV
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
