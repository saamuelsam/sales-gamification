import { useState } from "react";
import { AdminReportsPage } from "./AdminReportsPage";
import { AdminConfigPage } from "./AdminConfigPage";
import { AdminNotificationsPage } from "./AdminNotificationsPage";
import { AdminLogsPage } from "./AdminLogsPage";
import { AdminAccessLogsPage } from "./AdminAccessLogsPage";

export function AdminPage() {
  const [tab, setTab] = useState<"reports" | "config" | "notifications" | "logs" | "access">("reports");

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between mb-6 border-b pb-3">
        <h1 className="text-2xl font-bold text-gray-900">Painel Administrativo</h1>
        <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
          <button
            onClick={() => setTab("reports")}
            className={`px-4 py-2 rounded-md text-sm font-medium ${tab === "reports" ? "bg-blue-600 text-white" : "bg-white border"}`}
          >
            Relatórios
          </button>
          <button
            onClick={() => setTab("config")}
            className={`px-4 py-2 rounded-md text-sm font-medium ${tab === "config" ? "bg-blue-600 text-white" : "bg-white border"}`}
          >
            Configurações
          </button>
          <button
            onClick={() => setTab("notifications")}
            className={`px-4 py-2 rounded-md text-sm font-medium ${tab === "notifications" ? "bg-blue-600 text-white" : "bg-white border"}`}
          >
            Notificações
          </button>
          <button
            onClick={() => setTab("logs")}
            className={`px-4 py-2 rounded-md text-sm font-medium ${tab === "logs" ? "bg-blue-600 text-white" : "bg-white border"}`}
          >
            Logs
          </button>
          <button
            onClick={() => setTab("access")}
            className={`px-4 py-2 rounded-md text-sm font-medium ${tab === "access" ? "bg-blue-600 text-white" : "bg-white border"}`}
          >
            Acessos
          </button>
        </div>
      </div>

      {/* Conteúdo dinâmico */}
      {tab === "reports" && <AdminReportsPage />}
      {tab === "config" && <AdminConfigPage />}
      {tab === "notifications" && <AdminNotificationsPage />}
      {tab === "logs" && <AdminLogsPage />}
      {tab === "access" && <AdminAccessLogsPage />}
    </div>
  );
}
