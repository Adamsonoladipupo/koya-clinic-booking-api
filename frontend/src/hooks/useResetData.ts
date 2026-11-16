import { useState } from "react";
import type { FormEvent } from "react";
import { clinicApi } from "../lib/api";
import {
  getDefaultResetJson,
  parseResetSlots,
} from "../utils/resetValidation";

export interface UseResetDataReturn {
  resetJson: string;
  setResetJson: (value: string) => void;
  resetError: string;
  resetSuccess: string;
  resetLoading: boolean;
  showResetConfirmation: boolean;
  handleResetPreview: (event: FormEvent<HTMLFormElement>) => void;
  handleResetConfirm: (
    apiKey: string,
    onComplete: (key: string) => Promise<void>,
  ) => Promise<void>;
  dismissResetConfirmation: () => void;
  restoreExample: () => void;
  reset: () => void;
}

export function useResetData(): UseResetDataReturn {
  const [resetJson, setResetJsonRaw] = useState(getDefaultResetJson);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [showResetConfirmation, setShowResetConfirmation] =
    useState(false);

  function setResetJson(value: string): void {
    setResetJsonRaw(value);
    setResetError("");
    setResetSuccess("");
  }

  function handleResetPreview(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setResetError("");
    setResetSuccess("");

    try {
      parseResetSlots(resetJson);
      setShowResetConfirmation(true);
    } catch (err) {
      setResetError(
        err instanceof SyntaxError
          ? "Invalid JSON. Check the formatting and try again."
          : err instanceof Error
            ? err.message
            : "Invalid reset request.",
      );
    }
  }

  async function handleResetConfirm(
    apiKey: string,
    onComplete: (key: string) => Promise<void>,
  ): Promise<void> {
    if (resetLoading) return;

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

      await onComplete(apiKey);
    } catch (err) {
      setShowResetConfirmation(false);
      setResetError(
        err instanceof Error ? err.message : "The reset request failed.",
      );
    } finally {
      setResetLoading(false);
    }
  }

  function dismissResetConfirmation(): void {
    setShowResetConfirmation(false);
  }

  function restoreExample(): void {
    setResetJsonRaw(getDefaultResetJson());
    setResetError("");
    setResetSuccess("");
  }

  function reset(): void {
    setResetError("");
    setResetSuccess("");
    setShowResetConfirmation(false);
  }

  return {
    resetJson,
    setResetJson,
    resetError,
    resetSuccess,
    resetLoading,
    showResetConfirmation,
    handleResetPreview,
    handleResetConfirm,
    dismissResetConfirmation,
    restoreExample,
    reset,
  };
}
