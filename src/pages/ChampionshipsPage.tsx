import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { useChampionships } from '../hooks/useChampionships';
import { useColumns } from '../hooks/useColumns';
import { Layout } from '../components/Layout';
import { CreateChampionshipModal } from '../components/CreateChampionshipModal';

export function ChampionshipsPage() {
  const { role } = useAuthContext();
  const { championships, addChampionship, deleteChampionship } = useChampionships();
  const { columns } = useColumns();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  const isAdmin = role === 'admin';

  const handleCreateChampionship = async (
    name: string,
    columnIds: string[],
    groupCount: number,
    classifyCount: number
  ) => {
    await addChampionship(name, columnIds, groupCount, classifyCount);
    setShowModal(false);
  };

  return (
    <Layout>
      <div className="championships-container">
        <div className="page-header">
          <h1>Campeonatos</h1>
          {isAdmin && (
            <button
              onClick={() => setShowModal(true)}
              className="btn btn-blue"
            >
              ➕ Novo Campeonato
            </button>
          )}
        </div>

        {championships.length === 0 ? (
          <p className="empty-state">
            {isAdmin ? 'Nenhum campeonato criado ainda.' : 'Nenhum campeonato disponível.'}
          </p>
        ) : (
          <div className="championships-grid">
            {championships.map((championship) => (
              <div key={championship.id} className="championship-card">
                <h2>{championship.name}</h2>
                <div className="card-info">
                  <p>
                    <strong>Grupos:</strong> {championship.groups.length}
                  </p>
                  <p>
                    <strong>Classificam:</strong> {championship.classifyCount} por grupo
                  </p>
                  <p>
                    <strong>Etapas:</strong> {championship.columnIds.length}
                  </p>
                </div>
                <div className="card-actions">
                  <button
                    onClick={() => navigate(`/championships/${championship.id}`)}
                    className="btn btn-link"
                  >
                    Ver Chaves
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => deleteChampionship(championship.id)}
                      className="btn btn-danger"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <CreateChampionshipModal
          columns={columns}
          onCreate={handleCreateChampionship}
          onCancel={() => setShowModal(false)}
        />
      )}
    </Layout>
  );
}
