export interface LookupMaps {
  usersById: Map<string, any>;
  devicesById: Map<string, any>;
  rulesById: Map<string, any>;
  groupsById: Map<string, any>;
  zonesById: Map<string, any>;
}

export interface ReportRows {
  data1Rows: string[][];
  data2Rows: string[][];
}
