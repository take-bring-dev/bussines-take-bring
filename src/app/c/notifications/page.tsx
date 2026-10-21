import { redirect } from "next/navigation";

/** Notifications open from the bell drawer only — no dedicated page. */
export default function CarrierNotificationsRedirect() {
  redirect("/c");
}
