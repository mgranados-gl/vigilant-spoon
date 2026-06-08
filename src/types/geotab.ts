export interface GeotabApi {
  call<T = unknown>(
    method: string,
    params: Record<string, unknown>,
    success: (result: T) => void,
    failure: (error: unknown) => void
  ): void;
  multiCall?<T = unknown[]>(
    calls: Array<[string, Record<string, unknown>]>,
    success: (results: T) => void,
    failure: (error: unknown) => void
  ): void;
}

export interface GeotabState {
  getGroupFilter?(): string[];
  getAdvancedGroupFilter?(): {
    relation?: string;
    groupFilterConditions?: Array<{ id?: string }>;
  };
}

export interface AddInLifecycle {
  initialize: (api: GeotabApi, state: GeotabState, callback: () => void) => void;
  focus?: (api: GeotabApi, state: GeotabState) => void;
  blur?: (api: GeotabApi, state: GeotabState) => void;
}

declare global {
  interface Window {
    geotab?: {
      addin?: Record<string, () => AddInLifecycle>;
    };
  }
}
