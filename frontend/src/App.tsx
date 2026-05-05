import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Home from './views/Home';
import Groups from './views/Groups';
import RemoteConnections from './views/RemoteConnections';
import SpreadsheetCleaner from './views/SpreadsheetCleaner';
import ManualReports from './views/ManualReports';
import Downloads from './views/Downloads';
import Atendimentos from './views/Atendimentos';
import Dashboard from './views/Dashboard';
import ConfiguracoesGerais from './views/ConfiguracoesGerais';
import RelatoriosAtendimentos from './views/RelatoriosAtendimentos';
import AtendimentoDetail from './views/AtendimentoDetail';
import DashboardTV from './views/DashboardTV';
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

  if (active === 'dashboard-tv') {
    return (
      <div className="bg-black min-h-screen">
        <button 
          onClick={() => setActive('atendimentos')}
          className="fixed top-4 right-4 z-[9999] bg-white/5 hover:bg-white/10 text-gray-500 hover:text-white p-2 rounded-lg border border-white/10 transition-all opacity-0 hover:opacity-100"
        >
          Sair do Modo TV
        </button>
        <DashboardTV />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#000000' }}>
      <Sidebar active={active} setActive={setActive} onLogout={handleLogout} />
      <main className="flex-1 min-h-screen min-w-0" style={{ marginLeft: 64 }}>
        <div className="w-full px-8 py-8">
          {active === 'home' && <Home setActive={setActive} />}
          {active === 'dashboard' && <Dashboard />}
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
          {active === 'relatorios' && <RelatoriosAtendimentos />}
          {active === 'atendimento-configs' && <ConfiguracoesGerais />}
        </div>
      </main>
    </div>
  );
}
