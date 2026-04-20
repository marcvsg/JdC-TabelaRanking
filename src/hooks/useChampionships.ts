import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Championship, ChampionshipGroup } from '../lib/types';

const COLLECTION = 'championships';

export function useChampionships() {
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, COLLECTION), (snap) => {
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Championship[];
      setChampionships(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function addChampionship(
    name: string,
    columnIds: string[],
    groupCount: number,
    classifyCount: number
  ) {
    const groups: ChampionshipGroup[] = Array.from({ length: groupCount }, (_, i) => ({
      id: `group_${String.fromCharCode(65 + i)}`,
      name: `Chave ${String.fromCharCode(65 + i)}`,
      participantIds: [],
    }));

    await addDoc(collection(db, COLLECTION), {
      name,
      columnIds,
      groups,
      classifyCount,
      currentPhase: 1,
      createdAt: Date.now(),
    });
  }

  async function deleteChampionship(id: string) {
    await deleteDoc(doc(db, COLLECTION, id));
  }

  async function updateChampionship(id: string, updates: Partial<Championship>) {
    await updateDoc(doc(db, COLLECTION, id), updates);
  }

  async function updateGroupParticipants(
    championshipId: string,
    groupId: string,
    participantIds: string[]
  ) {
    const championship = championships.find((c) => c.id === championshipId);
    if (!championship) return;

    const updatedGroups = championship.groups.map((g) =>
      g.id === groupId ? { ...g, participantIds } : g
    );
    await updateDoc(doc(db, COLLECTION, championshipId), { groups: updatedGroups });
  }

  async function startPhase2(
    championshipId: string,
    phase2ColumnIds: string[],
    classifiedParticipantIds: string[]
  ) {
    const championship = championships.find((c) => c.id === championshipId);
    if (!championship) return;

    const bracket = generateBracket(classifiedParticipantIds);

    await updateDoc(doc(db, COLLECTION, championshipId), {
      currentPhase: 2,
      phase2ColumnIds,
      bracket,
    });
  }

  async function updateMatchWinner(
    championshipId: string,
    matchId: string,
    winnerId: string
  ) {
    const championship = championships.find((c) => c.id === championshipId);
    if (!championship || !championship.bracket) return;

    const isRemoving = winnerId === '';

    // Atualizar match com winnerId
    let updatedBracket = championship.bracket.map((match) => {
      if (match.id === matchId) {
        return { ...match, participant1Id: winnerId || undefined };
      }
      return match;
    });

    // Propagar vencedor/remoção para próxima rodada
    const matchWithWinner = updatedBracket.find((m) => m.id === matchId);
    if (matchWithWinner) {
      const currentRound = matchWithWinner.round;
      const nextRound = currentRound - 1;
      const position = matchWithWinner.position;

      if (isRemoving) {
        // Remover de todas as rodadas subsequentes
        updatedBracket = updatedBracket.map((match) => {
          if (match.round < currentRound) {
            const matchesInRound = updatedBracket.filter((m) => m.round === match.round);
            let affectedPosition = Math.floor(position / 2);

            while (affectedPosition < matchesInRound.length && match.round < currentRound) {
              const affectedMatch = matchesInRound[affectedPosition];
              if (affectedMatch.id === match.id) {
                if (position % 2 === 0) {
                  return { ...match, participant1Id: undefined };
                } else {
                  return { ...match, participant2Id: undefined };
                }
              }
              affectedPosition = Math.floor(affectedPosition / 2);
            }
          }
          return match;
        });
      } else {
        // Propagar vencedor para próxima rodada
        updatedBracket = updatedBracket.map((match) => {
          if (match.round === nextRound) {
            const matchesInRound = updatedBracket.filter((m) => m.round === nextRound);
            const nextPosition = Math.floor(position / 2);
            if (nextPosition < matchesInRound.length) {
              const nextMatch = matchesInRound[nextPosition];
              if (nextMatch.id === match.id) {
                if (position % 2 === 0) {
                  return { ...match, participant1Id: winnerId };
                } else {
                  return { ...match, participant2Id: winnerId };
                }
              }
            }
          }
          return match;
        });
      }
    }

    await updateDoc(doc(db, COLLECTION, championshipId), {
      bracket: updatedBracket,
    });
  }

  return {
    championships,
    loading,
    addChampionship,
    deleteChampionship,
    updateChampionship,
    updateGroupParticipants,
    startPhase2,
    updateMatchWinner,
  };
}

function generateBracket(classifiedParticipantIds: string[]) {
  const classifieds = classifiedParticipantIds;

  // Começa em Oitavas (8 slots) no mínimo
  let n = classifieds.length;
  let pow = Math.max(3, Math.ceil(Math.log2(n)));
  const totalSlots = Math.pow(2, pow);

  // Padronizar para próxima potência de 2 (byes = undefined)
  const seeds: (string | undefined)[] = [...classifieds];
  while (seeds.length < totalSlots) seeds.push(undefined);

  // Gerar bracket (primeira rodada)
  const rounds = pow;
  const matches: any[] = [];
  let matchId = 0;

  for (let r = rounds; r >= 1; r--) {
    const matchesInRound = Math.pow(2, r - 1);
    for (let pos = 0; pos < matchesInRound; pos++) {
      if (r === rounds) {
        // Primeira rodada: pares de seeds
        const idx1 = pos * 2;
        const idx2 = pos * 2 + 1;
        matches.push({
          id: `match_${matchId++}`,
          round: r,
          position: pos,
          participant1Id: seeds[idx1],
          participant2Id: seeds[idx2],
        });
      } else {
        // Rodadas subsequentes: vazio (será preenchido com vencedores)
        matches.push({
          id: `match_${matchId++}`,
          round: r,
          position: pos,
        });
      }
    }
  }

  return matches as any[];
}
