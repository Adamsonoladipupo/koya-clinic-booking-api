import { useCallback, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { ApiError, clinicApi, type AppointmentSlot, type Booking } from "../lib/api";

export interface UseAppointmentsReturn {
  slots: AppointmentSlot[];
  bookingSlots: Record<string, AppointmentSlot>;
  providers: string[];
  filteredSlots: AppointmentSlot[];
  availableCount: number;
  providerCount: number;
  provider: string;
  setProvider: (value: string) => void;
  availability: string;
  setAvailability: (value: string) => void;
  loading: boolean;
  slotsError: string;
  loadSlots: (key: string) => Promise<void>;
  selectedSlot: AppointmentSlot | null;
  confirmedBooking: Booking | null;
  bookingLoading: boolean;
  bookingError: string;
  patientName: string;
  setPatientName: (value: string) => void;
  patientEmail: string;
  setPatientEmail: (value: string) => void;
  openBooking: (slot: AppointmentSlot) => void;
  closeBooking: () => void;
  handleBooking: (
    event: FormEvent<HTMLFormElement>,
    apiKey: string,
  ) => Promise<void>;
  reset: () => void;
}

export function useAppointments(): UseAppointmentsReturn {
  const [slots, setSlots] = useState<AppointmentSlot[]>([]);
  const [bookingSlots, setBookingSlots] = useState<
    Record<string, AppointmentSlot>
  >({});
  const [provider, setProvider] = useState("all");
  const [availability, setAvailability] = useState("available");
  const [loading, setLoading] = useState(false);
  const [slotsError, setSlotsError] = useState("");

  const [selectedSlot, setSelectedSlot] =
    useState<AppointmentSlot | null>(null);
  const [confirmedBooking, setConfirmedBooking] =
    useState<Booking | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [patientName, setPatientName] = useState("");
  const [patientEmail, setPatientEmail] = useState("");

  // ── slot loading ─────────────────────────────────────────────────────────────

  const loadSlots = useCallback(async (key: string): Promise<void> => {
    setLoading(true);
    setSlotsError("");

    try {
      const result = await clinicApi.getSlots(key);
      setSlots(result.slots);
      setBookingSlots(
        Object.fromEntries(result.slots.map((slot) => [slot.id, slot])),
      );
    } catch (err) {
      setSlotsError(
        err instanceof Error ? err.message : "Could not load appointments.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // ── derived ──────────────────────────────────────────────────────────────────

  const providers = useMemo(
    () => [...new Set(slots.map((slot) => slot.provider))].sort(),
    [slots],
  );

  const filteredSlots = useMemo(() => {
    return slots
      .filter((slot) => {
        const matchesProvider =
          provider === "all" || slot.provider === provider;
        const matchesAvailability =
          availability === "all" ||
          (availability === "available" && slot.available) ||
          (availability === "booked" && !slot.available);
        return matchesProvider && matchesAvailability;
      })
      .sort(
        (a, b) =>
          new Date(a.start).getTime() - new Date(b.start).getTime(),
      );
  }, [slots, provider, availability]);

  const availableCount = useMemo(
    () => slots.filter((s) => s.available).length,
    [slots],
  );

  // ── booking modal ─────────────────────────────────────────────────────────────

  function openBooking(slot: AppointmentSlot): void {
    if (!slot.available) return;
    setSelectedSlot(slot);
    setConfirmedBooking(null);
    setBookingError("");
    setPatientName("");
    setPatientEmail("");
  }

  function closeBooking(): void {
    if (bookingLoading) return;
    setSelectedSlot(null);
    setConfirmedBooking(null);
    setBookingError("");
  }

  async function handleBooking(
    event: FormEvent<HTMLFormElement>,
    apiKey: string,
  ): Promise<void> {
    event.preventDefault();

    if (!selectedSlot || bookingLoading) return;

    const name = patientName.trim();
    const email = patientEmail.trim().toLowerCase();

    if (!name || !email) {
      setBookingError("Please enter your name and email.");
      return;
    }

    setBookingLoading(true);
    setBookingError("");

    try {
      const booking = await clinicApi.createBooking(apiKey, {
        slot_id: selectedSlot.id,
        name,
        email,
      });

      setConfirmedBooking(booking);
      await loadSlots(apiKey);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setBookingError(
            "This appointment has already been booked. Please choose another slot.",
          );
          void loadSlots(apiKey);
        } else if (err.status === 429) {
          setBookingError(
            `Too many booking attempts. Please try again in ${
              err.retryAfter ?? "a few"
            } seconds.`,
          );
        } else if (err.status === 401) {
          setBookingError(
            "Your API key was rejected. Please reconnect with a valid key.",
          );
        } else {
          setBookingError(err.message);
        }
      } else {
        setBookingError(
          "Unable to complete your booking. Please try again.",
        );
      }
    } finally {
      setBookingLoading(false);
    }
  }

  // ── reset (called on disconnect or after data reset) ─────────────────────────

  function reset(): void {
    setSlots([]);
    setBookingSlots({});
    setProvider("all");
    setAvailability("available");
    setSlotsError("");
    setSelectedSlot(null);
    setConfirmedBooking(null);
    setBookingError("");
    setPatientName("");
    setPatientEmail("");
  }

  return {
    slots,
    bookingSlots,
    providers,
    filteredSlots,
    availableCount,
    providerCount: providers.length,
    provider,
    setProvider,
    availability,
    setAvailability,
    loading,
    slotsError,
    loadSlots,
    selectedSlot,
    confirmedBooking,
    bookingLoading,
    bookingError,
    patientName,
    setPatientName,
    patientEmail,
    setPatientEmail,
    openBooking,
    closeBooking,
    handleBooking,
    reset,
  };
}
