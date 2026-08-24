// A video session is an add-on either base session_mode can have -- booked
// and paid for individually, unlike regular sessions which are invoiced
// after the fact. See migration 0071.
export const VIDEO_SESSION_RATE = 20;

// Every bookable call through the app (video session, check-in call) runs
// the same length.
export const CALL_DURATION_MINUTES = 60;
