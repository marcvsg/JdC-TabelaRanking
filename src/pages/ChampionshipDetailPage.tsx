import { useParams, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { useChampionships } from '../hooks/useChampionships';
import { useColumns } from '../hooks/useColumns';
import { useParticipants } from '../hooks/useParticipants';
import { Layout } from '../components/Layout';
import { GroupCard } from '../components/GroupCard';

export function ChampionshipDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { role } = useAuthContext();
  const { championships, updateGroupParticipants } = useChampionships();
  const { columns } = useColumns();
  const { participants } = useParticipants();
  const navigate = useNavigate();

  const isAdmin = role === 'admin';
  const championship = championships.find((c) => c.id === id);

  if (!championship) {
    return (
      <Layout>
        <div className="container">
          <p>Campeonato não encontrado.</p>
          <button onClick={() => navigate('/championships')} className="btn btn-link">
            Voltar
          </button>
        </div>
      </Layout>
    );
  }

  const selectedColumns = columns.filter((c) => championship.columnIds.includes(c.id))
    .sort((a, b) => a.order - b.order);

  return (
    <Layout>
      <div className="championship-detail-container">
        <div className="detail-header">
          <button onClick={() => navigate('/championships')} className="btn btn-link">
            ← Voltar
          </button>
          <h1>{championship.name}</h1>
        </div>

        <div className="groups-grid">
          {championship.groups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              championship={championship}
              participants={participants}
              columns={selectedColumns}
              isAdmin={isAdmin}
              onUpdateParticipants={(participantIds) =>
                updateGroupParticipants(championship.id, group.id, participantIds)
              }
            />
          ))}
        </div>
      </div>
    </Layout>
  );
}
