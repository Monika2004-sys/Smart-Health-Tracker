import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Utensils, Bell, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Meal {
  id: string;
  meal_type: string;
  food_name: string;
  calories: number;
}

const FoodTracker = () => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [mealType, setMealType] = useState("breakfast");
  const [foodName, setFoodName] = useState("");
  const [calories, setCalories] = useState("");
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTimes, setReminderTimes] = useState({
    breakfast: "08:00",
    lunch: "12:00",
    dinner: "18:00",
  });

  useEffect(() => {
    fetchMeals();
  }, []);

  useEffect(() => {
    if (reminderEnabled) {
      requestNotificationPermission();
      checkMealReminders();
      const interval = setInterval(checkMealReminders, 60000);
      return () => clearInterval(interval);
    }
  }, [reminderEnabled, reminderTimes]);

  const requestNotificationPermission = async () => {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  };

  const checkMealReminders = () => {
    const now = new Date();
    Object.entries(reminderTimes).forEach(([meal, time]) => {
      const [hours, minutes] = time.split(":");
      const reminderTime = new Date();
      reminderTime.setHours(parseInt(hours), parseInt(minutes), 0);
      
      const diff = Math.abs(now.getTime() - reminderTime.getTime());
      if (diff < 60000) {
        showNotification("Meal Reminder", `Time for ${meal}! 🍽️`);
      }
    });
  };

  const showNotification = (title: string, body: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body, icon: "/favicon.ico" });
    }
  };

  const fetchMeals = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const today = new Date().toISOString().split("T")[0];
    const { data, error } = await supabase
      .from("meals")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("date", today);

    if (!error && data) {
      setMeals(data);
    }
  };

  const addMeal = async () => {
    if (!foodName || !calories) {
      toast.error("Please fill all fields");
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const today = new Date().toISOString().split("T")[0];
    const { error } = await supabase
      .from("meals")
      .insert({
        user_id: session.user.id,
        date: today,
        meal_type: mealType,
        food_name: foodName,
        calories: parseInt(calories),
      });

    if (error) {
      toast.error("Failed to add meal");
    } else {
      toast.success("Meal added!");
      setFoodName("");
      setCalories("");
      fetchMeals();
    }
  };

  const deleteMeal = async (id: string) => {
    const { error } = await supabase
      .from("meals")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete meal");
    } else {
      toast.success("Meal deleted");
      fetchMeals();
    }
  };

  const totalCalories = meals.reduce((sum, meal) => sum + (meal.calories || 0), 0);

  return (
    <Card className="hover-lift border-accent/20 animate-fade-up" style={{ animationDelay: "0.2s" }}>
      <CardHeader className="bg-gradient-to-br from-accent/5 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/10">
              <Utensils className="w-5 h-5 text-accent" />
            </div>
            <CardTitle className="text-lg">Food Tracker</CardTitle>
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
          Total: <span className="text-accent text-xl font-bold">{totalCalories}</span> calories
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {reminderEnabled && (
          <div className="space-y-3 p-4 border rounded-lg bg-accent/5 border-accent/20 animate-slide-in">
            <Label className="text-sm font-bold">Meal Reminders</Label>
            {Object.entries(reminderTimes).map(([meal, time]) => (
              <div key={meal} className="flex items-center gap-2">
                <Label className="w-24 capitalize text-sm font-medium">{meal}</Label>
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setReminderTimes({ ...reminderTimes, [meal]: e.target.value })}
                  className="flex-1 border-accent/30 focus:border-accent"
                />
              </div>
            ))}
          </div>
        )}

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="mealType">Meal Type</Label>
            <Select value={mealType} onValueChange={setMealType}>
              <SelectTrigger id="mealType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="breakfast">Breakfast</SelectItem>
                <SelectItem value="lunch">Lunch</SelectItem>
                <SelectItem value="dinner">Dinner</SelectItem>
                <SelectItem value="snack">Snack</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="foodName">Food Name</Label>
            <Input
              id="foodName"
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
              placeholder="e.g., Chicken Salad"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="calories">Calories</Label>
            <Input
              id="calories"
              type="number"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              placeholder="0"
            />
          </div>

          <Button 
            onClick={addMeal} 
            className="w-full bg-accent hover:bg-accent/90 text-white shadow-md hover:shadow-lg transition-all duration-300"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Meal
          </Button>
        </div>

        {meals.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-bold">Today's Meals</Label>
            {meals.map((meal, index) => (
              <div 
                key={meal.id} 
                className="flex items-center justify-between p-3 border border-accent/20 rounded-lg bg-accent/5 hover:bg-accent/10 transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div>
                  <p className="font-semibold capitalize text-foreground">{meal.meal_type}</p>
                  <p className="text-sm text-muted-foreground">{meal.food_name} • <span className="text-accent font-medium">{meal.calories} cal</span></p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteMeal(meal.id)}
                  className="hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FoodTracker;
