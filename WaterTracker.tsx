import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Droplets, Plus, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface WaterTrackerProps {
  currentIntake: number;
  onUpdate: () => void;
}

const WaterTracker = ({ currentIntake, onUpdate }: WaterTrackerProps) => {
  const [waterGoal] = useState(2000); // 2000ml daily goal
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderInterval, setReminderInterval] = useState(60); // minutes

  useEffect(() => {
    if (reminderEnabled) {
      requestNotificationPermission();
      const interval = setInterval(() => {
        if (currentIntake < waterGoal) {
          showNotification("Water Reminder", "Time to drink some water! 💧");
        }
      }, reminderInterval * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [reminderEnabled, reminderInterval, currentIntake, waterGoal]);

  const requestNotificationPermission = async () => {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  };

  const showNotification = (title: string, body: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body, icon: "/favicon.ico" });
    }
  };

  const addWater = async (amount: number) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const today = new Date().toISOString().split("T")[0];
    const newIntake = currentIntake + amount;

    const { error } = await supabase
      .from("daily_tracking")
      .upsert({
        user_id: session.user.id,
        date: today,
        water_intake: newIntake,
      }, {
        onConflict: "user_id,date"
      });

    if (error) {
      toast.error("Failed to update water intake");
    } else {
      toast.success(`Added ${amount}ml of water!`);
      onUpdate();
    }
  };

  const percentage = Math.min((currentIntake / waterGoal) * 100, 100);

  return (
    <Card className="hover-lift border-info/20 animate-fade-up">
      <CardHeader className="bg-gradient-to-br from-info/5 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-info/10">
              <Droplets className="w-5 h-5 text-info" />
            </div>
            <CardTitle className="text-lg">Water Intake</CardTitle>
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
          <span className="text-info text-xl">{currentIntake}ml</span>
          <span className="text-muted-foreground"> / {waterGoal}ml today</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <div className="relative">
          <Progress value={percentage} className="h-3 bg-info/20" />
          <div className="absolute -top-6 right-0 text-sm font-semibold text-info">
            {Math.round(percentage)}%
          </div>
        </div>
        
        {reminderEnabled && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-info/5 border border-info/20 animate-slide-in">
            <span className="text-sm font-medium">Remind every</span>
            <Input
              type="number"
              value={reminderInterval}
              onChange={(e) => setReminderInterval(Number(e.target.value))}
              className="w-20 border-info/30 focus:border-info"
              min="15"
              max="240"
            />
            <span className="text-sm font-medium">minutes</span>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            onClick={() => addWater(250)}
            className="flex-1 bg-info hover:bg-info/90 text-white shadow-md hover:shadow-lg transition-all duration-300"
          >
            <Plus className="w-4 h-4 mr-2" />
            250ml
          </Button>
          <Button
            onClick={() => addWater(500)}
            className="flex-1 bg-info hover:bg-info/90 text-white shadow-md hover:shadow-lg transition-all duration-300"
          >
            <Plus className="w-4 h-4 mr-2" />
            500ml
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default WaterTracker;
