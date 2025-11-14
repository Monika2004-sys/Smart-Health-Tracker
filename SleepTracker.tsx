import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Moon, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SleepTrackerProps {
  currentSleep: number;
  onUpdate: () => void;
}

const SleepTracker = ({ currentSleep, onUpdate }: SleepTrackerProps) => {
  const [sleepGoal] = useState(8); // 8 hours goal
  const [sleepHours, setSleepHours] = useState(0);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [bedtime, setBedtime] = useState("22:00");

  useEffect(() => {
    if (reminderEnabled) {
      requestNotificationPermission();
      checkBedtimeReminder();
      const interval = setInterval(checkBedtimeReminder, 60000); // Check every minute
      return () => clearInterval(interval);
    }
  }, [reminderEnabled, bedtime]);

  const requestNotificationPermission = async () => {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  };

  const checkBedtimeReminder = () => {
    const now = new Date();
    const [hours, minutes] = bedtime.split(":");
    const reminderTime = new Date();
    reminderTime.setHours(parseInt(hours), parseInt(minutes), 0);

    const diff = Math.abs(now.getTime() - reminderTime.getTime());
    if (diff < 60000) { // Within 1 minute
      showNotification("Bedtime Reminder", "Time to get ready for bed! 🌙");
    }
  };

  const showNotification = (title: string, body: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body, icon: "/favicon.ico" });
    }
  };

  const logSleep = async () => {
    if (sleepHours <= 0) {
      toast.error("Please enter valid sleep hours");
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const today = new Date().toISOString().split("T")[0];

    const { error } = await supabase
      .from("daily_tracking")
      .upsert({
        user_id: session.user.id,
        date: today,
        sleep_hours: sleepHours,
      }, {
        onConflict: "user_id,date"
      });

    if (error) {
      toast.error("Failed to log sleep");
    } else {
      toast.success(`Logged ${sleepHours} hours of sleep!`);
      setSleepHours(0);
      onUpdate();
    }
  };

  const percentage = Math.min((currentSleep / sleepGoal) * 100, 100);

  return (
    <Card className="hover-lift border-secondary/20 animate-fade-up" style={{ animationDelay: "0.1s" }}>
      <CardHeader className="bg-gradient-to-br from-secondary/5 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary/10">
              <Moon className="w-5 h-5 text-secondary" />
            </div>
            <CardTitle className="text-lg">Sleep Tracker</CardTitle>
          </div>
          <Button
            variant={reminderEnabled ? "default" : "outline"}
            size="sm"
            onClick={() => setReminderEnabled(!reminderEnabled)}
            className="transition-all duration-300"
          >
            <Bell className={`w-4 h-4 mr-2 ${reminderEnabled ? "animate-pulse" : ""}`} />
            {reminderEnabled ? "On" : "Off"}
          </Button>
        </div>
        <CardDescription className="text-base font-medium mt-2">
          <span className="text-secondary text-xl">{currentSleep}h</span>
          <span className="text-muted-foreground"> / {sleepGoal}h goal</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <div className="relative">
          <Progress value={percentage} className="h-3 bg-secondary/20" />
          <div className="absolute -top-6 right-0 text-sm font-semibold text-secondary">
            {Math.round(percentage)}%
          </div>
        </div>

        {reminderEnabled && (
          <div className="space-y-2 p-3 rounded-lg bg-secondary/5 border border-secondary/20 animate-slide-in">
            <Label htmlFor="bedtime" className="font-semibold">Bedtime Reminder</Label>
            <Input
              id="bedtime"
              type="time"
              value={bedtime}
              onChange={(e) => setBedtime(e.target.value)}
              className="border-secondary/30 focus:border-secondary"
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="sleepHours" className="font-semibold">Hours Slept</Label>
          <div className="flex gap-2">
            <Input
              id="sleepHours"
              type="number"
              value={sleepHours || ""}
              onChange={(e) => setSleepHours(Number(e.target.value))}
              placeholder="0"
              min="0"
              max="24"
              step="0.5"
              className="border-secondary/30 focus:border-secondary"
            />
            <Button 
              onClick={logSleep}
              className="bg-secondary hover:bg-secondary/90 text-white shadow-md hover:shadow-lg transition-all duration-300"
            >
              Log
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SleepTracker;
