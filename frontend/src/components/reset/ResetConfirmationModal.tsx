interface ResetConfirmationModalProps {
  loading: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
}

export function ResetConfirmationModal({
  loading,
  onConfirm,
  onDismiss,
}: ResetConfirmationModalProps) {
  return (
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
            disabled={loading}
            onClick={onDismiss}
          >
            ×
          </button>
        </div>

        <p id="reset-confirm-description" className="cancel-description">
          This will permanently delete all existing appointment slots and
          bookings, replacing them with the slots in your JSON editor.
        </p>

        <div className="cancel-actions">
          <button
            type="button"
            className="secondary-button"
            disabled={loading}
            onClick={onDismiss}
          >
            Go back
          </button>

          <button
            type="button"
            className="danger-button"
            disabled={loading}
            onClick={onConfirm}
          >
            {loading ? "Resetting..." : "Yes, reset database"}
          </button>
        </div>
      </section>
    </div>
  );
}
