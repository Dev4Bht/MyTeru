const DEVICE_ID_STORAGE_KEY = "druksave_device_id";

/**
 * A stable per-browser identifier used for OTP device binding and the
 * "known device" check on login. Persisted in localStorage so it survives
 * reloads but is unique per browser/device install.
 */
export function getDeviceId(): string {
  if (typeof window === "undefined") {
    return "server";
  }

  let deviceId = window.localStorage.getItem(DEVICE_ID_STORAGE_KEY);
  if (!deviceId) {
    deviceId = `web-${crypto.randomUUID()}`;
    window.localStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
  }
  return deviceId;
}
