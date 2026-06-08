# Field Mapping Notes

This add-in maps MyGeotab entities into report-shaped worksheet rows.

## Report 1 (Data1)

Primary entity: DutyStatusLog

- DutyStatusDateTime: DutyStatusLog.dateTime
- DutyStatusStatus: DutyStatusLog.status
- .StatusLog.Driver.UserFirstName: User.firstName via DutyStatusLog.driver.id lookup
- .StatusLog.Driver.UserLastName: User.lastName via DutyStatusLog.driver.id lookup
- .StatusLog.Driver.UserName: User.name via DutyStatusLog.driver.id lookup
- .StatusLog.Driver.DriverGroup: first resolvable group name from User.driverGroups
- DutyStatusId: DutyStatusLog.id
- DutyStatusDetailDuration: derived seconds to next log for the same driver
- DutyStatusDetailDistance: derived meter delta from odometer to next log for same driver
- DutyStatusSequence: DutyStatusLog.sequence

## Report 2 (Data2)

Primary entity: ExceptionEvent + lookups

- Device and Driver fields are lookup-derived using ExceptionEvent.device.id and ExceptionEvent.driver.id
- Exception rule name is lookup-derived using ExceptionEvent.rule.id
- Group and Company Group values are resolved from Group relationships where possible

Potentially non-1:1 fields (fallback to empty when unavailable in tenant data shape):

- ExceptionDetailLongitude
- ExceptionDetailLatitude
- ExceptionDetailLocation
- Location.ZoneZoneTypes
- Location.ZoneExternalReference
- ExceptionDetailExtraInfo
- ExceptionDetailDetails

## Important caveats

- API dates are sent as UTC ISO 8601.
- Yesterday is calculated in America/New_York.
- Only Data1 and Data2 are modified.
- If either sheet is missing, the add-in throws a friendly error.
- If no rows are returned, the workbook is still generated with headers only.
