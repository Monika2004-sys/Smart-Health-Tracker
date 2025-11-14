import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Pill, Bell, Plus, Trash2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  time_of_day: string[];
  active: boolean;
}

interface MedicationLog {
  id: string;
  medication_id: string;
  taken_at: string;
}

const MedicationTracker = () => {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [logs, setLogs] = useState<MedicationLog[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [newMed, setNewMed] = useState({
    name: "",
    dosage: "",
    frequency: "daily",
    times: [] as string[],
  });

  useEffect(() => {
    fetchMedications();
    fetchLogs();
  }, []);

  useEffect(() => {
    if (reminderEnabled) {
      requestNotificationPermission();
      checkMedicationReminders();
      const interval = setInterval(checkMedicationReminders, 60000);
      return () => clearInterval(interval);
    }
  }, [reminderEnabled, medications]);

  const requestNotificationPermission = async () => {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  };

  const checkMedicationReminders = () => {
    const now = new Date();
    medications.forEach((med) => {
      if (med.active && med.time_of_day) {
        med.time_of_day.forEach((time) => {
          const [hours, minutes] = time.split(":");
          const reminderTime = new Date();
          reminderTime.setHours(parseInt(hours), parseInt(minutes), 0);
          
          const diff = Math.abs(now.getTime() - reminderTime.getTime());
          if (diff < 60000) {
            showNotification("Medication Reminder", `Time to take ${med.name} (${med.dosage}) 💊`);
          }
        });
      }
    });
  };

  const showNotification = (title: string, body: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body, icon: "/favicon.ico" });
    }
  };

  const fetchMedications = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from("medications")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("active", true);

    if (!error && data) {
      setMedications(data);
    }
  };

  const fetchLogs = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const today = new Date().toISOString().split("T")[0];
    const { data, error } = await supabase
      .from("medication_logs")
      .select("*")
      .eq("user_id", session.user.id)
      .gte("taken_at", today);

    if (!error && data) {
      setLogs(data);
    }
  };

  const addMedication = async () => {
    if (!newMed.name || !newMed.dosage || newMed.times.length === 0) {
      toast.error("Please fill all fields and add at least one time");
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase
      .from("medications")
      .insert({
        user_id: session.user.id,
        name: newMed.name,
        dosage: newMed.dosage,
        frequency: newMed.frequency,
        time_of_day: newMed.times,
        active: true,
      });

    if (error) {
      toast.error("Failed to add medication");
    } else {
      toast.success("Medication added!");
      setNewMed({ name: "", dosage: "", frequency: "daily", times: [] });
      setShowAddForm(false);
      fetchMedications();
    }
  };

  const logMedication = async (medicationId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase
      .from("medication_logs")
      .insert({
        user_id: session.user.id,
        medication_id: medicationId,
        taken_at: new Date().toISOString(),
      });

    if (error) {
      toast.error("Failed to log medication");
    } else {
      toast.success("Medication taken!");
      fetchLogs();
    }
  };

  const deleteMedication = async (id: string) => {
    const { error } = await supabase
      .from("medications")
      .update({ active: false })
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete medication");
    } else {
      toast.success("Medication removed");
      fetchMedications();
    }
  };

  const isTakenToday = (medicationId: string) => {
    return logs.some(log => log.medication_id === medicationId);
  };

  return (
    <Card className="hover-lift border-primary/20 animate-fade-up" style={{ animationDelay: "0.3s" }}>
      <CardHeader className="bg-gradient-to-br from-primary/5 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Pill className="w-5 h-5 text-primary" />
            </div>
            <CardTitle className="text-lg">Medications</CardTitle>
          </div>
          <div className="flex gap-2">
            <Button
              variant={reminderEnabled ? "default" : "outline"}
              size="sm"
              onClick={() => setReminderEnabled(!reminderEnabled)}
              className="transition-all duration-300"
            >
              <Bell className={`w-4 h-4 mr-2 ${reminderEnabled ? "animate-pulse" : ""}`} />
              {reminderEnabled ? "On" : "Off"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddForm(!showAddForm)}
              className="hover:bg-primary/10 hover:border-primary/30 transition-all duration-300"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>
        </div>
        <CardDescription className="text-base font-medium mt-2">
          Track your daily medications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {showAddForm && (
          <div className="space-y-3 p-4 border rounded-lg bg-primary/5 border-primary/20 animate-slide-in">
            <div className="space-y-2">
              <Label htmlFor="medName">Medication Name</Label>
              <Input
                id="medName"
                value={newMed.name}
                onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                placeholder="e.g., Aspirin"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dosage">Dosage</Label>
              <Input
                id="dosage"
                value={newMed.dosage}
                onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
                placeholder="e.g., 500mg"
              />
            </div>

            <div className="space-y-2">
              <Label>Times to Take</Label>
              {newMed.times.map((time, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    type="time"
                    value={time}
                    onChange={(e) => {
                      const newTimes = [...newMed.times];
                      newTimes[index] = e.target.value;
                      setNewMed({ ...newMed, times: newTimes });
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newTimes = newMed.times.filter((_, i) => i !== index);
                      setNewMed({ ...newMed, times: newTimes });
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setNewMed({ ...newMed, times: [...newMed.times, "09:00"] })}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Time
              </Button>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={addMedication} 
                className="flex-1 bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg transition-all duration-300"
              >
                Save
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowAddForm(false)} 
                className="flex-1 hover:bg-muted"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {medications.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No medications added yet</p>
        ) : (
          <div className="space-y-2">
            {medications.map((med, index) => (
              <div
                key={med.id}
                className={`flex items-center justify-between p-3 border rounded-lg transition-all duration-300 animate-fade-in ${
                  isTakenToday(med.id) 
                    ? "bg-success/10 border-success/30 shadow-sm" 
                    : "bg-card border-primary/20 hover:bg-primary/5"
                }`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{med.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {med.dosage} • <span className="text-primary">{med.time_of_day?.join(", ")}</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  {!isTakenToday(med.id) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => logMedication(med.id)}
                      className="hover:bg-success/10 hover:text-success hover:border-success/30 transition-all duration-300"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteMedication(med.id)}
                    className="hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MedicationTracker;
