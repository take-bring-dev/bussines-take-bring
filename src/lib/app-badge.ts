/** Home-screen / installed PWA icon badge (Badging API — Chrome/Android; limited on iOS). */
export async function setAppBadge(count: number) {
  if (typeof navigator === "undefined") return;
  const n = Math.max(0, Math.floor(count));
  try {
    if (n > 0 && "setAppBadge" in navigator) {
      await navigator.setAppBadge(n);
    } else if (n <= 0 && "clearAppBadge" in navigator) {
      await navigator.clearAppBadge();
    }
  } catch {
    // Unsupported or permission denied — ignore
  }
}

export async function clearAppBadge() {
  await setAppBadge(0);
}
