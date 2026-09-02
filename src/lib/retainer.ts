// A client on hold pays a flat weekly retainer to keep app access and hold
// their spot without training -- see migration 0068 for the schema side.
export const RETAINER_FEE_PER_WEEK = 10;

// A short pause -- vacation, illness, a slow week -- is free: no retainer
// charge for the first two weeks of a hold. Only a hold that runs longer
// than this starts billing (see the cron's weekly retainer rolling logic).
export const FREE_HOLD_DAYS = 14;
