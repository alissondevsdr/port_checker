import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Home from './views/Home';
import Groups from './views/Groups';
import Clients from './views/Clients';
import RemoteConnections from './views/RemoteConnections';
import SpreadsheetCleaner from './views/SpreadsheetCleaner';
import ManualReports from './views/ManualReports';
import Downloads from './views/Downloads';
import './index.css';

export default function App() {
  const [active, setActive] = useState('home');

  return (
    <div className="min-h-screen flex" style={{ background: '#000000' }}>
      <Sidebar active={active} setActive={setActive} />
      <main className="flex-1 min-h-screen" style={{ marginLeft: 224 }}>
        <div className="max-w-5xl mx-auto px-8 py-8">
          {active === 'home' && <Home setActive={setActive} />}
          {active === 'groups'  && <Groups />}
          {active === 'clients' && <Clients />}
          {active === 'remote-connections' && <RemoteConnections />}
          {active === 'spreadsheet-cleaner' && <SpreadsheetCleaner />}
          {active === 'manual-reports' && <ManualReports />}
          {active === 'downloads' && <Downloads />}
        </div>
      </main>
    </div>
  );
}
