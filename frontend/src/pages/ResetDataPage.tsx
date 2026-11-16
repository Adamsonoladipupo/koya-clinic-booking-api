import type { FormEvent } from "react";
import { ResetConfirmationModal } from "../components/reset/ResetConfirmationModal";

interface ResetDataPageProps {
  resetJson: string;
  onResetJsonChange: (value: string) => void;
  resetError: string;
  resetSuccess: string;
  resetLoading: boolean;
  showResetConfirmation: boolean;
  onResetPreview: (event: FormEvent<HTMLFormElement>) => void;
  onResetConfirm: () => void;
  onDismissResetConfirmation: () => void;
  onRestoreExample: () => void;
}

export function ResetDataPage({
  resetJson,
  onResetJsonChange,
  resetError,
  resetSuccess,
  resetLoading,
  showResetConfirmation,
  onResetPreview,
  onResetConfirm,
  onDismissResetConfirmation,
  onRestoreExample,
}: ResetDataPageProps) {
  return (
    <>
      <section className="appointments-panel reset-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">DEMO DATA MANAGEMENT</span>
            <h2>Reset appointment database</h2>
            <p>
              Replace the current appointments with a fresh set of test
              slots.
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
              Resetting removes all existing appointments, bookings, booking
              attempts, and idempotency records. The new appointment slots
              will be created using the JSON provided below.
            </p>
          </div>
        </div>

        <form onSubmit={onResetPreview}>
          <div className="reset-editor-heading">
            <div>
              <label htmlFor="reset-json">
                Appointment slots — JSON request body
              </label>
              <p>
                Two example appointments are prefilled. You can edit, add,
                or remove slots to create your own test dataset.
              </p>
            </div>

            <button
              type="button"
              className="secondary-button"
              onClick={onRestoreExample}
              disabled={resetLoading}
            >
              Restore example
            </button>
          </div>

          <textarea
            id="reset-json"
            className="reset-json-editor"
            value={resetJson}
            onChange={(event) => onResetJsonChange(event.target.value)}
            spellCheck={false}
            rows={19}
            aria-describedby="reset-editor-help"
          />

          <p id="reset-editor-help" className="reset-editor-help">
            Required structure: an object containing a "slots" array. Each
            slot needs an id, provider, start, and end. Use ISO 8601
            timestamps with timezone offsets.
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

      {showResetConfirmation && (
        <ResetConfirmationModal
          loading={resetLoading}
          onConfirm={onResetConfirm}
          onDismiss={onDismissResetConfirmation}
        />
      )}
    </>
  );
}
