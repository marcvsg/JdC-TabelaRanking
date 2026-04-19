import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { useChampionships } from '../hooks/useChampionships';
import { useColumns } from '../hooks/useColumns';
import { useParticipants } from '../hooks/useParticipants';
import { Layout } from '../components/Layout';
import { GroupCard } from '../components/GroupCard';
import { StartPhase2Modal } from '../components/StartPhase2Modal';
import { BracketView } from '../components/BracketView';

export function ChampionshipDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { role } = useAuthContext();
  const { championships, updateGroupParticipants, startPhase2 } = useChampionships();
  const { columns } = useColumns();
  const { participants } = useParticipants();
  const navigate = useNavigate();
  const [showPhase2Modal, setShowPhase2Modal] = useState(false);

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

  const selectedColumns = columns
    .filter((c) => championship.columnIds.includes(c.id))
    .sort((a, b) => a.order - b.order);

  const currentPhase = championship.currentPhase ?? 1;

  const handleStartPhase2 = async (columnIds: string[]) => {
    // Calcular classificados de cada grupo
    const classifiedIds: string[] = [];
    for (const group of championship.groups) {
      // Ordenar participantes por pontuação
      const groupParticipants = participants.filter((p) =>
        group.participantIds.includes(p.id)
      );
      const sorted = [...groupParticipants].sort((a, b) => {
        const totalA = selectedColumns.reduce(
          (s, c) => s + (a.scores[c.id] ?? 0),
          0
        );
        const totalB = selectedColumns.reduce(
          (s, c) => s + (b.scores[c.id] ?? 0),
          0
        );
        if (totalB !== totalA) return totalB - totalA;
        // Tiebreaker
        const lastCol = selectedColumns[selectedColumns.length - 1];
        if (lastCol) {
          const scoreA = a.scores[lastCol.id] ?? 0;
          const scoreB = b.scores[lastCol.id] ?? 0;
          if (scoreB !== scoreA) return scoreB - scoreA;
        }
        return 0;
      });
      // Pegar os primeiros classifyCount
      for (let i = 0; i < championship.classifyCount && i < sorted.length; i++) {
        classifiedIds.push(sorted[i].id);
      }
    }
    await startPhase2(championship.id, columnIds, classifiedIds);
    setShowPhase2Modal(false);
  };

  return (
    <Layout>
      <div className="championship-detail-container">
        <div className="detail-header">
          <button onClick={() => navigate('/championships')} className="btn btn-link">
            ← Voltar
          </button>
          <h1>{championship.name}</h1>
        </div>

        {currentPhase === 1 && (
          <>
            <div className="phase-header">
              <h2>Fase 1 - Grupos</h2>
              {isAdmin && (
                <button
                  onClick={() => setShowPhase2Modal(true)}
                  className="btn btn-blue"
                >
                  🏆 Iniciar Mata-mata
                </button>
              )}
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
          </>
        )}

        {currentPhase === 2 && (
          <>
            <div className="phase-header">
              <h2>Fase 2 - Mata-mata</h2>
            </div>
            <BracketView
              championship={championship}
              participants={participants}
              columns={columns}
            />
          </>
        )}
      </div>

      {showPhase2Modal && (
        <StartPhase2Modal
          championship={championship}
          columns={selectedColumns}
          onStart={handleStartPhase2}
          onCancel={() => setShowPhase2Modal(false)}
        />
      )}
    </Layout>
  );
}
