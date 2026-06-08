import { pagedGet, withRetry } from "../geotabClient";
import type { RuntimeConfig } from "../../types/config";
import type { GeotabApi } from "../../types/geotab";

export async function fetchExceptionEvents(
  api: GeotabApi,
  config: RuntimeConfig,
  fromUtcIso: string,
  toUtcIso: string,
  groupIds: string[],
  onProgress: (message: string) => void
): Promise<Array<Record<string, unknown>>> {
  const allById = new Map<string, Record<string, unknown>>();
  const ruleIds = [config.exceptionRuleIds.enteringOffice, config.exceptionRuleIds.exitingOffice].filter(
    (id) => id
  );

  for (const ruleId of ruleIds) {
    const search: Record<string, unknown> = {
      fromDate: fromUtcIso,
      toDate: toUtcIso,
      ruleSearch: { id: ruleId },
      includeInvalidated: false
    };

    if (groupIds.length) {
      search.deviceSearch = {
        groups: groupIds.map((id) => ({ id }))
      };
    }

    const events = await withRetry(
      () =>
        pagedGet<Record<string, unknown>>(
          api,
          {
            typeName: "ExceptionEvent",
            search,
            resultsLimit: config.pagination.exceptionResultsLimit,
            sortBy: "date",
            extractOffset: (item) => item.activeFrom
          },
          (_, pageSize, total) => {
            onProgress(`ExceptionEvent (${ruleId}) fetched: +${pageSize} rows (${total} total)`);
          }
        ),
      config.retries.maxAttempts,
      config.retries.baseDelayMs
    );

    for (const event of events) {
      const id = typeof event.id === "string" ? event.id : `${ruleId}-${allById.size}`;
      allById.set(id, event);
    }
  }

  return Array.from(allById.values());
}
