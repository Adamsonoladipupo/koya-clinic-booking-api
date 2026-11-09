
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  "https://adamson-koya-clinic-booking-api.onrender.com"
).replace(/\/$/, "");

export interface AppointmentSlot {
  id: string;
  provider: string;
  start: string;
  end: string;
  available: boolean;
}

export interface Booking {
  id: string;
  slot_id: string;
  name: string;
  email: string;
  status: "confirmed" | "cancelled";
  created_at: string;
}

export interface BookingInput {
  slot_id: string;
  name: string;
  email: string;
}

interface SlotsResponse {
  slots: AppointmentSlot[];
}

interface BookingsResponse {
  bookings: Booking[];
  next_cursor: string | null;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public retryAfter?: string | null,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  apiKey: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);

  headers.set("X-API-Key", apiKey);
  headers.set("Accept", "application/json");

  if (options.body) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      cache: "no-store",
    });
  } catch {
    throw new ApiError(
      0,
      "Unable to reach the clinic API. Check your connection or the server's CORS configuration.",
    );
  }

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const errorData = data as { error?: string } | null;

    throw new ApiError(
      response.status,
      errorData?.error || `Request failed (${response.status})`,
      response.headers.get("Retry-After"),
    );
  }

  return data as T;
}

export const clinicApi = {
  getSlots(apiKey: string, provider?: string) {
    const query = provider
      ? `?provider=${encodeURIComponent(provider)}`
      : "";

    return request<SlotsResponse>(`/slots${query}`, apiKey);
  },

  createBooking(
    apiKey: string,
    booking: BookingInput,
    idempotencyKey?: string,
  ) {
    return request<Booking>("/bookings", apiKey, {
      method: "POST",
      headers: idempotencyKey
        ? { "Idempotency-Key": idempotencyKey }
        : undefined,
      body: JSON.stringify(booking),
    });
  },

  getBookings(
    apiKey: string,
    email: string,
    limit = 10,
    cursor?: string,
  ) {
    const params = new URLSearchParams({
      email,
      limit: String(limit),
    });

    if (cursor) params.set("cursor", cursor);

    return request<BookingsResponse>(
      `/bookings?${params.toString()}`,
      apiKey,
    );
  },

  cancelBooking(apiKey: string, bookingId: string) {
    return request<Booking>(
      `/bookings/${encodeURIComponent(bookingId)}`,
      apiKey,
      { method: "DELETE" },
    );
  },


    resetSlots(
    apiKey: string,
    slots: Array<
        Pick<AppointmentSlot, "id" | "provider" | "start" | "end">
    >,
    ) {
    return request<unknown>("/reset", apiKey, {
        method: "POST",
        body: JSON.stringify({ slots }),
    });
    },

};

