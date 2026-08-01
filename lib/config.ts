// TESTING TOGGLE.
//
// While true, login skips the emailed OTP: entering a known email signs you
// straight in (a session is minted server-side with the service role, no email
// is sent). This is for filling the app with fake data during testing.
//
// Set to false — and redeploy — before using real data, to restore the
// email + OTP login flow.
export const DEV_LOGIN = false;
