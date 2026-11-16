interface AppointmentStatsProps {
  total: number;
  available: number;
  providerCount: number;
}

export function AppointmentStats({
  total,
  available,
  providerCount,
}: AppointmentStatsProps) {
  return (
    <section className="stats-grid">
      <div className="stat-card">
        <span>Total appointments</span>
        <strong>{total}</strong>
        <small>Across all providers</small>
      </div>
      <div className="stat-card">
        <span>Available slots</span>
        <strong>{available}</strong>
        <small>Ready for booking</small>
      </div>
      <div className="stat-card">
        <span>Healthcare providers</span>
        <strong>{providerCount}</strong>
        <small>Available in the system</small>
      </div>
    </section>
  );
}
