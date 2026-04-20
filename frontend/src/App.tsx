import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Groups from './views/Groups';
import Clients from './views/Clients';
import RemoteConnections from './views/RemoteConnections';
import SpreadsheetCleaner from './views/SpreadsheetCleaner';
import './index.css';

export default function App() {
  const [active, setActive] = useState('groups');

  return (
    <div className="min-h-screen flex" style={{ background: '#000000' }}>
      <Sidebar active={active} setActive={setActive} />
      <main className="flex-1 min-h-screen" style={{ marginLeft: 224 }}>
        <div className="max-w-5xl mx-auto px-8 py-8">
          {active === 'groups'  && <Groups />}
          {active === 'clients' && <Clients />}
          {active === 'remote-connections' && <RemoteConnections />}
          {active === 'spreadsheet-cleaner' && <SpreadsheetCleaner />}
        </div>
      </main>
    </div>
  );
}
