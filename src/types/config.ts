export interface RuntimeConfig {
  templatePath: string;
  outputFileNamePrefix: string;
  worksheets: {
    data1: string;
    data2: string;
  };
  pagination: {
    dutyStatusResultsLimit: number;
    exceptionResultsLimit: number;
    lookupResultsLimit: number;
  };
  retries: {
    maxAttempts: number;
    baseDelayMs: number;
  };
  dutyStatus: {
    states: string[];
    statuses: string[];
  };
  exceptionRuleIds: {
    enteringOffice: string;
    exitingOffice: string;
  };
}
