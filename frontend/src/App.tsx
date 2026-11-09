
import { useCallback, useMemo, useState } from "react";
import type { FormEvent } from "react";

import {
  ApiError,
  clinicApi,
  type AppointmentSlot,
  type Booking,
} from "./lib/api";


import "./App.css";

type View = "appointments" | "bookings" | "reset";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Africa/Lagos",
  }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Africa/Lagos",
  }).format(new Date(value));
}

function EyeIcon({ visible }: { visible: boolean }) {
  return visible ? (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      width="20"
      height="20"
      aria-hidden="true"
    >
      <path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8" />
      <path d="M9.9 5.3A10.5 10.5 0 0112 5c5 0 9 4 10 7a13 13 0 01-3.1 4.2M6.2 6.2C4.3 7.5 2.8 9.6 2 12c1 3 5 7 10 7 1.7 0 3.3-.4 4.7-1.2" />
    </svg>
  ) : (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      width="20"
      height="20"
      aria-hidden="true"
    >
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}







type ResetSlot = Pick<
  AppointmentSlot,
  "id" | "provider" | "start" | "end"
>;

function getDefaultResetJson(): string {
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(tomorrow);

  const sample = {
    slots: [
      {
        id: "s1",
        provider: "Dr. Ade",
        start: `${date}T09:00:00+01:00`,
        end: `${date}T09:30:00+01:00`,
      },
      {
        id: "s2",
        provider: "Dr. Adaeze Okafor",
        start: `${date}T10:00:00+01:00`,
        end: `${date}T10:30:00+01:00`,
      },
    ],
  };

  return JSON.stringify(sample, null, 2);
}

function parseResetSlots(input: string): ResetSlot[] {
  const payload: unknown = JSON.parse(input);

  if (
    typeof payload !== "object" ||
    payload === null ||
    !("slots" in payload) ||
    !Array.isArray(payload.slots)
  ) {
    throw new Error(
      'The request body must contain a "slots" array.',
    );
  }

  const slots: unknown[] = payload.slots;
  const ids = new Set<string>();
  const now = Date.now();

  if (slots.length === 0) {
    throw new Error("Provide at least one appointment slot.");
  }

  if (slots.length > 100) {
    throw new Error(
      "For this demo, submit at most 100 slots at a time.",
    );
  }

  return slots.map((value, index) => {
    if (typeof value !== "object" || value === null) {
      throw new Error(`Slot ${index + 1} must be an object.`);
    }

    const slot = value as Record<string, unknown>;

    for (const field of ["id", "provider", "start", "end"]) {
      if (
        typeof slot[field] !== "string" ||
        !(slot[field] as string).trim()
      ) {
        throw new Error(
          `Slot ${index + 1}: "${field}" must be a non-empty string.`,
        );
      }
    }

    const id = slot.id as string;
    const provider = slot.provider as string;
    const start = slot.start as string;
    const end = slot.end as string;

    if (id.length > 100 || provider.length > 255) {
      throw new Error(
        `Slot ${index + 1}: ID or provider name is too long.`,
      );
    }

    if (ids.has(id)) {
      throw new Error(`Duplicate slot ID: ${id}`);
    }

    ids.add(id);

    const timezonePattern = /(Z|[+-]\d{2}:\d{2})$/i;

    if (
      !timezonePattern.test(start) ||
      !timezonePattern.test(end) ||
      !Number.isFinite(Date.parse(start)) ||
      !Number.isFinite(Date.parse(end))
    ) {
      throw new Error(
        `Slot ${index + 1}: provide valid ISO timestamps with timezone offsets.`,
      );
    }

    if (Date.parse(start) <= now) {
      throw new Error(
        `Slot ${index + 1}: appointment must be in the future.`,
      );
    }

    if (Date.parse(end) <= Date.parse(start)) {
      throw new Error(
        `Slot ${index + 1}: end must be after start.`,
      );
    }

    return { id, provider, start, end };
  });
}








function App() {
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [slots, setSlots] = useState<AppointmentSlot[]>([]);
  const [provider, setProvider] = useState("all");
  const [availability, setAvailability] = useState("available");
  const [view, setView] = useState<View>("appointments");



  const [selectedSlot, setSelectedSlot] =
    useState<AppointmentSlot | null>(null);
  const [patientName, setPatientName] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [confirmedBooking, setConfirmedBooking] =
    useState<Booking | null>(null);


  
const [searchEmail, setSearchEmail] = useState("");
const [bookings, setBookings] = useState<Booking[]>([]);
const [bookingSlots, setBookingSlots] = useState< Record<string, AppointmentSlot>>({});
const [nextCursor, setNextCursor] = useState<string | null>(null);
const [historyLoading, setHistoryLoading] = useState(false);
const [historyError, setHistoryError] = useState("");
const [historySearched, setHistorySearched] = useState(false);
const [cancellingId, setCancellingId] = useState<string | null>(null);
const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);


const [activeSearchEmail, setActiveSearchEmail] = useState("");




const [resetJson, setResetJson] = useState(getDefaultResetJson);
const [resetError, setResetError] = useState("");
const [resetSuccess, setResetSuccess] = useState("");
const [resetLoading, setResetLoading] = useState(false);
const [showResetConfirmation, setShowResetConfirmation] =
  useState(false);


  

  const loadSlots = useCallback(async (key: string) => {
    setLoading(true);
    setError("");

    try {
      const result = await clinicApi.getSlots(key);
      setSlots(result.slots);



      setBookingSlots(
        Object.fromEntries(
          result.slots.map((slot) => [slot.id, slot]),
        ),
      );



    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load appointments.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  async function handleConnect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const key = apiKeyInput.trim();

    if (!key) {
      setError("Please enter your API key.");
      return;
    }

    setConnecting(true);
    setError("");

    try {
      // A successful authenticated request verifies the key.
      const result = await clinicApi.getSlots(key);

      setSlots(result.slots);

      setBookingSlots(
        Object.fromEntries(
          result.slots.map((slot) => [slot.id, slot]),
        ),
      );



      setApiKey(key);
      setApiKeyInput("");
      setShowApiKey(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("Invalid API key. Please check and try again.");
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to connect to the clinic API.",
        );
      }
    } finally {
      setConnecting(false);
    }
  }

  function handleDisconnect() {
    setApiKey(null);
    setApiKeyInput("");
    setShowApiKey(false);
    setSlots([]);
    setError("");
    setProvider("all");
    setView("appointments");

    setBookingSlots({});
    setBookings([]);
    setSearchEmail("");
    setNextCursor(null);
    setHistoryError("");
    setHistorySearched(false);
    setCancelTarget(null);
    setSelectedSlot(null);
    setConfirmedBooking(null);
    setPatientName("");
    setPatientEmail("");
    setBookingError("");

    setActiveSearchEmail("");

    setResetError("");
    setResetSuccess("");
    setShowResetConfirmation(false);

  }



function openBooking(slot: AppointmentSlot) {
  if (!slot.available) return;

  setSelectedSlot(slot);
  setConfirmedBooking(null);
  setBookingError("");
  setPatientName("");
  setPatientEmail("");
}

function closeBooking() {
  if (bookingLoading) return;

  setSelectedSlot(null);
  setConfirmedBooking(null);
  setBookingError("");
}



async function handleBooking(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();

  if (!apiKey || !selectedSlot || bookingLoading) return;

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

    // Refresh availability after successful booking.
    await loadSlots(apiKey);
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 409) {
        setBookingError(
          "This appointment has already been booked. Please choose another slot.",
        );
        void loadSlots(apiKey);
      } else if (error.status === 429) {
        setBookingError(
          `Too many booking attempts. Please try again in ${
            error.retryAfter || "a few"
          } seconds.`,
        );
      } else if (error.status === 401) {
        setBookingError(
          "Your API key was rejected. Please reconnect with a valid key.",
        );
      } else {
        setBookingError(error.message);
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






async function fetchBookingHistory(
  email: string,
  cursor?: string,
) {
  if (!apiKey) return;

  setHistoryLoading(true);
  setHistoryError("");

  try {
    const result = await clinicApi.getBookings(
      apiKey,
      email,
      10,
      cursor,
    );

    setBookings((previous) =>
      cursor
        ? [
            ...previous,
            ...result.bookings.filter(
              (booking) =>
                !previous.some(
                  (existing) => existing.id === booking.id,
                ),
            ),
          ]
        : result.bookings,
    );

    setNextCursor(result.next_cursor);
    setHistorySearched(true);
  } catch (error) {
    setHistoryError(
      error instanceof Error
        ? error.message
        : "Unable to retrieve your bookings.",
    );
  } finally {
    setHistoryLoading(false);
  }
}

async function handleBookingSearch(
  event: FormEvent<HTMLFormElement>,
) {
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


  await fetchBookingHistory(email);
}

async function handleCancelBooking() {
  if (!apiKey || !cancelTarget || cancellingId) return;

  const bookingId = cancelTarget.id;

  setCancellingId(bookingId);
  setHistoryError("");

  try {
    const updated = await clinicApi.cancelBooking(
      apiKey,
      bookingId,
    );

    setBookings((previous) =>
      previous.map((booking) =>
        booking.id === bookingId ? updated : booking,
      ),
    );

    setCancelTarget(null);
    await loadSlots(apiKey);
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) {
      setHistoryError(
        "This booking is already cancelled. Refresh the booking history.",
      );
    } else {
      setHistoryError(
        error instanceof Error
          ? error.message
          : "Unable to cancel this booking.",
      );
    }
  } finally {
    setCancellingId(null);
  }
}







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
          new Date(a.start).getTime() -
          new Date(b.start).getTime(),
      );
  }, [slots, provider, availability]);

  const availableCount = slots.filter(
    (slot) => slot.available,
  ).length;

  const providerCount = providers.length;


  




function handleResetPreview(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();

  setResetError("");
  setResetSuccess("");

  try {
    parseResetSlots(resetJson);
    setShowResetConfirmation(true);
  } catch (error) {
    setResetError(
      error instanceof SyntaxError
        ? "Invalid JSON. Check the formatting and try again."
        : error instanceof Error
          ? error.message
          : "Invalid reset request.",
    );
  }
}

async function handleResetConfirm() {
  if (!apiKey || resetLoading) return;

  setResetLoading(true);
  setResetError("");
  setResetSuccess("");

  try {
    const parsedSlots = parseResetSlots(resetJson);

    await clinicApi.resetSlots(apiKey, parsedSlots);

    setShowResetConfirmation(false);
    setResetSuccess(
      `Reset successful. The database now contains ${parsedSlots.length} appointment slots.`,
    );

    // Clear data that may refer to deleted bookings or slots.
    setBookings([]);
    setBookingSlots({});
    setNextCursor(null);
    setHistorySearched(false);
    setActiveSearchEmail("");
    setSelectedSlot(null);
    setConfirmedBooking(null);
    setCancelTarget(null);
    setProvider("all");
    setAvailability("available");

    await loadSlots(apiKey);
  } catch (error) {
    setShowResetConfirmation(false);
    setResetError(
      error instanceof Error
        ? error.message
        : "The reset request failed.",
    );
  } finally {
    setResetLoading(false);
  }
}









  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-symbol">✳</div>
          <div>
            <strong>Koya Clinic</strong>
            <span>Care made simple</span>
          </div>
        </div>

        <div className="sidebar-label">WORKSPACE</div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          <button
            type="button"
            className={`nav-link ${
              view === "appointments" ? "active" : ""
            }`}
            onClick={() => setView("appointments")}
          >
            <span>▦</span> Appointments
          </button>

          <button
            type="button"
            className={`nav-link ${
              view === "bookings" ? "active" : ""
            }`}
            onClick={() => setView("bookings")}
          >
            <span>▤</span> My Bookings
          </button>


        <button
          type="button"
          className={`nav-link ${view === "reset" ? "active" : ""}`}
          onClick={() => setView("reset")}
        >
          <span aria-hidden="true">↺</span> Reset Data
        </button>

        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-help">
            <strong>Need assistance?</strong>
            <p>
              Connect with your API key to explore the
              appointment booking system.
            </p>
          </div>
          <span className="sidebar-footnote">
            © {new Date().getFullYear()} Koya Clinic
          </span>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <span>/</span>{" "}
            {view === "appointments"
              ? "Appointments"
              : view === "bookings"
              ? "My Bookings"
              : "Reset Data"}
          </div>

          <div className="topbar-right">
            <span
              className={`connection-indicator ${
                apiKey ? "connected" : ""
              }`}
            >
              <span className="status-dot" />
              {apiKey ? "API Connected" : "Not connected"}
            </span>

            {apiKey && (
              <button
                type="button"
                className="disconnect-btn"
                onClick={handleDisconnect}
              >
                Disconnect
              </button>
            )}
          </div>
        </header>

        <main className="main-content">
          <section className="welcome">
            <div>
              <span className="eyebrow">YOUR HEALTH, OUR PRIORITY</span>
              <h1>
                {view === "appointments"
                  ? "Find your next appointment"
                  : view === "bookings"
                  ? "Manage your bookings"
                  : "Reset appointment data"}
              </h1>
              <p>
                {view === "appointments"
                  ? "Explore available appointments and find the right time for your care."
                  : view === "bookings"
                  ? "View and manage your clinic appointments in one place."
                  : "Replace the demo appointment slots with your own test data."}
              </p>
            </div>
            <div className="welcome-decoration" aria-hidden="true">
              ✳
            </div>
          </section>

          {!apiKey ? (
            <section className="connect-layout">
              <div className="connect-card">
                <div className="connect-icon">⌁</div>
                <span className="eyebrow">SECURE CONNECTION</span>
                <h2>Connect to Koya Clinic</h2>
                <p className="muted">
                  Enter your API key to access appointment
                  availability and manage your bookings.
                </p>

                <form onSubmit={handleConnect}>
                  <label htmlFor="api-key">Your API key</label>

                  <div className="password-field">
                    <input
                      id="api-key"
                      type={showApiKey ? "text" : "password"}
                      value={apiKeyInput}
                      onChange={(event) =>
                        setApiKeyInput(event.target.value)
                      }
                      placeholder="Enter your API key"
                      autoComplete="off"
                      spellCheck={false}
                      required
                    />

                    <button
                      type="button"
                      className="eye-button"
                      onClick={() =>
                        setShowApiKey((current) => !current)
                      }
                      aria-label={
                        showApiKey
                          ? "Hide API key"
                          : "Show API key"
                      }
                      aria-pressed={showApiKey}
                      title={
                        showApiKey
                          ? "Hide API key"
                          : "Show API key"
                      }
                    >
                      <EyeIcon visible={showApiKey} />
                    </button>
                  </div>

                  {error && (
                    <div className="error-message" role="alert">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="primary-button full-width"
                    disabled={connecting}
                  >
                    {connecting
                      ? "Connecting..."
                      : "Connect to Clinic"}
                    <span aria-hidden="true">→</span>
                  </button>
                </form>

                <div className="security-note">
                  <span>♧</span>
                  <p>
                    Your key is kept temporarily in this
                    browser tab's memory and is cleared
                    when you refresh or disconnect.
                  </p>
                </div>
              </div>

              <div className="connect-info">
                <div className="info-icon">✚</div>
                <h3>Better care starts here.</h3>
                <p>
                  Find available doctors, choose a convenient
                  time, and manage your appointments from
                  one simple dashboard.
                </p>
                <div className="info-divider" />
                <div className="info-feature">
                  <span>✓</span> Real-time slot availability
                </div>
                <div className="info-feature">
                  <span>✓</span> Easy appointment booking
                </div>
                <div className="info-feature">
                  <span>✓</span> Simple booking management
                </div>
              </div>
            </section>
          ) : view === "appointments" ? (
            <>
              <section className="stats-grid">
                <div className="stat-card">
                  <span>Total appointments</span>
                  <strong>{slots.length}</strong>
                  <small>Across all providers</small>
                </div>
                <div className="stat-card">
                  <span>Available slots</span>
                  <strong>{availableCount}</strong>
                  <small>Ready for booking</small>
                </div>
                <div className="stat-card">
                  <span>Healthcare providers</span>
                  <strong>{providerCount}</strong>
                  <small>Available in the system</small>
                </div>
              </section>

              <section className="appointments-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Available appointments</h2>
                    <p>
                      Browse appointment times and choose
                      your preferred provider.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => void loadSlots(apiKey)}
                    disabled={loading}
                  >
                    {loading ? "Refreshing..." : "↻ Refresh"}
                  </button>
                </div>

                <div className="filter-bar">
                  <div className="filter-field">
                    <label htmlFor="provider-filter">Provider</label>
                    <select
                      id="provider-filter"
                      value={provider}
                      onChange={(event) =>
                        setProvider(event.target.value)
                      }
                    >
                      <option value="all">All providers</option>
                      {providers.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="filter-field">
                    <label htmlFor="availability-filter">
                      Availability
                    </label>
                    <select
                      id="availability-filter"
                      value={availability}
                      onChange={(event) =>
                        setAvailability(event.target.value)
                      }
                    >
                      <option value="available">
                        Available only
                      </option>
                      <option value="all">All slots</option>
                      <option value="booked">Booked only</option>
                    </select>
                  </div>
                </div>

                {error && (
                  <div className="error-message" role="alert">
                    {error}
                  </div>
                )}

                {loading ? (
                  <div className="empty-state">
                    Loading appointments...
                  </div>
                ) : filteredSlots.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">▦</div>
                    <h3>No appointments found</h3>
                    <p>
                      Try changing your filters or ask the
                      clinic to add more appointment slots.
                    </p>
                  </div>
                ) : (
                  <div className="slots-grid">
                    {filteredSlots.map((slot) => (
                      <article
                        className="slot-card"
                        key={slot.id}
                      >
                        <div className="slot-card-top">
                          <div className="doctor-avatar">
                            {slot.provider
                              .replace(/^Dr\.?\s*/i, "")
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                          <span
                            className={`slot-status ${
                              slot.available
                                ? "is-available"
                                : "is-booked"
                            }`}
                          >
                            {slot.available
                              ? "Available"
                              : "Booked"}
                          </span>
                        </div>

                        <h3>{slot.provider}</h3>
                        <p className="slot-subtitle">
                          Healthcare provider
                        </p>

                        <div className="slot-divider" />

                        <div className="slot-details">
                          <div>
                            <span>◷</span>
                            {formatDate(slot.start)}
                          </div>
                          <div>
                            <span>◴</span>
                            {formatTime(slot.start)} –{" "}
                            {formatTime(slot.end)}
                          </div>
                        </div>

                        <button
                          type="button"
                          className="slot-button"
                          disabled={!slot.available}
                          onClick={() => openBooking(slot)}
                        >
                          {slot.available ? "Book appointment →" : "Unavailable"}
                        </button>

                      </article>
                    ))}
                  </div>
                )}
              </section>
            </>
          // ) : (



          ) : view === "bookings" ? (

            



<section className="appointments-panel">
  <div className="panel-heading">
    <div>
      <h2>My bookings</h2>
      <p>
        Search, review, and manage your clinic appointments.
      </p>
    </div>
  </div>

  <form
    className="history-search"
    onSubmit={handleBookingSearch}
  >
    <div className="filter-field">
      <label htmlFor="booking-search-email">
        Booking email address
      </label>
      <input
        id="booking-search-email"
        type="email"
        placeholder="Enter the email used for booking"
        value={searchEmail}
        onChange={(event) =>
          setSearchEmail(event.target.value)
        }
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
        Enter the email address associated with your booking
        to view your appointment history.
      </p>
    </div>
  ) : bookings.length === 0 && !historyLoading ? (
    <div className="empty-state">
      <div className="empty-icon">▦</div>
      <h3>No bookings found</h3>
      <p>
        There are no bookings associated with this email
        address.
      </p>
    </div>
  ) : (
    <div className="bookings-list">
      {bookings.map((booking) => {
        const slot = bookingSlots[booking.slot_id];
        const isConfirmed = booking.status === "confirmed";

        return (
          <article
            className="booking-item"
            key={booking.id}
          >
            <div className="booking-item-main">
              <div className="doctor-avatar">
                {slot?.provider.charAt(0).toUpperCase() || "K"}
              </div>

              <div className="booking-item-details">
                <div className="booking-title-row">
                  <h3>
                    {slot?.provider || "Clinic appointment"}
                  </h3>
                  <span
                    className={`booking-status ${
                      isConfirmed
                        ? "booking-confirmed"
                        : "booking-cancelled"
                    }`}
                  >
                    {booking.status}
                  </span>
                </div>

                <p>Patient: {booking.name}</p>
                <p>Email: {booking.email}</p>
                <p>
                  {slot
                    ? `${formatDate(slot.start)} · ${formatTime(
                        slot.start,
                      )} (Lagos)`
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
                onClick={() => setCancelTarget(booking)}
                disabled={cancellingId === booking.id}
              >
                Cancel booking
              </button>
            )}
          </article>
        );
      })}

      {nextCursor && (
        <div className="load-more">
          <button
            type="button"
            className="secondary-button"
            disabled={historyLoading}
            onClick={() => void fetchBookingHistory(activeSearchEmail, nextCursor)}
          >
            {historyLoading
              ? "Loading..."
              : "Load more bookings"}
          </button>
        </div>
      )}

      {historyLoading && (
        <p className="history-loading">
          Loading booking history...
        </p>
      )}
    </div>
  )}
</section>








) : (
  <section className="appointments-panel reset-panel">
    <div className="panel-heading">
      <div>
        <span className="eyebrow">DEMO DATA MANAGEMENT</span>
        <h2>Reset appointment database</h2>
        <p>
          Replace the current appointments with a fresh set
          of test slots.
        </p>
      </div>
    </div>

    <div className="reset-warning" role="note">
      <span className="reset-warning-icon" aria-hidden="true">
        ⚠
      </span>
      <div>
        <strong>Important: This action deletes existing data.</strong>
        <p>
          Resetting removes all existing appointments, bookings,
          booking attempts, and idempotency records. The new
          appointment slots will be created using the JSON
          provided below.
        </p>
      </div>
    </div>

    <form onSubmit={handleResetPreview}>
      <div className="reset-editor-heading">
        <div>
          <label htmlFor="reset-json">
            Appointment slots — JSON request body
          </label>
          <p>
            Two example appointments are prefilled. You can
            edit, add, or remove slots to create your own
            test dataset.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={() => {
            setResetJson(getDefaultResetJson());
            setResetError("");
            setResetSuccess("");
          }}
          disabled={resetLoading}
        >
          Restore example
        </button>
      </div>

      <textarea
        id="reset-json"
        className="reset-json-editor"
        value={resetJson}
        onChange={(event) => {
          setResetJson(event.target.value);
          setResetError("");
          setResetSuccess("");
        }}
        spellCheck={false}
        rows={19}
        aria-describedby="reset-editor-help"
      />

      <p id="reset-editor-help" className="reset-editor-help">
        Required structure: an object containing a "slots"
        array. Each slot needs an id, provider, start, and end.
        Use ISO 8601 timestamps with timezone offsets.
      </p>

      {resetError && (
        <div className="error-message" role="alert">
          {resetError}
        </div>
      )}

      {resetSuccess && (
        <div className="reset-success" role="status">
          {resetSuccess}
        </div>
      )}

      <div className="reset-footer">
        <span>
          <strong>Note:</strong> This operation cannot be undone.
        </span>

        <button
          type="submit"
          className="danger-button"
          disabled={resetLoading}
        >
          Reset Database
        </button>
      </div>
    </form>
  </section>
)}









          {/* )}    ATTENTION !!!*/}
        </main>
      </div>






      {selectedSlot && (
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
                  {confirmedBooking
                    ? "BOOKING CONFIRMED"
                    : "NEW APPOINTMENT"}
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
                onClick={closeBooking}
                disabled={bookingLoading}
                aria-label="Close booking dialog"
              >
                ×
              </button>
            </div>

            {confirmedBooking ? (
              <div className="confirmation">
                <div className="confirmation-icon">✓</div>

                <h3>Appointment confirmed</h3>
                <p>
                  Your appointment has been successfully booked.
                </p>

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
                    <strong>{selectedSlot.provider}</strong>
                  </div>
                  <div>
                    <span>Date</span>
                    <strong>{formatDate(selectedSlot.start)}</strong>
                  </div>
                  <div>
                    <span>Time (Lagos)</span>
                    <strong>{formatTime(selectedSlot.start)}</strong>
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
                  onClick={closeBooking}
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="selected-appointment">
                  <div className="doctor-avatar">
                    {selectedSlot.provider
                      .replace(/^Dr\.?\s*/i, "")
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div>
                    <strong>{selectedSlot.provider}</strong>
                    <span>
                      {formatDate(selectedSlot.start)} ·{" "}
                      {formatTime(selectedSlot.start)} (Lagos)
                    </span>
                  </div>
                </div>

                <form onSubmit={handleBooking} className="booking-form">
                  <div className="form-field">
                    <label htmlFor="patient-name">
                      Full name
                    </label>
                    <input
                      id="patient-name"
                      type="text"
                      value={patientName}
                      onChange={(event) =>
                        setPatientName(event.target.value)
                      }
                      placeholder="e.g. Ada Obi"
                      autoComplete="name"
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="patient-email">
                      Email address
                    </label>
                    <input
                      id="patient-email"
                      type="email"
                      value={patientEmail}
                      onChange={(event) =>
                        setPatientEmail(event.target.value)
                      }
                      placeholder="e.g. ada@example.com"
                      autoComplete="email"
                      required
                    />
                  </div>

                  {bookingError && (
                    <div className="error-message" role="alert">
                      {bookingError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="primary-button full-width"
                    disabled={bookingLoading}
                  >
                    {bookingLoading
                      ? "Confirming appointment..."
                      : "Confirm appointment →"}
                  </button>
                </form>
              </>
            )}
          </section>
        </div>
      )}





{cancelTarget && (
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
          <h2 id="cancel-modal-title">
            Cancel this appointment?
          </h2>
        </div>

        <button
          type="button"
          className="modal-close"
          onClick={() => setCancelTarget(null)}
          disabled={Boolean(cancellingId)}
          aria-label="Close cancellation dialog"
        >
          ×
        </button>
      </div>

      <p className="cancel-description">
        You're about to cancel the appointment for{" "}
        <strong>{cancelTarget.name}</strong>.
        The appointment slot will become available again.
      </p>

      <div className="cancel-actions">
        <button
          type="button"
          className="secondary-button"
          onClick={() => setCancelTarget(null)}
          disabled={Boolean(cancellingId)}
        >
          Keep appointment
        </button>

        <button
          type="button"
          className="danger-button"
          onClick={() => void handleCancelBooking()}
          disabled={Boolean(cancellingId)}
        >
          {cancellingId
            ? "Cancelling..."
            : "Yes, cancel booking"}
        </button>
      </div>
    </section>
  </div>
)}






{showResetConfirmation && (
  <div className="modal-backdrop">
    <section
      className="booking-modal"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="reset-confirm-title"
      aria-describedby="reset-confirm-description"
    >
      <div className="modal-header">
        <div>
          <span className="eyebrow">CONFIRM DESTRUCTIVE ACTION</span>
          <h2 id="reset-confirm-title">
            Reset all clinic booking data?
          </h2>
        </div>

        <button
          type="button"
          className="modal-close"
          aria-label="Close reset confirmation"
          disabled={resetLoading}
          onClick={() => setShowResetConfirmation(false)}
        >
          ×
        </button>
      </div>

      <p
        id="reset-confirm-description"
        className="cancel-description"
      >
        This will permanently delete all existing appointment
        slots and bookings, replacing them with the slots
        in your JSON editor.
      </p>

      <div className="cancel-actions">
        <button
          type="button"
          className="secondary-button"
          disabled={resetLoading}
          onClick={() => setShowResetConfirmation(false)}
        >
          Go back
        </button>

        <button
          type="button"
          className="danger-button"
          disabled={resetLoading}
          onClick={() => void handleResetConfirm()}
        >
          {resetLoading
            ? "Resetting..."
            : "Yes, reset database"}
        </button>
      </div>
    </section>
  </div>
)}









    </div>
  );
}

export default App;
