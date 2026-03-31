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
import type { Participant } from '../lib/types';

const COLLECTION = 'participants';

export function useParticipants() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, COLLECTION), (snap) => {
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Participant[];
      setParticipants(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function addParticipant(name: string) {
    const normalizedName = name.toLowerCase();
    const exists = participants.some(p => p.name.toLowerCase() === normalizedName);

    if (exists) {
      throw new Error(`Participante "${name}" já existe na lista`);
    }

    await addDoc(collection(db, COLLECTION), {
      name,
      scores: {},
      createdAt: Date.now(),
    });
  }

  async function removeParticipant(id: string) {
    await deleteDoc(doc(db, COLLECTION, id));
  }

  async function updateParticipantName(id: string, name: string) {
    await updateDoc(doc(db, COLLECTION, id), { name });
  }

  async function updateScore(
    participantId: string,
    columnId: string,
    value: number
  ) {
    await updateDoc(doc(db, COLLECTION, participantId), {
      [`scores.${columnId}`]: value,
    });
  }

  return {
    participants,
    loading,
    addParticipant,
    removeParticipant,
    updateParticipantName,
    updateScore,
  };
}
