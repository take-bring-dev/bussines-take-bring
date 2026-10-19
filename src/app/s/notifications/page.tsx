import { redirect } from "next/navigation";

/** Notifications open from the bell icon drawer — keep old URL working. */
export default function ShipperNotificationsRedirect() {
  redirect("/s/billing");
}
