import type { Booking } from "../../lib/api";

interface CancelBookingModalProps {
  booking: Booking;
  cancellingId: string | null;
  onConfirm: () => void;
  onDismiss: () => void;
}

export function CancelBookingModal({
  booking,
  cancellingId,
  onConfirm,
  onDismiss,
}: CancelBookingModalProps) {
  const busy = Boolean(cancellingId);

  return (
    <div className="modal-backdrop">
      <section
        className="booking-modal cancel-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-modal-title"
      >
        <div className="modal-header">
          <div>
            <span className="eyebrow">APPOINTMENT MANAGEMENT</span>
            <h2 id="cancel-modal-title">Cancel this appointment?</h2>
          </div>

          <button
            type="button"
            className="modal-close"
            onClick={onDismiss}
            disabled={busy}
            aria-label="Close cancellation dialog"
          >
            ×
          </button>
        </div>

        <p className="cancel-description">
          You're about to cancel the appointment for{" "}
          <strong>{booking.name}</strong>. The appointment slot will become
          available again.
        </p>

        <div className="cancel-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={onDismiss}
            disabled={busy}
          >
            Keep appointment
          </button>

          <button
            type="button"
            className="danger-button"
            onClick={onConfirm}
            disabled={busy}
          >
            {cancellingId ? "Cancelling..." : "Yes, cancel booking"}
          </button>
        </div>
      </section>
    </div>
  );
}
