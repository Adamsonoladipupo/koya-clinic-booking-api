import type { FormEvent } from "react";
import type { AppointmentSlot, Booking } from "../lib/api";
import { AppointmentStats } from "../components/appointments/AppointmentStats";
import { AppointmentFilters } from "../components/appointments/AppointmentFilters";
import { AppointmentCard } from "../components/appointments/AppointmentCard";
import { BookingModal } from "../components/appointments/BookingModal";

interface AppointmentsPageProps {
  slots: AppointmentSlot[];
  filteredSlots: AppointmentSlot[];
  providers: string[];
  provider: string;
  onProviderChange: (value: string) => void;
  availability: string;
  onAvailabilityChange: (value: string) => void;
  loading: boolean;
  error: string;
  onRefresh: () => void;
  onOpenBooking: (slot: AppointmentSlot) => void;
  availableCount: number;
  providerCount: number;
  selectedSlot: AppointmentSlot | null;
  confirmedBooking: Booking | null;
  bookingLoading: boolean;
  bookingError: string;
  patientName: string;
  onPatientNameChange: (value: string) => void;
  patientEmail: string;
  onPatientEmailChange: (value: string) => void;
  onBooking: (event: FormEvent<HTMLFormElement>) => void;
  onCloseBooking: () => void;
}

export function AppointmentsPage({
  slots,
  filteredSlots,
  providers,
  provider,
  onProviderChange,
  availability,
  onAvailabilityChange,
  loading,
  error,
  onRefresh,
  onOpenBooking,
  availableCount,
  providerCount,
  selectedSlot,
  confirmedBooking,
  bookingLoading,
  bookingError,
  patientName,
  onPatientNameChange,
  patientEmail,
  onPatientEmailChange,
  onBooking,
  onCloseBooking,
}: AppointmentsPageProps) {
  return (
    <>
      <AppointmentStats
        total={slots.length}
        available={availableCount}
        providerCount={providerCount}
      />

      <section className="appointments-panel">
        <div className="panel-heading">
          <div>
            <h2>Available appointments</h2>
            <p>Browse appointment times and choose your preferred provider.</p>
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={onRefresh}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "↻ Refresh"}
          </button>
        </div>

        <AppointmentFilters
          providers={providers}
          provider={provider}
          onProviderChange={onProviderChange}
          availability={availability}
          onAvailabilityChange={onAvailabilityChange}
        />

        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="empty-state">Loading appointments...</div>
        ) : filteredSlots.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">▦</div>
            <h3>No appointments found</h3>
            <p>
              Try changing your filters or ask the clinic to add more
              appointment slots.
            </p>
          </div>
        ) : (
          <div className="slots-grid">
            {filteredSlots.map((slot) => (
              <AppointmentCard
                key={slot.id}
                slot={slot}
                onBook={onOpenBooking}
              />
            ))}
          </div>
        )}
      </section>

      {selectedSlot && (
        <BookingModal
          slot={selectedSlot}
          confirmedBooking={confirmedBooking}
          loading={bookingLoading}
          error={bookingError}
          patientName={patientName}
          onPatientNameChange={onPatientNameChange}
          patientEmail={patientEmail}
          onPatientEmailChange={onPatientEmailChange}
          onSubmit={onBooking}
          onClose={onCloseBooking}
        />
      )}
    </>
  );
}
