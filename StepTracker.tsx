import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Footprints } from "lucide-react";

interface StepTrackerProps {
  currentSteps: number;
  onUpdate: () => void;
}

const StepTracker = ({ currentSteps, onUpdate }: StepTrackerProps) => {
  const [steps, setSteps] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAddSteps = async () => {
    const stepsToAdd = parseInt(steps);
    if (isNaN(stepsToAdd) || stepsToAdd < 0) {
      toast.error("Please enter a valid number of steps");
      return;
    }

    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const today = new Date().toISOString().split("T")[0];
    const newStepCount = currentSteps + stepsToAdd;

    // Estimate calories burned (rough estimate: 0.04 calories per step)
    const caloriesBurned = Math.round(newStepCount * 0.04);

    const { error } = await supabase
      .from("daily_tracking")
      .upsert({
        user_id: session.user.id,
        date: today,
        steps: newStepCount,
        calories_burned: caloriesBurned,
      }, {
        onConflict: "user_id,date",
      });

    setLoading(false);

    if (error) {
      toast.error("Failed to update steps: " + error.message);
    } else {
      toast.success(`Added ${stepsToAdd} steps!`);
      setSteps("");
      onUpdate();
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Footprints className="w-5 h-5 text-primary" />
          <CardTitle>Step Tracker</CardTitle>
        </div>
        <CardDescription>Log your daily steps manually</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Enter steps..."
            value={steps}
            onChange={(e) => setSteps(e.target.value)}
            min="0"
          />
          <Button onClick={handleAddSteps} disabled={loading}>
            {loading ? "Adding..." : "Add Steps"}
          </Button>
        </div>
        
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <p className="text-sm text-muted-foreground">Quick Actions</p>
          <div className="flex flex-wrap gap-2">
            {[500, 1000, 2000, 5000].map((quickSteps) => (
              <Button
                key={quickSteps}
                variant="outline"
                size="sm"
                onClick={() => setSteps(quickSteps.toString())}
              >
                +{quickSteps}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StepTracker;
