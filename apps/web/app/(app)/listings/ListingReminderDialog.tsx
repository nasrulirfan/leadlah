"use client";

import { useMemo, useState, useTransition } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createListingReminderAction } from "./actions";
import { motion } from "framer-motion";
import { Bell, Calendar, MessageSquare, Users, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [success, setSuccess] = useState(false);

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
    setSuccess(false);
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

        setSuccess(true);
        setTimeout(() => {
          setOpen(false);
          setSuccess(false);
        }, 1500);
      } catch (actionError) {
        setError(actionError instanceof Error ? actionError.message : "Unable to create this reminder.");
      }
    });
  };

  const tabConfig = [
    { value: "event", label: "Event", icon: Calendar, description: "Schedule viewings & appointments" },
    { value: "followUp", label: "Follow-up", icon: MessageSquare, description: "Set lead follow-up reminders" },
    { value: "ownerUpdate", label: "Owner Update", icon: Users, description: "Recurring owner reports" }
  ];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) {
        setError(null);
        setSuccess(false);
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Bell className="h-3.5 w-3.5" />
          Remind
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-transparent p-6 pb-4">
          <DialogHeader>
            <DialogTitle className="text-xl">Add Reminder</DialogTitle>
            <DialogDescription className="text-sm">
              Set up reminders for <span className="font-medium text-foreground">{listingName}</span>
            </DialogDescription>
          </DialogHeader>
        </div>

        {success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-12"
          >
            <div className="rounded-full bg-emerald-100 p-4 dark:bg-emerald-500/20">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="mt-4 text-lg font-medium text-foreground">Reminder Created!</p>
            <p className="text-sm text-muted-foreground">You'll be notified at the scheduled time.</p>
          </motion.div>
        ) : (
          <div className="p-6 pt-2">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
              <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-muted/50">
                {tabConfig.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    <tab.icon className="h-4 w-4" />
                    <span className="text-xs font-medium">{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="event" className="mt-6 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Event Type</label>
                    <Select value={eventType} onValueChange={(value) => setEventType(value as any)}>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Viewing">🏠 Viewing</SelectItem>
                        <SelectItem value="Inspection">🔍 Inspection</SelectItem>
                        <SelectItem value="Appointment">📅 Appointment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Date & Time</label>
                    <Input 
                      type="datetime-local" 
                      value={eventStartsAt} 
                      onChange={(e) => setEventStartsAt(e.target.value)} 
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Contact Name</label>
                    <Input 
                      value={eventContactName} 
                      onChange={(e) => setEventContactName(e.target.value)} 
                      placeholder="John / Siti" 
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Location</label>
                    <Input 
                      value={eventLocation} 
                      onChange={(e) => setEventLocation(e.target.value)} 
                      placeholder="Mont Kiara, Lobby" 
                      className="h-11"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50 cursor-pointer hover:bg-muted/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={eventAddConfirmation}
                    onChange={(e) => setEventAddConfirmation(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">Add confirmation reminder</p>
                    <p className="text-xs text-muted-foreground">Remind to confirm appointment 24 hours before</p>
                  </div>
                </label>
              </TabsContent>

              <TabsContent value="followUp" className="mt-6 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Follow-up Time</label>
                    <Input 
                      type="datetime-local" 
                      value={followUpAt} 
                      onChange={(e) => setFollowUpAt(e.target.value)} 
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Channel</label>
                    <Select value={followUpChannel} onValueChange={(value) => setFollowUpChannel(value as any)}>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="WhatsApp">💬 WhatsApp</SelectItem>
                        <SelectItem value="Call">📞 Call</SelectItem>
                        <SelectItem value="Email">📧 Email</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-foreground">Contact Name</label>
                    <Input 
                      value={followUpContactName} 
                      onChange={(e) => setFollowUpContactName(e.target.value)} 
                      placeholder="Buyer / tenant name" 
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-foreground">Message</label>
                    <Textarea 
                      value={followUpMessage} 
                      onChange={(e) => setFollowUpMessage(e.target.value)} 
                      rows={3} 
                      className="resize-none"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="ownerUpdate" className="mt-6 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Cadence</label>
                    <Select value={ownerCadence} onValueChange={(value) => setOwnerCadence(value as any)}>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Weekly">📅 Weekly update</SelectItem>
                        <SelectItem value="Monthly">📊 Monthly report</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">First Due Date</label>
                    <Input 
                      type="datetime-local" 
                      value={ownerFirstDueAt} 
                      onChange={(e) => setOwnerFirstDueAt(e.target.value)} 
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-foreground">Message</label>
                    <Textarea 
                      value={ownerMessage} 
                      onChange={(e) => setOwnerMessage(e.target.value)} 
                      rows={3} 
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      Marking as done will automatically schedule the next reminder
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 rounded-lg bg-destructive/10 text-sm text-destructive"
              >
                {error}
              </motion.p>
            )}

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <Button variant="outline" type="button" onClick={() => setOpen(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button type="button" onClick={submit} disabled={isPending} className="gap-2">
                {isPending ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Bell className="h-4 w-4" />
                    Create Reminder
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
