import { callApi } from "../geotabClient";
import type { GeotabApi } from "../../types/geotab";

export interface LookupSet {
  users: Map<string, Record<string, unknown>>;
  devices: Map<string, Record<string, unknown>>;
  rules: Map<string, Record<string, unknown>>;
  groups: Map<string, Record<string, unknown>>;
  zones: Map<string, Record<string, unknown>>;
}

export async function loadLookups(
  api: GeotabApi,
  dutyLogs: Array<Record<string, unknown>>,
  exceptionEvents: Array<Record<string, unknown>>,
  onProgress: (message: string) => void
): Promise<LookupSet> {
  const userIds = new Set<string>();
  const deviceIds = new Set<string>();
  const ruleIds = new Set<string>();
  const zoneIds = new Set<string>();

  for (const log of dutyLogs) {
    const driverId = readNestedId(log, ["driver", "id"]);
    const deviceId = readNestedId(log, ["device", "id"]);
    if (driverId) userIds.add(driverId);
    if (deviceId) deviceIds.add(deviceId);
  }

  for (const event of exceptionEvents) {
    const driverId = readNestedId(event, ["driver", "id"]);
    const deviceId = readNestedId(event, ["device", "id"]);
    const ruleId = readNestedId(event, ["rule", "id"]);
    const zoneId =
      readNestedId(event, ["zone", "id"]) ??
      readNestedId(event, ["location", "zone", "id"]) ??
      readNestedId(event, ["details", "zone", "id"]);

    if (driverId) userIds.add(driverId);
    if (deviceId) deviceIds.add(deviceId);
    if (ruleId) ruleIds.add(ruleId);
    if (zoneId) zoneIds.add(zoneId);
  }

  const users = await fetchEntitiesById(api, "User", Array.from(userIds));
  onProgress(`User lookups loaded: ${users.size}`);
  const devices = await fetchEntitiesById(api, "Device", Array.from(deviceIds));
  onProgress(`Device lookups loaded: ${devices.size}`);
  const rules = await fetchEntitiesById(api, "Rule", Array.from(ruleIds));
  onProgress(`Rule lookups loaded: ${rules.size}`);
  const zones = await fetchEntitiesById(api, "Zone", Array.from(zoneIds));
  onProgress(`Zone lookups loaded: ${zones.size}`);

  const groupIds = new Set<string>();
  for (const user of users.values()) {
    for (const group of asArray(user.companyGroups)) {
      if (group && typeof group.id === "string") groupIds.add(group.id);
    }
    for (const group of asArray(user.driverGroups)) {
      if (group && typeof group.id === "string") groupIds.add(group.id);
    }
  }
  for (const device of devices.values()) {
    for (const group of asArray(device.groups)) {
      if (group && typeof group.id === "string") groupIds.add(group.id);
    }
  }
  for (const zone of zones.values()) {
    for (const group of asArray(zone.groups)) {
      if (group && typeof group.id === "string") groupIds.add(group.id);
    }
  }

  const groups = await fetchEntitiesById(api, "Group", Array.from(groupIds));
  onProgress(`Group lookups loaded: ${groups.size}`);

  return { users, devices, rules, groups, zones };
}

async function fetchEntitiesById(
  api: GeotabApi,
  typeName: string,
  ids: string[]
): Promise<Map<string, Record<string, unknown>>> {
  const map = new Map<string, Record<string, unknown>>();
  for (const id of ids) {
    const rows = await callApi<Array<Record<string, unknown>>>(api, "Get", {
      typeName,
      search: { id }
    });

    const entity = rows[0];
    if (entity && typeof entity.id === "string") {
      map.set(entity.id, entity);
    }
  }
  return map;
}

function readNestedId(entity: Record<string, unknown>, path: string[]): string | null {
  let current: unknown = entity;
  for (const key of path) {
    if (!current || typeof current !== "object") {
      return null;
    }
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === "string" ? current : null;
}

function asArray(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value) ? (value as Array<Record<string, unknown>>) : [];
}
