import { DateTime } from "luxon";

export interface DateWindowUtc {
  fromUtcIso: string;
  toUtcIso: string;
  localLabel: string;
}

export function getYesterdayEasternWindowUtc(now = DateTime.now()): DateWindowUtc {
  const easternNow = now.setZone("America/New_York");
  const yesterdayStartEt = easternNow.minus({ days: 1 }).startOf("day");
  const yesterdayEndEt = yesterdayStartEt.endOf("day");

  return {
    fromUtcIso: yesterdayStartEt.toUTC().toISO({ suppressMilliseconds: false }) ?? "",
    toUtcIso: yesterdayEndEt.toUTC().toISO({ suppressMilliseconds: false }) ?? "",
    localLabel: yesterdayStartEt.toFormat("yyyy-LL-dd")
  };
}
