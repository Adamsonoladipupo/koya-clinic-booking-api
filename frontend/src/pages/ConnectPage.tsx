import type { FormEvent } from "react";
import { EyeIcon } from "../components/common/EyeIcon";

interface ConnectPageProps {
  apiKeyInput: string;
  onApiKeyInputChange: (value: string) => void;
  showApiKey: boolean;
  onToggleShowApiKey: () => void;
  connecting: boolean;
  error: string;
  onConnect: (event: FormEvent<HTMLFormElement>) => void;
}

export function ConnectPage({
  apiKeyInput,
  onApiKeyInputChange,
  showApiKey,
  onToggleShowApiKey,
  connecting,
  error,
  onConnect,
}: ConnectPageProps) {
  return (
    <section className="connect-layout">
      <div className="connect-card">
        <div className="connect-icon">⌁</div>
        <span className="eyebrow">SECURE CONNECTION</span>
        <h2>Connect to Koya Clinic</h2>
        <p className="muted">
          Enter your API key to access appointment availability and
          manage your bookings.
        </p>

        <form onSubmit={onConnect}>
          <label htmlFor="api-key">Your API key</label>

          <div className="password-field">
            <input
              id="api-key"
              type={showApiKey ? "text" : "password"}
              value={apiKeyInput}
              onChange={(event) => onApiKeyInputChange(event.target.value)}
              placeholder="Enter your API key"
              autoComplete="off"
              spellCheck={false}
              required
            />

            <button
              type="button"
              className="eye-button"
              onClick={onToggleShowApiKey}
              aria-label={showApiKey ? "Hide API key" : "Show API key"}
              aria-pressed={showApiKey}
              title={showApiKey ? "Hide API key" : "Show API key"}
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
            {connecting ? "Connecting..." : "Connect to Clinic"}
            <span aria-hidden="true">→</span>
          </button>
        </form>

        <div className="security-note">
          <span>♧</span>
          <p>
            Your key is kept temporarily in this browser tab's memory and
            is cleared when you refresh or disconnect.
          </p>
        </div>
      </div>

      <div className="connect-info">
        <div className="info-icon">✚</div>
        <h3>Better care starts here.</h3>
        <p>
          Find available doctors, choose a convenient time, and manage
          your appointments from one simple dashboard.
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
  );
}
