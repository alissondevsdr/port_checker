import React from "react";
import {
  Home,
  Wrench,
  Monitor,
  FileText,
  FileBarChart2,
  Download,
  LogOut,
  Headphones,
  Settings,
  BarChart2,
} from "lucide-react";

const NAV = [
  {
    id: "home",
    label: "Início",
    icon: Home,
  },
  {
    id: "dashboard",
    label: "Dashboard",
    icon: BarChart2,
  },
  {
    id: "atendimentos",
    label: "Atendimentos",
    icon: Headphones,
  },
  {
    id: "relatorios",
    label: "Relatórios",
    icon: BarChart2,
  },
  {
    id: "port-checker",
    label: "Verificar Portas",
    icon: Wrench,
  },
  {
    id: "remote-connections",
    label: "Conexão Remota",
    icon: Monitor,
  },
  {
    id: "spreadsheet-cleaner",
    label: "Formatar Impostos",
    icon: FileText,
  },
  {
    id: "manual-reports",
    label: "Relatórios Manuais",
    icon: FileBarChart2,
  },
  {
    id: "downloads",
    label: "Downloads",
    icon: Download,
  },
  {
    id: "atendimento-configs",
    label: "Configurações",
    icon: Settings,
  },
];

interface Props {
  active: string;
  setActive: (id: string) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<Props> = ({ active, setActive, onLogout }) => {
  const currentUser = React.useMemo(() => {
    const userJson = localStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
  }, []);

  const isAdmin = currentUser?.role === 'ADMINISTRADOR';

  return (
    <aside
      className="w-16 hover:w-56 h-screen flex flex-col fixed left-0 top-0 z-40 transition-all duration-300 group overflow-x-hidden"
      style={{ background: "#000000", borderRight: "1px solid #333333" }}
    >
      {/* Logo */}
      <div
        onClick={() => setActive("home")}
        className="px-4 py-5 flex items-center gap-3 cursor-pointer"
        style={{ borderBottom: "1px solid #333333" }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: "#ed0c00" }}
        >
          <Wrench size={16} className="text-white" />
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="text-white font-bold text-lg leading-none tracking-tight whitespace-nowrap">
            Suporte HUB
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 flex flex-col gap-1 mt-2">
        {NAV.map(({ id, label, icon: Icon }) => {
          if (!isAdmin && (id === 'atendimento-configs' || id === 'relatorios')) {
            return null;
          }
          return (
            <div key={id}>
              <button
                onClick={() => setActive(id)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all overflow-hidden"
                style={{
                  background: active === id ? "#ed0c00" : "transparent",
                  color: active === id ? "#fff" : "#cccccc",
                }}
                onMouseEnter={(e) => {
                  if (active !== id)
                    (e.currentTarget as HTMLElement).style.background =
                      "rgba(255,255,255,.04)";
                }}
                onMouseLeave={(e) => {
                  if (active !== id)
                    (e.currentTarget as HTMLElement).style.background =
                      "transparent";
                }}
              >
                <div className="flex-shrink-0">
                  <Icon
                    size={16}
                    style={{ color: active === id ? "#fff" : "#aaaaaa" }}
                  />
                </div>
                <span className="text-xs font-semibold uppercase tracking-widest flex-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                  {label}
                </span>
              </button>
            </div>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-2" style={{ borderTop: "1px solid #333333" }}>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all text-[#cccccc] hover:bg-red-500/10 hover:text-red-500 overflow-hidden"
        >
          <div className="flex-shrink-0">
            <LogOut size={16} />
          </div>
          <span className="text-xs font-semibold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            Sair
          </span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
