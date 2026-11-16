import type { FormEvent } from "react";
import type { AppointmentSlot, Booking } from "../lib/api";
import { BookingCard } from "../components/bookings/BookingCard";
import { CancelBookingModal } from "../components/bookings/CancelBookingModal";

interface MyBookingsPageProps {
  searchEmail: string;
  onSearchEmailChange: (value: string) => void;
  bookings: Booking[];
  bookingSlots: Record<string, AppointmentSlot>;
  nextCursor: string | null;
  historyLoading: boolean;
  historyError: string;
  historySearched: boolean;
  cancellingId: string | null;
  cancelTarget: Booking | null;
  onBookingSearch: (event: FormEvent<HTMLFormElement>) => void;
  onLoadMore: () => void;
  onSetCancelTarget: (booking: Booking) => void;
  onConfirmCancel: () => void;
  onDismissCancelTarget: () => void;
}

export function MyBookingsPage({
  searchEmail,
  onSearchEmailChange,
  bookings,
  bookingSlots,
  nextCursor,
  historyLoading,
  historyError,
  historySearched,
  cancellingId,
  cancelTarget,
  onBookingSearch,
  onLoadMore,
  onSetCancelTarget,
  onConfirmCancel,
  onDismissCancelTarget,
}: MyBookingsPageProps) {
  return (
    <>
      <section className="appointments-panel">
        <div className="panel-heading">
          <div>
            <h2>My bookings</h2>
            <p>Search, review, and manage your clinic appointments.</p>
          </div>
        </div>

        <form className="history-search" onSubmit={onBookingSearch}>
          <div className="filter-field">
            <label htmlFor="booking-search-email">
              Booking email address
            </label>
            <input
              id="booking-search-email"
              type="email"
              placeholder="Enter the email used for booking"
              value={searchEmail}
              onChange={(event) => onSearchEmailChange(event.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <button
            type="submit"
            className="primary-button"
            disabled={historyLoading}
          >
            {historyLoading ? "Searching..." : "Find bookings"}
          </button>
        </form>

        {historyError && (
          <div className="error-message" role="alert">
            {historyError}
          </div>
        )}

        {!historySearched && !historyLoading ? (
          <div className="empty-state">
            <div className="empty-icon">▤</div>
            <h3>Find your appointments</h3>
            <p>
              Enter the email address associated with your booking to view
              your appointment history.
            </p>
          </div>
        ) : bookings.length === 0 && !historyLoading ? (
          <div className="empty-state">
            <div className="empty-icon">▦</div>
            <h3>No bookings found</h3>
            <p>
              There are no bookings associated with this email address.
            </p>
          </div>
        ) : (
          <div className="bookings-list">
            {bookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                slot={bookingSlots[booking.slot_id]}
                cancellingId={cancellingId}
                onCancelRequest={onSetCancelTarget}
              />
            ))}

            {nextCursor && (
              <div className="load-more">
                <button
                  type="button"
                  className="secondary-button"
                  disabled={historyLoading}
                  onClick={onLoadMore}
                >
                  {historyLoading ? "Loading..." : "Load more bookings"}
                </button>
              </div>
            )}

            {historyLoading && (
              <p className="history-loading">Loading booking history...</p>
            )}
          </div>
        )}
      </section>

      {cancelTarget && (
        <CancelBookingModal
          booking={cancelTarget}
          cancellingId={cancellingId}
          onConfirm={onConfirmCancel}
          onDismiss={onDismissCancelTarget}
        />
      )}
    </>
  );
}
