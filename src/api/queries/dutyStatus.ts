import { pagedGet, withRetry } from "../geotabClient";
import type { RuntimeConfig } from "../../types/config";
import type { GeotabApi } from "../../types/geotab";

export async function fetchDutyStatusLogs(
  api: GeotabApi,
  config: RuntimeConfig,
  fromUtcIso: string,
  toUtcIso: string,
  groupIds: string[],
  onProgress: (message: string) => void
): Promise<Array<Record<string, unknown>>> {
  const search: Record<string, unknown> = {
    fromDate: fromUtcIso,
    toDate: toUtcIso,
    states: config.dutyStatus.states,
    statuses: config.dutyStatus.statuses,
    includeBoundaryLogs: false,
    includeModifications: false
  };

  if (groupIds.length) {
    search.deviceSearch = {
      groups: groupIds.map((id) => ({ id }))
    };
  }

  return withRetry(
    () =>
      pagedGet<Record<string, unknown>>(
        api,
        {
          typeName: "DutyStatusLog",
          search,
          resultsLimit: config.pagination.dutyStatusResultsLimit,
          sortBy: "date",
          extractOffset: (item) => item.dateTime
        },
        (_, pageSize, total) => {
          onProgress(`DutyStatusLog fetched: +${pageSize} rows (${total} total)`);
        }
      ),
    config.retries.maxAttempts,
    config.retries.baseDelayMs
  );
}
