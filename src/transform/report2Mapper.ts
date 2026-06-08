import { getPrimaryCompanyGroupName, getPrimaryGroupName } from "./groupHelpers";

function safe(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value);
}

function getId(ref: unknown): string {
  if (!ref || typeof ref !== "object") {
    return "";
  }
  return safe((ref as { id?: unknown }).id);
}

function first(...values: unknown[]): string {
  for (const value of values) {
    const normalized = safe(value);
    if (normalized) {
      return normalized;
    }
  }
  return "";
}

export function mapReport2Rows(events: any[], lookups: {
  usersById: Map<string, any>;
  devicesById: Map<string, any>;
  rulesById: Map<string, any>;
  groupsById: Map<string, any>;
  zonesById: Map<string, any>;
}): string[][] {
  return events
    .sort((a, b) => safe(a.activeFrom).localeCompare(safe(b.activeFrom)))
    .map((event) => {
      const deviceId = getId(event.device);
      const driverId = getId(event.driver);
      const ruleId = getId(event.rule);
      const zoneId = first(getId(event.zone), getId(event.location?.zone));

      const device = lookups.devicesById.get(deviceId);
      const driver = lookups.usersById.get(driverId);
      const rule = lookups.rulesById.get(ruleId);
      const zone = lookups.zonesById.get(zoneId);

      const zoneTypes = Array.isArray(zone?.zoneTypes)
        ? zone.zoneTypes.map((z: any) => safe(z?.name ?? z?.id)).filter(Boolean).join(",")
        : "";

      return [
        safe(device?.name),
        safe(deviceId),
        safe(device?.comment),
        getPrimaryGroupName(lookups.groupsById, device?.groups),
        getPrimaryCompanyGroupName(lookups.groupsById, device?.groups),
        safe(driver?.firstName),
        safe(driver?.lastName),
        safe(driver?.name),
        safe(driverId),
        safe(driver?.comment),
        getPrimaryGroupName(lookups.groupsById, driver?.companyGroups),
        getPrimaryCompanyGroupName(lookups.groupsById, driver?.companyGroups),
        safe(rule?.name),
        first(event.longitude, event.location?.longitude, event.coordinate?.x),
        first(event.latitude, event.location?.latitude, event.coordinate?.y),
        first(event.location?.formattedAddress, event.location?.name, event.address),
        zoneTypes,
        safe(zone?.externalReference),
        safe(event.activeFrom),
        safe(event.duration),
        safe(event.distance),
        first(event.extraInfo, event.details?.extraInfo),
        first(event.details, event.details?.description),
        safe(event.state)
      ];
    });
}
