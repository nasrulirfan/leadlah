"use client";

import { useMemo, useState, useTransition } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createListingReminderAction } from "./actions";

type ListingReminderDialogProps = {
  listingId: string;
  listingName: string;
};

const toDatetimeLocalValue = (date: Date) => {
  const pad = (value: number) => value.toString().padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export function ListingReminderDialog({ listingId, listingName }: ListingReminderDialogProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"event" | "followUp" | "ownerUpdate">("event");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const now = useMemo(() => new Date(), []);
  const defaultStartAt = useMemo(() => {
    const next = new Date(now);
    next.setHours(next.getHours() + 2);
    next.setSeconds(0, 0);
    return toDatetimeLocalValue(next);
  }, [now]);

  const defaultFollowUpAt = useMemo(() => {
    const next = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    next.setHours(10, 0, 0, 0);
    return toDatetimeLocalValue(next);
  }, [now]);

  const [eventType, setEventType] = useState<"Viewing" | "Inspection" | "Appointment">("Viewing");
  const [eventStartsAt, setEventStartsAt] = useState(defaultStartAt);
  const [eventContactName, setEventContactName] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventAddConfirmation, setEventAddConfirmation] = useState(true);

  const [followUpAt, setFollowUpAt] = useState(defaultFollowUpAt);
  const [followUpContactName, setFollowUpContactName] = useState("");
  const [followUpChannel, setFollowUpChannel] = useState<"Call" | "WhatsApp" | "Email">("WhatsApp");
  const [followUpMessage, setFollowUpMessage] = useState("Buyer viewed yesterday — follow up today.");

  const [ownerCadence, setOwnerCadence] = useState<"Weekly" | "Monthly">("Weekly");
  const [ownerFirstDueAt, setOwnerFirstDueAt] = useState("");
  const [ownerMessage, setOwnerMessage] = useState("1 week has passed — listing needs progress update.");

  const submit = () => {
    setError(null);
    startTransition(async () => {
      try {
        if (activeTab === "event") {
          await createListingReminderAction({
            kind: "EVENT",
            listingId,
            eventType,
            startsAt: eventStartsAt,
            contactName: eventContactName || undefined,
            location: eventLocation || undefined,
            addConfirmation: eventAddConfirmation
          });
        }
        if (activeTab === "followUp") {
          await createListingReminderAction({
            kind: "FOLLOW_UP",
            listingId,
            dueAt: followUpAt,
            message: followUpMessage,
            contactName: followUpContactName || undefined,
            channel: followUpChannel
          });
        }
        if (activeTab === "ownerUpdate") {
          await createListingReminderAction({
            kind: "OWNER_UPDATE",
            listingId,
            cadence: ownerCadence,
            firstDueAt: ownerFirstDueAt || undefined,
            message: ownerMessage
          });
        }

        setOpen(false);
      } catch (actionError) {
        setError(actionError instanceof Error ? actionError.message : "Unable to create this reminder.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          Add Reminder
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add reminder for {listingName}</DialogTitle>
          <DialogDescription>Viewing schedules, follow-ups, expiry renewals, and owner updates.</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="mt-2">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="event">Event</TabsTrigger>
            <TabsTrigger value="followUp">Follow-up</TabsTrigger>
            <TabsTrigger value="ownerUpdate">Owner update</TabsTrigger>
          </TabsList>

          <TabsContent value="event" className="mt-4 space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Type</label>
                <Select value={eventType} onValueChange={(value) => setEventType(value as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Viewing">Viewing</SelectItem>
                    <SelectItem value="Inspection">Inspection</SelectItem>
                    <SelectItem value="Appointment">Appointment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Date & time</label>
                <Input type="datetime-local" value={eventStartsAt} onChange={(e) => setEventStartsAt(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Contact name (optional)</label>
                <Input value={eventContactName} onChange={(e) => setEventContactName(e.target.value)} placeholder="John / Siti" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Location (optional)</label>
                <Input value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} placeholder="Mont Kiara, Lobby" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={eventAddConfirmation}
                onChange={(e) => setEventAddConfirmation(e.target.checked)}
                className="h-4 w-4"
              />
              Add a “Confirm tomorrow’s appointment” reminder
            </label>
          </TabsContent>

          <TabsContent value="followUp" className="mt-4 space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Follow-up time</label>
                <Input type="datetime-local" value={followUpAt} onChange={(e) => setFollowUpAt(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Channel</label>
                <Select value={followUpChannel} onValueChange={(value) => setFollowUpChannel(value as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                    <SelectItem value="Call">Call</SelectItem>
                    <SelectItem value="Email">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-foreground">Contact name (optional)</label>
                <Input value={followUpContactName} onChange={(e) => setFollowUpContactName(e.target.value)} placeholder="Buyer / tenant name" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-foreground">Message</label>
                <Textarea value={followUpMessage} onChange={(e) => setFollowUpMessage(e.target.value)} rows={3} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ownerUpdate" className="mt-4 space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Cadence</label>
                <Select value={ownerCadence} onValueChange={(value) => setOwnerCadence(value as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Weekly">Weekly update</SelectItem>
                    <SelectItem value="Monthly">Monthly report</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">First due date (optional)</label>
                <Input type="datetime-local" value={ownerFirstDueAt} onChange={(e) => setOwnerFirstDueAt(e.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-foreground">Message</label>
                <Textarea value={ownerMessage} onChange={(e) => setOwnerMessage(e.target.value)} rows={3} />
                <p className="text-xs text-muted-foreground">Marking a recurring reminder as done will roll it forward automatically.</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="flex justify-end gap-2">
          <Button variant="outline" type="button" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button type="button" onClick={submit} disabled={isPending}>
            {isPending ? "Saving..." : "Save reminder"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

