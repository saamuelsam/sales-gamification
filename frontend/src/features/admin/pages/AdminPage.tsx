import { useState } from "react";
import { AdminDashboardPage } from "./AdminDashboardPage";
import { AdminReportsPage } from "./AdminReportsPage";
import { AdminConfigPage } from "./AdminConfigPage";
import { AdminNotificationsPage } from "./AdminNotificationsPage";
import { AdminLogsPage } from "./AdminLogsPage";
import { AdminAccessLogsPage } from "./AdminAccessLogsPage";

export function AdminPage() {
  const [tab, setTab] = useState<"dashboard" | "reports" | "config" | "notifications" | "logs" | "access">("dashboard");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between mb-6 border-b border-gray-200 dark:border-gray-700 pb-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Painel Administrativo</h1>
        <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
          <button
            onClick={() => setTab("dashboard")}
            className={`px-4 py-2 rounded-md text-sm font-medium ${tab === "dashboard" ? "bg-blue-600 text-white" : "bg-white dark:bg-gray-800 border dark:border-gray-700 dark:text-gray-300"}`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setTab("reports")}
            className={`px-4 py-2 rounded-md text-sm font-medium ${tab === "reports" ? "bg-blue-600 text-white" : "bg-white dark:bg-gray-800 border dark:border-gray-700 dark:text-gray-300"}`}
          >
            Relatórios
          </button>
          <button
            onClick={() => setTab("config")}
            className={`px-4 py-2 rounded-md text-sm font-medium ${tab === "config" ? "bg-blue-600 text-white" : "bg-white dark:bg-gray-800 border dark:border-gray-700 dark:text-gray-300"}`}
          >
            Configurações
          </button>
          <button
            onClick={() => setTab("notifications")}
            className={`px-4 py-2 rounded-md text-sm font-medium ${tab === "notifications" ? "bg-blue-600 text-white" : "bg-white dark:bg-gray-800 border dark:border-gray-700 dark:text-gray-300"}`}
          >
            Notificações
          </button>
          <button
            onClick={() => setTab("logs")}
            className={`px-4 py-2 rounded-md text-sm font-medium ${tab === "logs" ? "bg-blue-600 text-white" : "bg-white dark:bg-gray-800 border dark:border-gray-700 dark:text-gray-300"}`}
          >
            Logs
          </button>
          <button
            onClick={() => setTab("access")}
            className={`px-4 py-2 rounded-md text-sm font-medium ${tab === "access" ? "bg-blue-600 text-white" : "bg-white dark:bg-gray-800 border dark:border-gray-700 dark:text-gray-300"}`}
          >
            Acessos
          </button>
        </div>
      </div>

      {/* Conteúdo dinâmico */}
      {tab === "dashboard" && <AdminDashboardPage />}
      {tab === "reports" && <AdminReportsPage />}
      {tab === "config" && <AdminConfigPage />}
      {tab === "notifications" && <AdminNotificationsPage />}
      {tab === "logs" && <AdminLogsPage />}
      {tab === "access" && <AdminAccessLogsPage />}
    </div>
  );
}
