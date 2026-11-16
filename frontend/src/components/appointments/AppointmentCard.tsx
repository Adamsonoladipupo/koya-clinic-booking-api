import type { AppointmentSlot } from "../../lib/api";
import { formatDate, formatTime } from "../../utils/date";

interface AppointmentCardProps {
  slot: AppointmentSlot;
  onBook: (slot: AppointmentSlot) => void;
}

export function AppointmentCard({ slot, onBook }: AppointmentCardProps) {
  return (
    <article className="slot-card">
      <div className="slot-card-top">
        <div className="doctor-avatar">
          {slot.provider
            .replace(/^Dr\.?\s*/i, "")
            .charAt(0)
            .toUpperCase()}
        </div>
        <span
          className={`slot-status ${
            slot.available ? "is-available" : "is-booked"
          }`}
        >
          {slot.available ? "Available" : "Booked"}
        </span>
      </div>

      <h3>{slot.provider}</h3>
      <p className="slot-subtitle">Healthcare provider</p>

      <div className="slot-divider" />

      <div className="slot-details">
        <div>
          <span>◷</span>
          {formatDate(slot.start)}
        </div>
        <div>
          <span>◴</span>
          {formatTime(slot.start)} – {formatTime(slot.end)}
        </div>
      </div>

      <button
        type="button"
        className="slot-button"
        disabled={!slot.available}
        onClick={() => onBook(slot)}
      >
        {slot.available ? "Book appointment →" : "Unavailable"}
      </button>
    </article>
  );
}
