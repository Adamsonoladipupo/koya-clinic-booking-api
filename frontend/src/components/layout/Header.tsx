import type { View } from "../../types/navigation";

interface HeaderProps {
  view: View;
  apiKey: string | null;
  onDisconnect: () => void;
}

export function Header({ view, apiKey, onDisconnect }: HeaderProps) {
  const breadcrumbLabel =
    view === "appointments"
      ? "Appointments"
      : view === "bookings"
        ? "My Bookings"
        : "Reset Data";

  return (
    <header className="topbar">
      <div className="breadcrumb">
        Workspace <span>/</span> {breadcrumbLabel}
      </div>

      <div className="topbar-right">
        <span
          className={`connection-indicator ${apiKey ? "connected" : ""}`}
        >
          <span className="status-dot" />
          {apiKey ? "API Connected" : "Not connected"}
        </span>

        {apiKey && (
          <button
            type="button"
            className="disconnect-btn"
            onClick={onDisconnect}
          >
            Disconnect
          </button>
        )}
      </div>
    </header>
  );
}
