import { useState } from "react";

import { Sidebar } from "./components/layout/Sidebar";
import { Header } from "./components/layout/Header";
import { WelcomeBanner } from "./components/layout/WelcomeBanner";
import { ConnectPage } from "./pages/ConnectPage";
import { AppointmentsPage } from "./pages/AppointmentsPage";
import { MyBookingsPage } from "./pages/MyBookingsPage";
import { ResetDataPage } from "./pages/ResetDataPage";

import { useClinicConnection } from "./hooks/useClinicConnection";
import { useAppointments } from "./hooks/useAppointments";
import { useBookings } from "./hooks/useBookings";
import { useResetData } from "./hooks/useResetData";

import type { View } from "./types/navigation";

import "./App.css";

function App() {
  const [view, setView] = useState<View>("appointments");

  const appointments = useAppointments();
  const bookings = useBookings();
  const resetData = useResetData();

  const connection = useClinicConnection({
    onConnected: (key) => void appointments.loadSlots(key),
  });

  // ── cross-hook reset (called on disconnect) ──────────────────────────────────

  function handleDisconnect(): void {
    connection.handleDisconnect(() => {
      appointments.reset();
      bookings.reset();
      resetData.reset();
      setView("appointments");
    });
  }

  // ── post-reset sync (called after a successful /reset) ───────────────────────

  async function handleResetComplete(key: string): Promise<void> {
    bookings.reset();
    appointments.setProvider("all");
    appointments.setAvailability("available");
    await appointments.loadSlots(key);
  }

  // ── render ───────────────────────────────────────────────────────────────────

  const { apiKey } = connection;

  return (
    <div className="app-shell">
      <Sidebar view={view} onViewChange={setView} />

      <div className="main-column">
        <Header
          view={view}
          apiKey={apiKey}
          onDisconnect={handleDisconnect}
        />

        <main className="main-content">
          <WelcomeBanner view={view} />

          {!apiKey ? (
            <ConnectPage
              apiKeyInput={connection.apiKeyInput}
              onApiKeyInputChange={connection.setApiKeyInput}
              showApiKey={connection.showApiKey}
              onToggleShowApiKey={connection.toggleShowApiKey}
              connecting={connection.connecting}
              error={connection.connectError}
              onConnect={connection.handleConnect}
            />
          ) : view === "appointments" ? (
            <AppointmentsPage
              slots={appointments.slots}
              filteredSlots={appointments.filteredSlots}
              providers={appointments.providers}
              provider={appointments.provider}
              onProviderChange={appointments.setProvider}
              availability={appointments.availability}
              onAvailabilityChange={appointments.setAvailability}
              loading={appointments.loading}
              error={appointments.slotsError}
              onRefresh={() => void appointments.loadSlots(apiKey)}
              onOpenBooking={appointments.openBooking}
              availableCount={appointments.availableCount}
              providerCount={appointments.providerCount}
              selectedSlot={appointments.selectedSlot}
              confirmedBooking={appointments.confirmedBooking}
              bookingLoading={appointments.bookingLoading}
              bookingError={appointments.bookingError}
              patientName={appointments.patientName}
              onPatientNameChange={appointments.setPatientName}
              patientEmail={appointments.patientEmail}
              onPatientEmailChange={appointments.setPatientEmail}
              onBooking={(event) =>
                void appointments.handleBooking(event, apiKey)
              }
              onCloseBooking={appointments.closeBooking}
            />
          ) : view === "bookings" ? (
            <MyBookingsPage
              searchEmail={bookings.searchEmail}
              onSearchEmailChange={bookings.setSearchEmail}
              bookings={bookings.bookings}
              bookingSlots={appointments.bookingSlots}
              nextCursor={bookings.nextCursor}
              historyLoading={bookings.historyLoading}
              historyError={bookings.historyError}
              historySearched={bookings.historySearched}
              cancellingId={bookings.cancellingId}
              cancelTarget={bookings.cancelTarget}
              onBookingSearch={(event) =>
                void bookings.handleBookingSearch(event, apiKey)
              }
              onLoadMore={() => void bookings.loadMore(apiKey)}
              onSetCancelTarget={bookings.setCancelTarget}
              onConfirmCancel={() =>
                void bookings.handleCancelBooking(
                  apiKey,
                  appointments.loadSlots,
                )
              }
              onDismissCancelTarget={() => bookings.setCancelTarget(null)}
            />
          ) : (
            <ResetDataPage
              resetJson={resetData.resetJson}
              onResetJsonChange={resetData.setResetJson}
              resetError={resetData.resetError}
              resetSuccess={resetData.resetSuccess}
              resetLoading={resetData.resetLoading}
              showResetConfirmation={resetData.showResetConfirmation}
              onResetPreview={resetData.handleResetPreview}
              onResetConfirm={() =>
                void resetData.handleResetConfirm(
                  apiKey,
                  handleResetComplete,
                )
              }
              onDismissResetConfirmation={
                resetData.dismissResetConfirmation
              }
              onRestoreExample={resetData.restoreExample}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
