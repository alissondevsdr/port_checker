import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Home from './views/Home';
import Groups from './views/Groups';
import RemoteConnections from './views/RemoteConnections';
import SpreadsheetCleaner from './views/SpreadsheetCleaner';
import ManualReports from './views/ManualReports';
import Downloads from './views/Downloads';
import Atendimentos from './views/Atendimentos';
import AtendimentoConfigs from './views/AtendimentoConfigs';
import AtendimentoDetail from './views/AtendimentoDetail';
import Login from './views/Login';
import './index.css';

export default function App() {
  const [active, setActive] = useState('home');
  const [selectedAtendimentoId, setSelectedAtendimentoId] = useState<number | null>(null);
  const [, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setInitialized(true);
  }, []);

  const handleLoginSuccess = (userData: any, userToken: string) => {
    setUser(userData);
    setToken(userToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
    setActive('home');
  };

  if (!initialized) return null;

  if (!token) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#000000' }}>
      <Sidebar active={active} setActive={setActive} onLogout={handleLogout} />
      <main className="flex-1 min-h-screen" style={{ marginLeft: 224 }}>
        <div className="max-w-5xl mx-auto px-8 py-8">
          {active === 'home' && <Home setActive={setActive} />}
          {active === 'port-checker' && <Groups />}
          {active === 'remote-connections' && <RemoteConnections />}
          {active === 'spreadsheet-cleaner' && <SpreadsheetCleaner />}
          {active === 'manual-reports' && <ManualReports />}
          {active === 'downloads' && <Downloads />}
          {active === 'atendimentos' && (
            selectedAtendimentoId ? (
              <AtendimentoDetail 
                atendimentoId={selectedAtendimentoId} 
                onBack={() => setSelectedAtendimentoId(null)} 
              />
            ) : (
              <Atendimentos onSelectAtendimento={setSelectedAtendimentoId} />
            )
          )}
          {active === 'atendimento-configs' && <AtendimentoConfigs />}
        </div>
      </main>
    </div>
  );
}
