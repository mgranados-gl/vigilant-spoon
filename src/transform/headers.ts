export const DATA1_HEADERS = [
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

export const DATA2_HEADERS = [
  ".Device.DeviceName",
  ".Device.DeviceId",
  ".Device.DeviceComment",
  ".Device.DeviceGroup",
  ".Device.DeviceGroup|Company Group",
  ".Driver.UserFirstName",
  ".Driver.UserLastName",
  ".Driver.UserName",
  ".Driver.UserId",
  ".Driver.UserComment",
  ".Driver.DriverGroup",
  ".Driver.DriverGroup|Company Group",
  ".ExceptionRule.ExceptionRuleName",
  "ExceptionDetailLongitude",
  "ExceptionDetailLatitude",
  "ExceptionDetailLocation",
  "Location.ZoneZoneTypes",
  "Location.ZoneExternalReference",
  "ExceptionDetailStartTime",
  "ExceptionDuration",
  "ExceptionDistance",
  "ExceptionDetailExtraInfo",
  "ExceptionDetailDetails",
  "ExceptionStatus"
] as const;
