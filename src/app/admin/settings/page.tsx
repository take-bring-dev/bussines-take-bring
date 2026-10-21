import { SettingsPanel } from "@/components/settings/settings-panel";

export default function AdminSettingsPage() {
  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-4 md:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 text-[11px] font-medium tracking-wider text-primary uppercase">
          <span className="size-2 rounded-full bg-primary-container" />
          <span>Platform Control Center • Preferences</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-[32px] md:leading-10">
          Settings
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
          Profile and push notification preferences — same controls as shipper and
          carrier workspaces.
        </p>
      </div>
      <SettingsPanel title="Admin account" />
    </div>
  );
}
