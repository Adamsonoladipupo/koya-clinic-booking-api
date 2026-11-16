import type { FormEvent } from "react";
import type { AppointmentSlot, Booking } from "../../lib/api";
import { formatDate, formatTime } from "../../utils/date";

interface BookingModalProps {
  slot: AppointmentSlot;
  confirmedBooking: Booking | null;
  loading: boolean;
  error: string;
  patientName: string;
  onPatientNameChange: (value: string) => void;
  patientEmail: string;
  onPatientEmailChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}

export function BookingModal({
  slot,
  confirmedBooking,
  loading,
  error,
  patientName,
  onPatientNameChange,
  patientEmail,
  onPatientEmailChange,
  onSubmit,
  onClose,
}: BookingModalProps) {
  return (
    <div className="modal-backdrop">
      <section
        className="booking-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-modal-title"
      >
        <div className="modal-header">
          <div>
            <span className="eyebrow">
              {confirmedBooking ? "BOOKING CONFIRMED" : "NEW APPOINTMENT"}
            </span>
            <h2 id="booking-modal-title">
              {confirmedBooking
                ? "You're all booked!"
                : "Complete your booking"}
            </h2>
          </div>

          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            disabled={loading}
            aria-label="Close booking dialog"
          >
            ×
          </button>
        </div>

        {confirmedBooking ? (
          <div className="confirmation">
            <div className="confirmation-icon">✓</div>

            <h3>Appointment confirmed</h3>
            <p>Your appointment has been successfully booked.</p>

            <div className="appointment-summary">
              <div>
                <span>Booking ID</span>
                <strong>{confirmedBooking.id}</strong>
              </div>
              <div>
                <span>Patient</span>
                <strong>{confirmedBooking.name}</strong>
              </div>
              <div>
                <span>Email</span>
                <strong>{confirmedBooking.email}</strong>
              </div>
              <div>
                <span>Provider</span>
                <strong>{slot.provider}</strong>
              </div>
              <div>
                <span>Date</span>
                <strong>{formatDate(slot.start)}</strong>
              </div>
              <div>
                <span>Time (Lagos)</span>
                <strong>{formatTime(slot.start)}</strong>
              </div>
              <div>
                <span>Status</span>
                <strong className="confirmed-text">
                  {confirmedBooking.status}
                </strong>
              </div>
            </div>

            <button
              type="button"
              className="primary-button full-width"
              onClick={onClose}
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="selected-appointment">
              <div className="doctor-avatar">
                {slot.provider
                  .replace(/^Dr\.?\s*/i, "")
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                <strong>{slot.provider}</strong>
                <span>
                  {formatDate(slot.start)} · {formatTime(slot.start)} (Lagos)
                </span>
              </div>
            </div>

            <form onSubmit={onSubmit} className="booking-form">
              <div className="form-field">
                <label htmlFor="patient-name">Full name</label>
                <input
                  id="patient-name"
                  type="text"
                  value={patientName}
                  onChange={(event) =>
                    onPatientNameChange(event.target.value)
                  }
                  placeholder="e.g. Ada Obi"
                  autoComplete="name"
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="patient-email">Email address</label>
                <input
                  id="patient-email"
                  type="email"
                  value={patientEmail}
                  onChange={(event) =>
                    onPatientEmailChange(event.target.value)
                  }
                  placeholder="e.g. ada@example.com"
                  autoComplete="email"
                  required
                />
              </div>

              {error && (
                <div className="error-message" role="alert">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="primary-button full-width"
                disabled={loading}
              >
                {loading
                  ? "Confirming appointment..."
                  : "Confirm appointment →"}
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
