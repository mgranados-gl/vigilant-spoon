import type { GeotabApi } from "../types/geotab";

export interface PagedGetOptions<T> {
  typeName: string;
  search?: Record<string, unknown>;
  resultsLimit: number;
  sortBy: "date" | "name" | "id" | "version";
  sortDirection?: "asc" | "desc";
  extractOffset: (item: T) => unknown;
}

export async function callApi<T>(
  api: GeotabApi,
  method: string,
  params: Record<string, unknown>
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    api.call<T>(method, params, resolve, reject);
  });
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  maxAttempts: number,
  baseDelayMs: number
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts) {
        break;
      }
      await sleep(baseDelayMs * attempt);
    }
  }

  throw lastError;
}

export async function pagedGet<T>(
  api: GeotabApi,
  options: PagedGetOptions<T>,
  onPage: (pageIndex: number, pageSize: number, total: number) => void
): Promise<T[]> {
  const all: T[] = [];
  let offset: unknown = null;
  let lastId: string | null = null;
  let pageIndex = 0;

  while (true) {
    const page = await callApi<T[]>(api, "Get", {
      typeName: options.typeName,
      search: options.search,
      resultsLimit: options.resultsLimit,
      sort: {
        sortBy: options.sortBy,
        sortDirection: options.sortDirection ?? "asc",
        offset,
        lastId
      }
    });

    if (!page.length) {
      break;
    }

    all.push(...page);
    onPage(pageIndex, page.length, all.length);

    const last = page[page.length - 1] as Record<string, unknown>;
    offset = options.extractOffset(page[page.length - 1]);
    lastId = typeof last.id === "string" ? last.id : null;
    pageIndex += 1;

    if (offset == null) {
      break;
    }
  }

  return all;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
