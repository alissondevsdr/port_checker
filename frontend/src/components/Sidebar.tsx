import React, { useState } from "react";
import {
  Home,
  FolderTree,
  Users,
  Wrench,
  ChevronDown,
  ChevronRight,
  Monitor,
  FileText,
  FileBarChart2,
  Download,
} from "lucide-react";

const NAV = [
  {
    id: "home",
    label: "Início",
    icon: Home,
    sub: [],
  },
  {
    id: "port-checker",
    label: "Port Checker",
    icon: Wrench,
    sub: [
      { id: "groups", label: "Grupos", icon: FolderTree },
      { id: "clients", label: "Clientes", icon: Users },
    ],
  },
  {
    id: "remote-connections",
    label: "Conexão Remota",
    icon: Monitor,
    sub: [],
  },
  {
    id: "spreadsheet-cleaner",
    label: "Formatar Impostos",
    icon: FileText,
    sub: [],
  },
  {
    id: "manual-reports",
    label: "Rel. Manuais",
    icon: FileBarChart2,
    sub: [],
  },
  {
    id: "downloads",
    label: "Downloads",
    icon: Download,
    sub: [],
  },
];

interface Props {
  active: string;
  setActive: (id: string) => void;
}

const Sidebar: React.FC<Props> = ({ active, setActive }) => {
  const [expanded, setExpanded] = useState<string | null>("port-checker");
  return (
    <aside
      className="w-56 h-screen flex flex-col fixed left-0 top-0 z-40"
      style={{ background: "#000000", borderRight: "1px solid #333333" }}
    >
      {/* Logo */}
      <div
        onClick={() => setActive("home")}
        className="px-5 py-5 flex items-center gap-3 cursor-pointer"
        style={{ borderBottom: "1px solid #333333" }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: "#ed0c00" }}
        >
          <Wrench size={16} className="text-white" />
        </div>
        <div>
          <div className="text-white font-bold text-lg leading-none tracking-tight">
            Suporte HUB
          </div>
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
                <Icon
                  size={16}
                  style={{ color: active === id ? "#fff" : "#aaaaaa" }}
                />
                <span className="text-xs font-semibold uppercase tracking-widest flex-1">
                  {label}
                </span>
                {hasSub &&
                  (isExpanded ? (
                    <ChevronDown size={14} />
                  ) : (
                    <ChevronRight size={14} />
                  ))}
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
                          background: subOn ? "#ed0c00" : "transparent",
                          color: subOn ? "#fff" : "#cccccc",
                        }}
                        onMouseEnter={(e) => {
                          if (!subOn)
                            (e.currentTarget as HTMLElement).style.background =
                              "rgba(255,255,255,.04)";
                        }}
                        onMouseLeave={(e) => {
                          if (!subOn)
                            (e.currentTarget as HTMLElement).style.background =
                              "transparent";
                        }}
                      >
                        <SubIcon
                          size={14}
                          style={{ color: subOn ? "#fff" : "#aaaaaa" }}
                        />
                        <span className="text-xs font-semibold uppercase tracking-widest">
                          {subLabel}
                        </span>
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
