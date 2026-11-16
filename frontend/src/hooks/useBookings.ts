import { useState } from "react";
import type { FormEvent } from "react";
import { ApiError, clinicApi, type Booking } from "../lib/api";

export interface UseBookingsReturn {
  searchEmail: string;
  setSearchEmail: (value: string) => void;
  bookings: Booking[];
  nextCursor: string | null;
  historyLoading: boolean;
  historyError: string;
  historySearched: boolean;
  cancellingId: string | null;
  cancelTarget: Booking | null;
  setCancelTarget: (booking: Booking | null) => void;
  handleBookingSearch: (
    event: FormEvent<HTMLFormElement>,
    apiKey: string,
  ) => Promise<void>;
  loadMore: (apiKey: string) => Promise<void>;
  handleCancelBooking: (
    apiKey: string,
    onSlotsChanged: (key: string) => Promise<void>,
  ) => Promise<void>;
  reset: () => void;
}

export function useBookings(): UseBookingsReturn {
  const [searchEmail, setSearchEmail] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [historySearched, setHistorySearched] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [activeSearchEmail, setActiveSearchEmail] = useState("");

  // ── internal fetch ───────────────────────────────────────────────────────────

  async function fetchHistory(
    apiKey: string,
    email: string,
    cursor?: string,
  ): Promise<void> {
    setHistoryLoading(true);
    setHistoryError("");

    try {
      const result = await clinicApi.getBookings(apiKey, email, 10, cursor);

      setBookings((previous) =>
        cursor
          ? [
              ...previous,
              ...result.bookings.filter(
                (b) => !previous.some((e) => e.id === b.id),
              ),
            ]
          : result.bookings,
      );

      setNextCursor(result.next_cursor);
      setHistorySearched(true);
    } catch (err) {
      setHistoryError(
        err instanceof Error
          ? err.message
          : "Unable to retrieve your bookings.",
      );
    } finally {
      setHistoryLoading(false);
    }
  }

  // ── public handlers ──────────────────────────────────────────────────────────

  async function handleBookingSearch(
    event: FormEvent<HTMLFormElement>,
    apiKey: string,
  ): Promise<void> {
    event.preventDefault();

    const email = searchEmail.trim().toLowerCase();

    if (!email) {
      setHistoryError("Enter your booking email address.");
      return;
    }

    setBookings([]);
    setNextCursor(null);
    setHistorySearched(false);
    setActiveSearchEmail(email);

    await fetchHistory(apiKey, email);
  }

  async function loadMore(apiKey: string): Promise<void> {
    if (!nextCursor) return;
    await fetchHistory(apiKey, activeSearchEmail, nextCursor);
  }

  async function handleCancelBooking(
    apiKey: string,
    onSlotsChanged: (key: string) => Promise<void>,
  ): Promise<void> {
    if (!cancelTarget || cancellingId) return;

    const bookingId = cancelTarget.id;

    setCancellingId(bookingId);
    setHistoryError("");

    try {
      const updated = await clinicApi.cancelBooking(apiKey, bookingId);

      setBookings((previous) =>
        previous.map((b) => (b.id === bookingId ? updated : b)),
      );

      setCancelTarget(null);
      await onSlotsChanged(apiKey);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setHistoryError(
          "This booking is already cancelled. Refresh the booking history.",
        );
      } else {
        setHistoryError(
          err instanceof Error
            ? err.message
            : "Unable to cancel this booking.",
        );
      }
    } finally {
      setCancellingId(null);
    }
  }

  // ── reset ────────────────────────────────────────────────────────────────────

  function reset(): void {
    setSearchEmail("");
    setBookings([]);
    setNextCursor(null);
    setHistoryLoading(false);
    setHistoryError("");
    setHistorySearched(false);
    setCancellingId(null);
    setCancelTarget(null);
    setActiveSearchEmail("");
  }

  return {
    searchEmail,
    setSearchEmail,
    bookings,
    nextCursor,
    historyLoading,
    historyError,
    historySearched,
    cancellingId,
    cancelTarget,
    setCancelTarget,
    handleBookingSearch,
    loadMore,
    handleCancelBooking,
    reset,
  };
}
