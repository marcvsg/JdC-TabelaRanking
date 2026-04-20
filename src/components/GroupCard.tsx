import { useState, useMemo } from 'react';
import type { Championship, ChampionshipGroup, Column, Participant } from '../lib/types';

interface GroupCardProps {
  group: ChampionshipGroup;
  championship: Championship;
  participants: Participant[];
  columns: Column[];
  isAdmin: boolean;
  onUpdateParticipants: (participantIds: string[]) => Promise<void>;
}

interface Standing {
  participant: Participant;
  total: number;
  scores: number[];
  position: number;
  isClassified: boolean;
}

export function GroupCard({
  group,
  championship,
  participants,
  columns,
  isAdmin,
  onUpdateParticipants,
}: GroupCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedParticipantIds, setSelectedParticipantIds] = useState(
    group.participantIds
  );

  const standings = useMemo(() => {
    const groupParticipants = participants.filter((p) =>
      group.participantIds.includes(p.id)
    );

    const standings: Standing[] = groupParticipants
      .map((participant) => {
        const scores = columns.map((col) => participant.scores[col.id] ?? 0);
        const total = scores.reduce((s, v) => s + v, 0);
        return {
          participant,
          total,
          scores,
          position: 0,
          isClassified: false,
        };
      })
      .sort((a, b) => {
        if (b.total !== a.total) return b.total - a.total;
        // Tiebreaker: most recent column
        const recentCol = columns[columns.length - 1];
        if (recentCol) {
          const scoreA = a.participant.scores[recentCol.id] ?? 0;
          const scoreB = b.participant.scores[recentCol.id] ?? 0;
          if (scoreB !== scoreA) return scoreB - scoreA;
        }
        return 0;
      })
      .map((standing, idx) => ({
        ...standing,
        position: idx + 1,
        isClassified: idx < championship.classifyCount,
      }));

    return standings;
  }, [group.participantIds, participants, columns, championship.classifyCount]);

  const handleSaveParticipants = async () => {
    await onUpdateParticipants(selectedParticipantIds);
    setIsEditing(false);
  };

  const allParticipants = participants;

  const toggleParticipant = (id: string) => {
    setSelectedParticipantIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  return (
    <div className="group-card">
      <div className="group-header">
        <h3>{group.name}</h3>
        {isAdmin && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="btn btn-sm btn-link"
          >
            ✎ Editar
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="group-edit">
          <div className="participants-selector">
            <label className="form-label">Selecione os participantes para esta chave:</label>
            <div className="checkbox-group">
              {allParticipants.map((p) => {
                const inOtherGroup = championship.groups.some(
                  (g) =>
                    g.id !== group.id &&
                    g.participantIds.includes(p.id)
                );
                const isSelected = selectedParticipantIds.includes(p.id);
                return (
                  <label
                    key={p.id}
                    className={`checkbox-item ${inOtherGroup && !isSelected ? 'disabled' : ''}`}
                    title={inOtherGroup && !isSelected ? `Já está em outra chave` : ''}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleParticipant(p.id)}
                      disabled={inOtherGroup && !isSelected}
                    />
                    {p.name}
                    {inOtherGroup && !isSelected && (
                      <span className="text-muted" style={{ fontSize: '0.75rem', marginLeft: '4px' }}>
                        (já está em outro grupo)
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
          <div className="edit-actions">
            <button
              onClick={() => setIsEditing(false)}
              className="btn btn-sm btn-gray"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveParticipants}
              className="btn btn-sm btn-blue"
            >
              Salvar
            </button>
          </div>
        </div>
      ) : (
        <div className="group-standings">
          {standings.length === 0 ? (
            <p className="text-muted">Nenhum participante nesta chave</p>
          ) : (
            <table className="standings-table">
              <thead>
                <tr>
                  <th>Pos</th>
                  <th>Participante</th>
                  {columns.map((col) => (
                    <th key={col.id} className="col-score">{col.name}</th>
                  ))}
                  <th className="col-total">Total</th>
                  <th className="col-status">Situação</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((standing, idx) => {
                  const prevTotal = idx > 0 ? standings[idx - 1].total : null;
                  const isDraw = prevTotal !== null && standing.total === prevTotal;
                  return (
                    <tr key={standing.participant.id} className={standing.isClassified ? 'classified' : ''}>
                      <td className="pos">{standing.position}</td>
                      <td>{standing.participant.name}</td>
                      {standing.scores.map((score, idx) => (
                        <td key={idx} className="col-score">{score}</td>
                      ))}
                      <td className="col-total">
                        <strong>{standing.total}</strong>
                      </td>
                      <td className="col-status">
                        {isDraw ? (
                          <span className="badge badge-draw">⚔️ Empate</span>
                        ) : standing.isClassified ? (
                          <span className="badge badge-success">Classificado</span>
                        ) : (
                          <span className="badge badge-danger">Eliminado</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
