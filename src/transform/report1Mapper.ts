import type { LookupSet } from "../api/lookups/entities";

export const REPORT1_HEADERS = [
  "DutyStatusDateTime",
  "DutyStatusStatus",
  ".StatusLog.Driver.UserFirstName",
  ".StatusLog.Driver.UserLastName",
  ".StatusLog.Driver.UserName",
  ".StatusLog.Driver.DriverGroup",
  "DutyStatusId",
  "DutyStatusDetailDuration",
  "DutyStatusDetailDistance",
  "DutyStatusSequence"
] as const;

export function mapReport1Rows(
  logs: Array<Record<string, unknown>>,
  lookups: LookupSet
): string[][] {
  const derived = computeDetailValues(logs);

  return logs.map((log) => {
    const logId = asString(log.id);
    const driverId = asString((log.driver as Record<string, unknown> | undefined)?.id);
    const driver = driverId ? lookups.users.get(driverId) : undefined;
    const driverGroups = asArray(driver?.driverGroups);

    const detail = logId ? derived.get(logId) : undefined;

    return [
      asString(log.dateTime),
      asString(log.status),
      asString(driver?.firstName),
      asString(driver?.lastName),
      asString(driver?.name),
      pickGroupName(driverGroups, lookups),
      logId,
      detail?.duration ?? "",
      detail?.distance ?? "",
      asString(log.sequence)
    ];
  });
}

function computeDetailValues(logs: Array<Record<string, unknown>>): Map<string, { duration: string; distance: string }> {
  const byDriver = new Map<string, Array<Record<string, unknown>>>();

  for (const log of logs) {
    const driverId = asString((log.driver as Record<string, unknown> | undefined)?.id);
    if (!driverId) {
      continue;
    }
    const group = byDriver.get(driverId) ?? [];
    group.push(log);
    byDriver.set(driverId, group);
  }

  const derived = new Map<string, { duration: string; distance: string }>();

  for (const groupLogs of byDriver.values()) {
    groupLogs.sort((a, b) => {
      const left = Date.parse(asString(a.dateTime));
      const right = Date.parse(asString(b.dateTime));
      return left - right;
    });

    for (let index = 0; index < groupLogs.length; index += 1) {
      const current = groupLogs[index];
      const next = groupLogs[index + 1];
      const id = asString(current.id);
      if (!id) {
        continue;
      }

      if (!next) {
        derived.set(id, { duration: "", distance: "" });
        continue;
      }

      const currentTime = Date.parse(asString(current.dateTime));
      const nextTime = Date.parse(asString(next.dateTime));
      const durationSeconds = Number.isFinite(currentTime) && Number.isFinite(nextTime) ? Math.max(0, Math.round((nextTime - currentTime) / 1000)) : NaN;

      const currentOdo = asNumber(current.odometer);
      const nextOdo = asNumber(next.odometer);
      const distanceMeters = Number.isFinite(currentOdo) && Number.isFinite(nextOdo) ? Math.max(0, Math.round(nextOdo - currentOdo)) : NaN;

      derived.set(id, {
        duration: Number.isFinite(durationSeconds) ? String(durationSeconds) : "",
        distance: Number.isFinite(distanceMeters) ? String(distanceMeters) : ""
      });
    }
  }

  return derived;
}

function pickGroupName(groups: Array<Record<string, unknown>>, lookups: LookupSet): string {
  for (const groupRef of groups) {
    if (typeof groupRef.id !== "string") {
      continue;
    }
    const group = lookups.groups.get(groupRef.id);
    if (group && typeof group.name === "string") {
      return group.name;
    }
  }
  return "";
}

function asArray(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value) ? (value as Array<Record<string, unknown>>) : [];
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asNumber(value: unknown): number {
  return typeof value === "number" ? value : Number.NaN;
}
