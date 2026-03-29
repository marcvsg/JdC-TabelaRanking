import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Column } from '../lib/types';

const CONFIG_REF = doc(db, 'config', 'settings');

export function useColumns() {
  const [columns, setColumns] = useState<Column[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(CONFIG_REF, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setColumns((data.columns as Column[]) || []);
      } else {
        setColumns([]);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function addColumn(name: string) {
    const maxOrder = columns.reduce((max, c) => Math.max(max, c.order), -1);
    const newCol: Column = {
      id: `col_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name,
      order: maxOrder + 1,
    };
    const updated = [...columns, newCol];

    if (columns.length === 0) {
      await setDoc(CONFIG_REF, { columns: updated });
    } else {
      await updateDoc(CONFIG_REF, { columns: updated });
    }
  }

  async function removeColumn(colId: string) {
    const updated = columns.filter((c) => c.id !== colId);
    await updateDoc(CONFIG_REF, { columns: updated });
  }

  async function renameColumn(colId: string, newName: string) {
    const updated = columns.map((c) =>
      c.id === colId ? { ...c, name: newName } : c
    );
    await updateDoc(CONFIG_REF, { columns: updated });
  }

  return { columns, loading, addColumn, removeColumn, renameColumn };
}
