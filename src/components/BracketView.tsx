import { useMemo } from 'react';
import type { Championship, BracketMatch, Column, Participant } from '../lib/types';

interface BracketViewProps {
  championship: Championship;
  participants: Participant[];
  columns: Column[];
  isAdmin: boolean;
  onUpdateMatchWinner?: (matchId: string, winnerId: string) => Promise<void>;
}

interface MatchWithWinner {
  match: BracketMatch;
  p1?: Participant & { score: number };
  p2?: Participant & { score: number };
  winnerId?: string;
}

import { useState } from 'react';

export function BracketView({
  championship,
  participants,
  columns,
  isAdmin,
  onUpdateMatchWinner,
}: BracketViewProps) {
  const [loadingMatchId, setLoadingMatchId] = useState<string | null>(null);
  const selectedColumns = useMemo(
    () =>
      columns
        .filter((c) => championship.phase2ColumnIds?.includes(c.id))
        .sort((a, b) => a.order - b.order),
    [columns, championship.phase2ColumnIds]
  );

  const hydratedBracket = useMemo(() => {
    if (!championship.bracket) return [];
    // Bracket já é preenchido manualmente pelo admin, não precisa hidratação automática
    return championship.bracket;
  }, [championship.bracket]);

  const matchesWithScores = useMemo(() => {
    if (!hydratedBracket) return [];

    return hydratedBracket.map((match) => {
      const p1 = match.participant1Id
        ? participants.find((p) => p.id === match.participant1Id)
        : undefined;
      const p2 = match.participant2Id
        ? participants.find((p) => p.id === match.participant2Id)
        : undefined;

      const score1 =
        p1 && selectedColumns
          ? selectedColumns.reduce((s, c) => s + (p1.scores[c.id] ?? 0), 0)
          : 0;
      const score2 =
        p2 && selectedColumns
          ? selectedColumns.reduce((s, c) => s + (p2.scores[c.id] ?? 0), 0)
          : 0;

      // Vencedor é definido manualmente pelo admin (stored em participant1Id)
      const winnerId = match.participant1Id;

      return {
        match,
        p1: p1 ? { ...p1, score: score1 } : undefined,
        p2: p2 ? { ...p2, score: score2 } : undefined,
        winnerId,
      } as MatchWithWinner;
    });
  }, [hydratedBracket, participants, selectedColumns]);

  const rounds = useMemo(() => {
    const roundMap = new Map<number, MatchWithWinner[]>();
    matchesWithScores.forEach((m) => {
      if (!roundMap.has(m.match.round)) {
        roundMap.set(m.match.round, []);
      }
      roundMap.get(m.match.round)!.push(m);
    });
    return Array.from(roundMap.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([, matches]) => matches);
  }, [matchesWithScores]);

  if (!championship.bracket || championship.bracket.length === 0) {
    return <p className="text-muted">Bracket não gerado ainda</p>;
  }

  return (
    <div className="bracket-container">
      <div className="bracket-rounds">
        {rounds.map((roundMatches, idx) => (
          <div key={idx} className="bracket-round">
            <h4 className="round-label">
              {getRoundLabel(roundMatches[0].match.round)}
            </h4>
            <div className="bracket-matches">
              {roundMatches.map((m, matchIdx) => (
                <div key={matchIdx} className="bracket-match">
                  <div
                    className={`match-team ${m.p1 && m.winnerId === m.p1.id ? 'winner' : ''} ${isAdmin && m.p1 && m.p2 ? 'clickable' : ''}`}
                    onClick={() => {
                      if (isAdmin && m.p1 && m.p2 && onUpdateMatchWinner && !loadingMatchId) {
                        setLoadingMatchId(m.match.id);
                        onUpdateMatchWinner(m.match.id, m.p1.id).finally(() =>
                          setLoadingMatchId(null)
                        );
                      }
                    }}
                  >
                    {m.p1 ? (
                      <>
                        <span className="team-name">{m.p1.name}</span>
                        <span className="team-score">{m.p1.score}</span>
                        {isAdmin && (
                          <button
                            className="btn-remove-participant"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onUpdateMatchWinner && !loadingMatchId) {
                                setLoadingMatchId(m.match.id);
                                onUpdateMatchWinner(m.match.id, '').finally(() =>
                                  setLoadingMatchId(null)
                                );
                              }
                            }}
                            title="Remover participante"
                          >
                            ✕
                          </button>
                        )}
                      </>
                    ) : (
                      <span className="team-name">—</span>
                    )}
                  </div>
                  <div className="match-divider" />
                  <div
                    className={`match-team ${m.p2 && m.winnerId === m.p2.id ? 'winner' : ''} ${isAdmin && m.p1 && m.p2 ? 'clickable' : ''}`}
                    onClick={() => {
                      if (isAdmin && m.p1 && m.p2 && onUpdateMatchWinner && !loadingMatchId) {
                        setLoadingMatchId(m.match.id);
                        onUpdateMatchWinner(m.match.id, m.p2.id).finally(() =>
                          setLoadingMatchId(null)
                        );
                      }
                    }}
                  >
                    {m.p2 ? (
                      <>
                        <span className="team-name">{m.p2.name}</span>
                        <span className="team-score">{m.p2.score}</span>
                        {isAdmin && (
                          <button
                            className="btn-remove-participant"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onUpdateMatchWinner && !loadingMatchId) {
                                setLoadingMatchId(m.match.id);
                                onUpdateMatchWinner(m.match.id, '').finally(() =>
                                  setLoadingMatchId(null)
                                );
                              }
                            }}
                            title="Remover participante"
                          >
                            ✕
                          </button>
                        )}
                      </>
                    ) : (
                      <span className="team-name">—</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bracket-columns-info">
        <p className="text-muted" style={{ fontSize: '0.875rem' }}>
          <strong>Etapas da Fase 2:</strong>{' '}
          {selectedColumns.map((c) => c.name).join(', ') || 'Nenhuma'}
        </p>
      </div>
    </div>
  );
}

function getRoundLabel(round: number): string {
  const labels: Record<number, string> = {
    1: 'Final',
    2: 'Semifinal',
    3: 'Quartas',
    4: 'Oitavas',
    5: '16ª',
    6: '32ª',
  };
  return labels[round] || `Rodada ${round}`;
}
