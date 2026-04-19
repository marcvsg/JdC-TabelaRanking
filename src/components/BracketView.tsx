import { useMemo } from 'react';
import type { Championship, BracketMatch, Column, Participant } from '../lib/types';

interface BracketViewProps {
  championship: Championship;
  participants: Participant[];
  columns: Column[];
}

interface MatchWithWinner {
  match: BracketMatch;
  p1?: Participant & { score: number };
  p2?: Participant & { score: number };
  winnerId?: string;
}

export function BracketView({
  championship,
  participants,
  columns,
}: BracketViewProps) {
  const selectedColumns = useMemo(
    () =>
      columns
        .filter((c) => championship.phase2ColumnIds?.includes(c.id))
        .sort((a, b) => a.order - b.order),
    [columns, championship.phase2ColumnIds]
  );

  const matchesWithScores = useMemo(() => {
    if (!championship.bracket) return [];

    return championship.bracket.map((match) => {
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

      let winnerId: string | undefined;
      if (p1 && p2) {
        if (score2 > score1) winnerId = p2.id;
        else if (score1 > score2) winnerId = p1.id;
        else if (p1 && p2) {
          // Tiebreaker: última coluna
          const lastCol = selectedColumns[selectedColumns.length - 1];
          if (lastCol) {
            const s1 = p1.scores[lastCol.id] ?? 0;
            const s2 = p2.scores[lastCol.id] ?? 0;
            if (s2 > s1) winnerId = p2.id;
            else if (s1 > s2) winnerId = p1.id;
          }
        }
      }

      return {
        match,
        p1: p1 ? { ...p1, score: score1 } : undefined,
        p2: p2 ? { ...p2, score: score2 } : undefined,
        winnerId,
      } as MatchWithWinner;
    });
  }, [championship.bracket, participants, selectedColumns]);

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
                  <div className={`match-team ${m.p1 && m.winnerId === m.p1.id ? 'winner' : ''}`}>
                    {m.p1 ? (
                      <>
                        <span className="team-name">{m.p1.name}</span>
                        <span className="team-score">{m.p1.score}</span>
                      </>
                    ) : (
                      <span className="team-name">—</span>
                    )}
                  </div>
                  <div className="match-divider" />
                  <div className={`match-team ${m.p2 && m.winnerId === m.p2.id ? 'winner' : ''}`}>
                    {m.p2 ? (
                      <>
                        <span className="team-name">{m.p2.name}</span>
                        <span className="team-score">{m.p2.score}</span>
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
