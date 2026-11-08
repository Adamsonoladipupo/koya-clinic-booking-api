import "./App.css";

function App() {
  return (
    <main className="app">
      <header className="app-header">
        <p className="eyebrow">KOYA CLINIC</p>
        <h1>Book Your Appointment</h1>
        <p>
          Find an available appointment slot with
          your preferred healthcare provider.
        </p>
      </header>

      <section className="booking-section">
        <h2>Available Appointments</h2>
        <p>
          Appointment slots will appear here once
          the booking API is connected.
        </p>
      </section>
    </main>
  );
}

export default App;