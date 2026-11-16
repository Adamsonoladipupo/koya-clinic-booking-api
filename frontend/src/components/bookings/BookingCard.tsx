import type { AppointmentSlot, Booking } from "../../lib/api";
import { formatDate, formatTime } from "../../utils/date";

interface BookingCardProps {
  booking: Booking;
  slot: AppointmentSlot | undefined;
  cancellingId: string | null;
  onCancelRequest: (booking: Booking) => void;
}

export function BookingCard({
  booking,
  slot,
  cancellingId,
  onCancelRequest,
}: BookingCardProps) {
  const isConfirmed = booking.status === "confirmed";

  return (
    <article className="booking-item">
      <div className="booking-item-main">
        <div className="doctor-avatar">
          {slot?.provider.charAt(0).toUpperCase() ?? "K"}
        </div>

        <div className="booking-item-details">
          <div className="booking-title-row">
            <h3>{slot?.provider ?? "Clinic appointment"}</h3>
            <span
              className={`booking-status ${
                isConfirmed ? "booking-confirmed" : "booking-cancelled"
              }`}
            >
              {booking.status}
            </span>
          </div>

          <p>Patient: {booking.name}</p>
          <p>Email: {booking.email}</p>
          <p>
            {slot
              ? `${formatDate(slot.start)} · ${formatTime(slot.start)} (Lagos)`
              : `Slot ID: ${booking.slot_id}`}
          </p>

          <span className="booking-reference">
            Booking ID: {booking.id}
          </span>
        </div>
      </div>

      {isConfirmed && (
        <button
          type="button"
          className="cancel-button"
          onClick={() => onCancelRequest(booking)}
          disabled={cancellingId === booking.id}
        >
          Cancel booking
        </button>
      )}
    </article>
  );
}
