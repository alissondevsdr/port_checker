import React from "react";
import { FolderTree, Users, Monitor, FileText, FileBarChart2, Wrench, Download } from "lucide-react";

type ServiceButton = {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
};

const SERVICES: ServiceButton[] = [
  {
    id: "groups",
    title: "Grupos",
    description: "Gerencie grupos do Port Checker.",
    icon: FolderTree,
  },
  {
    id: "clients",
    title: "Clientes",
    description: "Cadastre e acompanhe os clientes monitorados.",
    icon: Users,
  },
  {
    id: "remote-connections",
    title: "Conexão Remota",
    description: "Organize conexões remotas por empresa.",
    icon: Monitor,
  },
  {
    id: "spreadsheet-cleaner",
    title: "Formatar Impostos",
    description: "Padronize planilhas para importação.",
    icon: FileText,
  },
  {
    id: "manual-reports",
    title: "Relatórios Manuais",
    description: "Crie e consulte relatórios manuais.",
    icon: FileBarChart2,
  },
  {
    id: "downloads",
    title: "Downloads",
    description: "Baixe utilitários internos usados no suporte.",
    icon: Download,
  },
];

interface HomeProps {
  setActive: (id: string) => void;
}

const Home: React.FC<HomeProps> = ({ setActive }) => {
  return (
    <div className="fade-up">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-23 h-23 rounded-[23px] flex items-center justify-center flex-shrink-0 mr-4" style={{ background: "rgb(237, 12, 0)" }}>
            <Wrench size={55} className="text-white" />
          </div>
          <h1 className="text-5xl font-bold text-white">Suporte HUB</h1>
        </div>
        <p className="text-md mt-2" style={{ color: "#94a3b8" }}>
          Esta plataforma centraliza utilitários internos para agilizar atendimento,<br/>
          validações técnicas e rotinas operacionais da equipe.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SERVICES.map(({ id, title, description, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActive(id)}
            className="text-left p-4 rounded-xl transition-all"
            style={{
              border: "1px solid #333333",
              background: "#090909",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#111111";
              (e.currentTarget as HTMLElement).style.borderColor = "#444444";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#090909";
              (e.currentTarget as HTMLElement).style.borderColor = "#333333";
            }}
          >
            <div className="flex items-center gap-3 mb-2 cursor-pointer">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(237, 12, 0, 0.14)" }}
              >
                <Icon size={16} style={{ color: "#ed0c00" }} />
              </div>
              <h3 className="text-sm font-bold text-white">{title}</h3>
            </div>
            <p className="text-xs" style={{ color: "#94a3b8" }}>
              {description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Home;
