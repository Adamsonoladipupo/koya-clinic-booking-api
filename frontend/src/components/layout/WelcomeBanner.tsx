import type { View } from "../../types/navigation";

interface WelcomeBannerProps {
  view: View;
}

export function WelcomeBanner({ view }: WelcomeBannerProps) {
  const heading =
    view === "appointments"
      ? "Find your next appointment"
      : view === "bookings"
        ? "Manage your bookings"
        : "Reset appointment data";

  const description =
    view === "appointments"
      ? "Explore available appointments and find the right time for your care."
      : view === "bookings"
        ? "View and manage your clinic appointments in one place."
        : "Replace the demo appointment slots with your own test data.";

  return (
    <section className="welcome">
      <div>
        <span className="eyebrow">YOUR HEALTH, OUR PRIORITY</span>
        <h1>{heading}</h1>
        <p>{description}</p>
      </div>
      <div className="welcome-decoration" aria-hidden="true">
        ✳
      </div>
    </section>
  );
}
