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
import type { Championship, Participant, Column, BracketMatch } from '../lib/types';

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
              <div className="phase-actions">
                <button
                  onClick={() => exportGroupsCSV(championship, participants, selectedColumns)}
                  className="btn btn-green"
                >
                  📥 Exportar
                </button>
                {isAdmin && (
                  <button
                    onClick={() => setShowPhase2Modal(true)}
                    className="btn btn-blue"
                  >
                    🏆 Iniciar Mata-mata
                  </button>
                )}
              </div>
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
              <div className="phase-actions">
                <button
                  onClick={() => exportBracketCSV(championship, participants, columns)}
                  className="btn btn-green"
                >
                  📥 Exportar
                </button>
              </div>
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

function exportGroupsCSV(
  championship: Championship,
  participants: Participant[],
  columns: Column[]
) {
  const lines: string[] = [];
  lines.push(`"${championship.name}","Fase 1 - Grupos"`);
  lines.push('');

  championship.groups.forEach((group: any) => {
    lines.push(`"${group.name}"`);

    // Calcular standings
    const groupParticipants = participants.filter((p) =>
      group.participantIds.includes(p.id)
    );
    const standings = [...groupParticipants]
      .sort((a, b) => {
        const totalA = columns.reduce((s, c) => s + (a.scores[c.id] ?? 0), 0);
        const totalB = columns.reduce((s, c) => s + (b.scores[c.id] ?? 0), 0);
        if (totalB !== totalA) return totalB - totalA;
        const lastCol = columns[columns.length - 1];
        if (lastCol) {
          const scoreA = a.scores[lastCol.id] ?? 0;
          const scoreB = b.scores[lastCol.id] ?? 0;
          if (scoreB !== scoreA) return scoreB - scoreA;
        }
        return 0;
      })
      .map((p, idx) => ({
        position: idx + 1,
        name: p.name,
        scores: columns.map((c) => p.scores[c.id] ?? 0),
        total: columns.reduce((s, c) => s + (p.scores[c.id] ?? 0), 0),
        isClassified: idx < championship.classifyCount,
      }));

    // Header
    const header = ['Pos', 'Participante', ...columns.map((c) => c.name), 'Total', 'Status'];
    lines.push(header.map((h) => `"${h}"`).join(','));

    // Rows
    standings.forEach((standing) => {
      const row = [
        standing.position,
        standing.name,
        ...standing.scores,
        standing.total,
        standing.isClassified ? 'Classificado' : 'Eliminado',
      ];
      lines.push((row as (string | number)[]).map((v) => `"${v}"`).join(','));
    });

    lines.push('');
  });

  const csv = lines.join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${championship.name}-grupos.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function exportBracketCSV(
  championship: Championship,
  participants: Participant[],
  columns: Column[]
) {
  const phase2Columns = columns.filter((c) =>
    championship.phase2ColumnIds?.includes(c.id)
  );

  const lines: string[] = [];
  lines.push(`"${championship.name}","Mata-mata"`);
  lines.push('');

  // Header
  const header = ['Rodada', 'Posição', 'Participante 1', 'Score 1', 'Participante 2', 'Score 2', 'Vencedor'];
  lines.push(header.map((h) => `"${h}"`).join(','));

  // Matches
  if (championship.bracket) {
    const getRoundLabel = (round: number) => {
      const labels: Record<number, string> = {
        1: 'Final',
        2: 'Semifinal',
        3: 'Quartas',
        4: 'Oitavas',
        5: '16ª',
        6: '32ª',
      };
      return labels[round] || `Rodada ${round}`;
    };

    const matchesByRound = new Map<number, any[]>();
    championship.bracket.forEach((match: BracketMatch) => {
      if (!matchesByRound.has(match.round)) {
        matchesByRound.set(match.round, []);
      }
      matchesByRound.get(match.round)!.push(match);
    });

    const sortedRounds = Array.from(matchesByRound.keys()).sort((a, b) => b[0] - a[0]);

    sortedRounds.forEach((round) => {
      const matches = matchesByRound.get(round) || [];
      matches.forEach((match, idx) => {
        const p1 = match.participant1Id
          ? participants.find((p) => p.id === match.participant1Id)
          : null;
        const p2 = match.participant2Id
          ? participants.find((p) => p.id === match.participant2Id)
          : null;

        const score1 =
          p1 && phase2Columns
            ? phase2Columns.reduce((s, c) => s + (p1.scores[c.id] ?? 0), 0)
            : 0;
        const score2 =
          p2 && phase2Columns
            ? phase2Columns.reduce((s, c) => s + (p2.scores[c.id] ?? 0), 0)
            : 0;

        let winner = '';
        if (p1 && p2) {
          if (score2 > score1) winner = p2.name;
          else if (score1 > score2) winner = p1.name;
        }

        const row = [
          getRoundLabel(round),
          idx + 1,
          p1?.name || '—',
          score1,
          p2?.name || '—',
          score2,
          winner,
        ];
        lines.push((row as (string | number)[]).map((v) => `"${v}"`).join(','));
      });
    });
  }

  const csv = lines.join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${championship.name}-bracket.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
