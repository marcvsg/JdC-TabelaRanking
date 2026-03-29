import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { UserRole } from '../lib/types';

interface UserEntry {
  id: string;
  email: string;
  role: UserRole;
}

export function AdminUserManager({ currentUid }: { currentUid: string }) {
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const unsubscribe = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(
        snap.docs.map((d) => ({
          id: d.id,
          email: d.data().email,
          role: d.data().role as UserRole,
        }))
      );
    });
    return unsubscribe;
  }, [open]);

  async function toggleRole(uid: string, currentRole: UserRole) {
    const newRole: UserRole = currentRole === 'admin' ? 'viewer' : 'admin';
    await updateDoc(doc(db, 'users', uid), { role: newRole });
  }

  return (
    <div>
      <button onClick={() => setOpen(!open)} className="btn-link">
        {open ? 'Fechar Gerenciar Usuarios' : 'Gerenciar Usuarios'}
      </button>

      {open && (
        <div className="user-manager-panel">
          <h3 className="user-manager-title">Usuarios</h3>
          <div className="user-list">
            {users.map((u) => (
              <div key={u.id} className="user-row">
                <span className="user-email">{u.email}</span>
                <div className="user-row-right">
                  <span
                    className={`badge ${u.role === 'admin' ? 'badge-admin' : 'badge-viewer'}`}
                  >
                    {u.role}
                  </span>
                  {u.id !== currentUid && (
                    <button
                      onClick={() => toggleRole(u.id, u.role)}
                      className="role-toggle-btn"
                    >
                      {u.role === 'admin' ? 'Tornar viewer' : 'Tornar admin'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
