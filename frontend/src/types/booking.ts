export interface Slot {
  id: string;
  provider: string;
  start: string;
  end: string;
  available: boolean;
}

export interface SlotsResponse {
  slots: Slot[];
}

export interface NewBooking {
  slot_id: string;
  name: string;
  email: string;
}

export type BookingStatus = "confirmed" | "cancelled";

export interface Booking {
  id: string;
  slot_id: string;
  name: string;
  email: string;
  status: BookingStatus;
  created_at: string;
}

export interface ApiError {
  error: string;
}