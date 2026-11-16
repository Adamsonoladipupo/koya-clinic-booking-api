interface AppointmentFiltersProps {
  providers: string[];
  provider: string;
  onProviderChange: (value: string) => void;
  availability: string;
  onAvailabilityChange: (value: string) => void;
}

export function AppointmentFilters({
  providers,
  provider,
  onProviderChange,
  availability,
  onAvailabilityChange,
}: AppointmentFiltersProps) {
  return (
    <div className="filter-bar">
      <div className="filter-field">
        <label htmlFor="provider-filter">Provider</label>
        <select
          id="provider-filter"
          value={provider}
          onChange={(event) => onProviderChange(event.target.value)}
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
        <label htmlFor="availability-filter">Availability</label>
        <select
          id="availability-filter"
          value={availability}
          onChange={(event) => onAvailabilityChange(event.target.value)}
        >
          <option value="available">Available only</option>
          <option value="all">All slots</option>
          <option value="booked">Booked only</option>
        </select>
      </div>
    </div>
  );
}
