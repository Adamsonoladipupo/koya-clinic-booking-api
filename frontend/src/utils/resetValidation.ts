import type { AppointmentSlot } from "../lib/api";

export type ResetSlot = Pick<
  AppointmentSlot,
  "id" | "provider" | "start" | "end"
>;

export function getDefaultResetJson(): string {
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(tomorrow);

  const sample = {
    slots: [
      {
        id: "s1",
        provider: "Dr. Ade",
        start: `${date}T09:00:00+01:00`,
        end: `${date}T09:30:00+01:00`,
      },
      {
        id: "s2",
        provider: "Dr. Adaeze Okafor",
        start: `${date}T10:00:00+01:00`,
        end: `${date}T10:30:00+01:00`,
      },
    ],
  };

  return JSON.stringify(sample, null, 2);
}

export function parseResetSlots(input: string): ResetSlot[] {
  const payload: unknown = JSON.parse(input);

  if (
    typeof payload !== "object" ||
    payload === null ||
    !("slots" in payload) ||
    !Array.isArray(payload.slots)
  ) {
    throw new Error(
      'The request body must contain a "slots" array.',
    );
  }

  const slots: unknown[] = payload.slots;
  const ids = new Set<string>();
  const now = Date.now();

  if (slots.length === 0) {
    throw new Error("Provide at least one appointment slot.");
  }

  if (slots.length > 100) {
    throw new Error(
      "For this demo, submit at most 100 slots at a time.",
    );
  }

  return slots.map((value, index) => {
    if (typeof value !== "object" || value === null) {
      throw new Error(`Slot ${index + 1} must be an object.`);
    }

    const slot = value as Record<string, unknown>;

    for (const field of ["id", "provider", "start", "end"]) {
      if (
        typeof slot[field] !== "string" ||
        !(slot[field] as string).trim()
      ) {
        throw new Error(
          `Slot ${index + 1}: "${field}" must be a non-empty string.`,
        );
      }
    }

    const id = slot.id as string;
    const provider = slot.provider as string;
    const start = slot.start as string;
    const end = slot.end as string;

    if (id.length > 100 || provider.length > 255) {
      throw new Error(
        `Slot ${index + 1}: ID or provider name is too long.`,
      );
    }

    if (ids.has(id)) {
      throw new Error(`Duplicate slot ID: ${id}`);
    }

    ids.add(id);

    const timezonePattern = /(Z|[+-]\d{2}:\d{2})$/i;

    if (
      !timezonePattern.test(start) ||
      !timezonePattern.test(end) ||
      !Number.isFinite(Date.parse(start)) ||
      !Number.isFinite(Date.parse(end))
    ) {
      throw new Error(
        `Slot ${index + 1}: provide valid ISO timestamps with timezone offsets.`,
      );
    }

    if (Date.parse(start) <= now) {
      throw new Error(
        `Slot ${index + 1}: appointment must be in the future.`,
      );
    }

    if (Date.parse(end) <= Date.parse(start)) {
      throw new Error(
        `Slot ${index + 1}: end must be after start.`,
      );
    }

    return { id, provider, start, end };
  });
}
