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

  const hydratedBracket = useMemo(() => {
    if (!championship.bracket) return [];

    // Copiar bracket e preencher matches subsequentes com vencedores
    const bracket = championship.bracket.map((m) => ({ ...m }));

    // Agrupar por round
    const roundMap = new Map<number, typeof bracket>();
    bracket.forEach((match) => {
      if (!roundMap.has(match.round)) {
        roundMap.set(match.round, []);
      }
      roundMap.get(match.round)!.push(match);
    });

    // Processar de baixo para cima (primeira rodada → final)
    const sortedRounds = Array.from(roundMap.keys()).sort((a, b) => b - a);

    for (let i = 0; i < sortedRounds.length - 1; i++) {
      const currentRound = sortedRounds[i];
      const nextRound = sortedRounds[i + 1];
      const currentMatches = roundMap.get(currentRound) || [];
      const nextMatches = roundMap.get(nextRound) || [];

      // Calcular vencedores da rodada atual e preencher próxima
      currentMatches.forEach((match, idx) => {
        const result = getMatchResult(match, participants, selectedColumns);
        if (result.winnerId && nextMatches[Math.floor(idx / 2)]) {
          const nextMatch = nextMatches[Math.floor(idx / 2)];
          if (idx % 2 === 0) {
            nextMatch.participant1Id = result.winnerId;
          } else {
            nextMatch.participant2Id = result.winnerId;
          }
        }
      });
    }

    return bracket;
  }, [championship.bracket, participants, selectedColumns]);

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

      const result = getMatchResult(match, participants, selectedColumns);

      return {
        match,
        p1: p1 ? { ...p1, score: score1 } : undefined,
        p2: p2 ? { ...p2, score: score2 } : undefined,
        winnerId: result.winnerId,
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

function getMatchResult(
  match: BracketMatch,
  participants: Participant[],
  selectedColumns: Column[]
): { winnerId?: string } {
  const p1 = match.participant1Id
    ? participants.find((p) => p.id === match.participant1Id)
    : undefined;
  const p2 = match.participant2Id
    ? participants.find((p) => p.id === match.participant2Id)
    : undefined;

  if (!p1 || !p2) return {};

  const score1 = selectedColumns.reduce(
    (s, c) => s + (p1.scores[c.id] ?? 0),
    0
  );
  const score2 = selectedColumns.reduce(
    (s, c) => s + (p2.scores[c.id] ?? 0),
    0
  );

  if (score2 > score1) return { winnerId: p2.id };
  if (score1 > score2) return { winnerId: p1.id };

  // Tiebreaker: última coluna
  const lastCol = selectedColumns[selectedColumns.length - 1];
  if (lastCol) {
    const s1 = p1.scores[lastCol.id] ?? 0;
    const s2 = p2.scores[lastCol.id] ?? 0;
    if (s2 > s1) return { winnerId: p2.id };
    if (s1 > s2) return { winnerId: p1.id };
  }

  return {};
}
