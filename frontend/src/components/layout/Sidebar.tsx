import type { View } from "../../types/navigation";

interface SidebarProps {
  view: View;
  onViewChange: (view: View) => void;
}

export function Sidebar({ view, onViewChange }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-symbol">✳</div>
        <div>
          <strong>Koya Clinic</strong>
          <span>Care made simple</span>
        </div>
      </div>

      <div className="sidebar-label">WORKSPACE</div>

      <nav className="sidebar-nav" aria-label="Main navigation">
        <button
          type="button"
          className={`nav-link ${view === "appointments" ? "active" : ""}`}
          onClick={() => onViewChange("appointments")}
        >
          <span>▦</span> Appointments
        </button>

        <button
          type="button"
          className={`nav-link ${view === "bookings" ? "active" : ""}`}
          onClick={() => onViewChange("bookings")}
        >
          <span>▤</span> My Bookings
        </button>

        <button
          type="button"
          className={`nav-link ${view === "reset" ? "active" : ""}`}
          onClick={() => onViewChange("reset")}
        >
          <span aria-hidden="true">↺</span> Reset Data
        </button>
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-help">
          <strong>Need assistance?</strong>
          <p>
            Connect with your API key to explore the appointment booking
            system.
          </p>
        </div>
        <span className="sidebar-footnote">
          © {new Date().getFullYear()} Koya Clinic
        </span>
      </div>
    </aside>
  );
}
