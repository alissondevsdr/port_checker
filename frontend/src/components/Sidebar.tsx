import React, { useState } from 'react';
import { FolderTree, Users, Wrench, ChevronDown, ChevronRight } from 'lucide-react';

const NAV = [
  { id: 'port-checker', label: 'Port Checker', icon: Wrench, sub: [
    { id: 'groups', label: 'Grupos', icon: FolderTree },
    { id: 'clients', label: 'Clientes', icon: Users },
  ] },
];

interface Props { active: string; setActive: (id: string) => void; }

const Sidebar: React.FC<Props> = ({ active, setActive }) => {
  const [expanded, setExpanded] = useState<string | null>('port-checker');
  return (
    <aside className="w-56 h-screen flex flex-col fixed left-0 top-0 z-40" style={{ background: '#0e0e16', borderRight: '1px solid #25253a' }}>

    {/* Logo */}
    <div className="px-5 py-5 flex items-center gap-3" style={{ borderBottom: '1px solid #1e1e2e' }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#2563eb' }}>
        <Wrench size={16} className="text-white" />
      </div>
      <div>
        <div className="text-white font-bold text-sm leading-none tracking-tight">
          Ferramentas do Suporte
        </div>
        <div className="text-xs mt-0.5 font-mono" style={{ color: '#3a3a5a' }}>painel</div>
      </div>
    </div>

    {/* Nav */}
    <nav className="flex-1 p-3 flex flex-col gap-1 mt-2">
      {NAV.map(({ id, label, icon: Icon, sub }) => {
        const isExpanded = expanded === id;
        const hasSub = sub && sub.length > 0;
        return (
          <div key={id}>
            <button
              onClick={() => {
                if (hasSub) {
                  setExpanded(isExpanded ? null : id);
                } else {
                  setActive(id);
                }
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all"
              style={{
                background: active === id ? '#2563eb' : 'transparent',
                color: active === id ? '#fff' : '#64748b',
              }}
              onMouseEnter={e => { if (active !== id) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.04)'; }}
              onMouseLeave={e => { if (active !== id) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <Icon size={16} style={{ color: active === id ? '#fff' : '#475569' }} />
              <span className="text-xs font-semibold uppercase tracking-widest flex-1">{label}</span>
              {hasSub && (
                isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
              )}
            </button>
            {hasSub && isExpanded && (
              <div className="ml-6 mt-1 flex flex-col gap-1">
                {sub.map(({ id: subId, label: subLabel, icon: SubIcon }) => {
                  const subOn = active === subId;
                  return (
                    <button
                      key={subId}
                      onClick={() => setActive(subId)}
                      className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-left transition-all"
                      style={{
                        background: subOn ? '#2563eb' : 'transparent',
                        color: subOn ? '#fff' : '#64748b',
                      }}
                      onMouseEnter={e => { if (!subOn) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.04)'; }}
                      onMouseLeave={e => { if (!subOn) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                    >
                      <SubIcon size={14} style={{ color: subOn ? '#fff' : '#475569' }} />
                      <span className="text-xs font-semibold uppercase tracking-widest">{subLabel}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>

  </aside>
  );
};

export default Sidebar;
