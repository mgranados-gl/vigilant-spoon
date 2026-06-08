import type { RuntimeConfig } from "../types/config";
import type { GeotabApi } from "../types/geotab";
import { getYesterdayEasternWindowUtc } from "../time/dateWindow";
import { fetchDutyStatusLogs } from "../api/queries/dutyStatus";
import { fetchExceptionEvents } from "../api/queries/exceptionEvents";
import { loadLookups } from "../api/lookups/entities";
import { DATA1_HEADERS, DATA2_HEADERS } from "../transform/headers";
import { mapReport1Rows } from "../transform/report1Mapper";
import { mapReport2Rows } from "../transform/report2Mapper";
import { writeAndDownloadWorkbook } from "../excel/workbookService";

export async function runWorkbookGeneration(
  api: GeotabApi,
  state: { getGroupFilter?: () => string[]; getAdvancedGroupFilter?: () => { groupFilterConditions?: Array<{ id?: string }> } },
  config: RuntimeConfig,
  onStatus: (message: string) => void
): Promise<{ data1Count: number; data2Count: number; label: string }> {
  validateConfig(config);

  const dateWindow = getYesterdayEasternWindowUtc();
  onStatus(`Date window ET yesterday: ${dateWindow.localLabel}`);

  const groupIds = getScopedGroupIds(state);
  onStatus(groupIds.length ? `Using ${groupIds.length} selected group filters` : "Using all accessible groups");

  const dutyLogs = await fetchDutyStatusLogs(
    api,
    config,
    dateWindow.fromUtcIso,
    dateWindow.toUtcIso,
    groupIds,
    onStatus
  );

  const exceptionEvents = await fetchExceptionEvents(
    api,
    config,
    dateWindow.fromUtcIso,
    dateWindow.toUtcIso,
    groupIds,
    onStatus
  );

  onStatus("Resolving related entities (users/devices/rules/groups/zones)");
  const lookups = await loadLookups(api, dutyLogs, exceptionEvents, onStatus);

  const data1Rows = mapReport1Rows(dutyLogs as any[], lookups as any);
  const data2Rows = mapReport2Rows(exceptionEvents as any[], {
    usersById: lookups.users,
    devicesById: lookups.devices,
    rulesById: lookups.rules,
    groupsById: lookups.groups,
    zonesById: lookups.zones
  });

  onStatus("Writing workbook from template");
  await writeAndDownloadWorkbook({
    templatePath: config.templatePath,
    outputFileName: `${config.outputFileNamePrefix}-${dateWindow.localLabel}.xlsx`,
    data1SheetName: config.worksheets.data1,
    data2SheetName: config.worksheets.data2,
    data1Headers: [...DATA1_HEADERS],
    data2Headers: [...DATA2_HEADERS],
    data1Rows,
    data2Rows
  });

  return {
    data1Count: data1Rows.length,
    data2Count: data2Rows.length,
    label: dateWindow.localLabel
  };
}

function validateConfig(config: RuntimeConfig): void {
  if (!config.exceptionRuleIds.enteringOffice || !config.exceptionRuleIds.exitingOffice) {
    throw new Error("Exception Rule IDs are required in runtime config.");
  }
}

function getScopedGroupIds(state: {
  getGroupFilter?: () => string[];
  getAdvancedGroupFilter?: () => { groupFilterConditions?: Array<{ id?: string }> };
}): string[] {
  const advanced = state.getAdvancedGroupFilter?.();
  const advancedIds = (advanced?.groupFilterConditions ?? [])
    .map((entry) => entry.id)
    .filter((id): id is string => typeof id === "string" && id.length > 0);

  if (advancedIds.length) {
    return Array.from(new Set(advancedIds));
  }

  const simple = state.getGroupFilter?.() ?? [];
  return Array.from(new Set(simple.filter((id): id is string => typeof id === "string" && id.length > 0)));
}
