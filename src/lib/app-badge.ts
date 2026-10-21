/** Home-screen / PWA icon badge (Chrome, Edge, installed PWAs). */
export async function setAppBadge(count: number) {
  if (typeof navigator === "undefined") return;
  try {
    if (count > 0 && "setAppBadge" in navigator) {
      await navigator.setAppBadge(count);
    } else if (count <= 0 && "clearAppBadge" in navigator) {
      await navigator.clearAppBadge();
    }
  } catch {
    // Unsupported or permission denied — ignore
  }
}

export async function clearAppBadge() {
  await setAppBadge(0);
}
