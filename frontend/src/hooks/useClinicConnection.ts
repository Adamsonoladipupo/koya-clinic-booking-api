import { useState } from "react";
import type { FormEvent } from "react";
import { ApiError, clinicApi } from "../lib/api";

export interface UseClinicConnectionReturn {
  apiKey: string | null;
  apiKeyInput: string;
  setApiKeyInput: (value: string) => void;
  showApiKey: boolean;
  toggleShowApiKey: () => void;
  connecting: boolean;
  connectError: string;
  handleConnect: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  /** Clears all connection state, then calls onReset to let callers clear their own state. */
  handleDisconnect: (onReset: () => void) => void;
}

interface UseClinicConnectionOptions {
  /** Called with the verified key immediately after a successful connection. */
  onConnected?: (apiKey: string) => void;
}

export function useClinicConnection(
  options: UseClinicConnectionOptions = {},
): UseClinicConnectionReturn {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState("");

  async function handleConnect(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    const key = apiKeyInput.trim();

    if (!key) {
      setConnectError("Please enter your API key.");
      return;
    }

    setConnecting(true);
    setConnectError("");

    try {
      // A successful authenticated request verifies the key.
      await clinicApi.getSlots(key);

      setApiKey(key);
      setApiKeyInput("");
      setShowApiKey(false);

      options.onConnected?.(key);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setConnectError("Invalid API key. Please check and try again.");
      } else {
        setConnectError(
          err instanceof Error
            ? err.message
            : "Unable to connect to the clinic API.",
        );
      }
    } finally {
      setConnecting(false);
    }
  }

  function handleDisconnect(onReset: () => void): void {
    setApiKey(null);
    setApiKeyInput("");
    setShowApiKey(false);
    setConnectError("");
    onReset();
  }

  return {
    apiKey,
    apiKeyInput,
    setApiKeyInput,
    showApiKey,
    toggleShowApiKey: () => setShowApiKey((v) => !v),
    connecting,
    connectError,
    handleConnect,
    handleDisconnect,
  };
}
