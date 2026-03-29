import { useAuthContext } from '../context/AuthContext';
import { useColumns } from '../hooks/useColumns';
import { useParticipants } from '../hooks/useParticipants';
import { Layout } from '../components/Layout';
import { CSVImporter } from '../components/CSVImporter';
import { useNavigate } from 'react-router-dom';

export function ImportPage() {
  const { role } = useAuthContext();
  const { columns } = useColumns();
  const { participants } = useParticipants();
  const navigate = useNavigate();

  if (role !== 'admin') {
    return (
      <Layout>
        <div className="error-section">
          <p>Apenas admins podem importar dados.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="import-page">
        <div className="import-header">
          <h2>Importar Dados via CSV</h2>
          <button onClick={() => navigate('/')} className="btn btn-secondary">
            ← Voltar
          </button>
        </div>

        <div className="import-instructions">
          <h3>Instruções</h3>
          <ul>
            <li>
              <strong>Primeira coluna:</strong> nome do participante
            </li>
            <li>
              <strong>Colunas seguintes:</strong> devem ter o mesmo nome dos
              eventos/colunas já criados
            </li>
            <li>
              <strong>Participantes duplicados:</strong> scores serão somados
            </li>
            <li>
              <strong>Formato:</strong> CSV simples (separado por vírgula)
            </li>
          </ul>

          <details className="example-csv">
            <summary>Ver exemplo de CSV</summary>
            <pre>
{`Nome,Evento 1,Evento 2,Desempate
Alice,10,20,5
Bob,15,25,8
Charlie,12,18,6`}
            </pre>
          </details>
        </div>

        {columns.length === 0 ? (
          <div className="warning-section">
            <p>⚠️ Crie pelo menos um evento (coluna) antes de importar.</p>
          </div>
        ) : (
          <CSVImporter
            columns={columns}
            participants={participants}
            onImportSuccess={() => navigate('/')}
          />
        )}
      </div>
    </Layout>
  );
}
