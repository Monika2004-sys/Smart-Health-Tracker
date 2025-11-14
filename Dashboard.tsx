import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Activity, TrendingUp, Footprints, Flame, LogOut, User, Droplets, Moon, Smile } from "lucide-react";
import { calculateBMI, getBMICategory, getBMICategoryColor, calculateCalories, getHealthTips } from "@/lib/calculations";
import { signOut } from "@/lib/auth";
import StepTracker from "@/components/StepTracker";
import HealthTips from "@/components/HealthTips";
import WaterTracker from "@/components/WaterTracker";
import SleepTracker from "@/components/SleepTracker";
import FoodTracker from "@/components/FoodTracker";
import MedicationTracker from "@/components/MedicationTracker";

interface Profile {
  name: string;
  age: number;
  gender: string;
  height: number;
  weight: number;
  goal: string;
  activity_level: string;
}

interface DailyTracking {
  steps: number;
  calories_burned: number;
  water_intake: number;
  sleep_hours: number;
  mood: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [dailyTracking, setDailyTracking] = useState<DailyTracking>({
    steps: 0,
    calories_burned: 0,
    water_intake: 0,
    sleep_hours: 0,
    mood: "",
  });
  const [bmi, setBmi] = useState<number>(0);
  const [bmiCategory, setBmiCategory] = useState<string>("");
  const [calorieGoal, setCalorieGoal] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    // Fetch profile
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (profileError || !profileData) {
      navigate("/profile");
      return;
    }

    setProfile(profileData);

    // Calculate BMI
    const calculatedBmi = calculateBMI(profileData.weight, profileData.height);
    setBmi(calculatedBmi);
    setBmiCategory(getBMICategory(calculatedBmi));

    // Calculate calorie goal
    const calories = calculateCalories(
      profileData.weight,
      profileData.height,
      profileData.age,
      profileData.gender,
      profileData.activity_level
    );
    setCalorieGoal(calories);

    // Fetch today's tracking data
    const today = new Date().toISOString().split("T")[0];
    const { data: trackingData } = await supabase
      .from("daily_tracking")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("date", today)
      .single();

    if (trackingData) {
      setDailyTracking({
        steps: trackingData.steps || 0,
        calories_burned: trackingData.calories_burned || 0,
        water_intake: trackingData.water_intake || 0,
        sleep_hours: trackingData.sleep_hours || 0,
        mood: trackingData.mood || "",
      });
    }

    setLoading(false);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
    toast.success("Logged out successfully");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 flex items-center justify-center">
        <Activity className="w-12 h-12 text-primary animate-pulse" />
      </div>
    );
  }

  const healthTips = profile ? getHealthTips(bmi, bmiCategory, dailyTracking.steps, calorieGoal) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-md border-b border-border shadow-soft sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 animate-fade-in">
            <div className="p-2 rounded-lg bg-gradient-wellness">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold gradient-text">HealthTrack</h1>
          </div>
          <div className="flex items-center gap-2 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate("/profile")}
              className="hover:bg-primary/10 transition-all duration-300"
            >
              <User className="w-4 h-4 mr-2" />
              Profile
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout}
              className="hover:bg-destructive/10 hover:text-destructive transition-all duration-300"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-up">
          <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Welcome back, {profile?.name}!
          </h2>
          <p className="text-muted-foreground text-lg">Here's your health summary for today</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* BMI Card */}
          <Card className="hover-lift animate-fade-up border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader className="pb-3">
              <CardDescription className="font-medium">Body Mass Index</CardDescription>
              <CardTitle className={`text-5xl font-bold ${getBMICategoryColor(bmiCategory)}`}>
                {bmi}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-primary">
                <TrendingUp className="w-5 h-5" />
                <span className="text-sm font-bold capitalize">{bmiCategory}</span>
              </div>
            </CardContent>
          </Card>

          {/* Steps Card */}
          <Card className="hover-lift animate-fade-up border-secondary/20 bg-gradient-to-br from-secondary/5 to-transparent" style={{ animationDelay: "0.1s" }}>
            <CardHeader className="pb-3">
              <CardDescription className="font-medium">Steps Today</CardDescription>
              <CardTitle className="text-5xl font-bold text-secondary">
                {dailyTracking.steps.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span className="text-muted-foreground">Goal: 10,000</span>
                  <span className="text-secondary">{Math.round((dailyTracking.steps / 10000) * 100)}%</span>
                </div>
                <Progress value={(dailyTracking.steps / 10000) * 100} className="h-2 bg-secondary/20" />
              </div>
            </CardContent>
          </Card>

          {/* Calories Card */}
          <Card className="hover-lift animate-fade-up border-accent/20 bg-gradient-to-br from-accent/5 to-transparent" style={{ animationDelay: "0.2s" }}>
            <CardHeader className="pb-3">
              <CardDescription className="font-medium">Calories Burned</CardDescription>
              <CardTitle className="text-5xl font-bold text-accent">
                {dailyTracking.calories_burned}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-accent">
                <Flame className="w-5 h-5" />
                <span className="text-sm font-bold">Goal: {calorieGoal}</span>
              </div>
            </CardContent>
          </Card>

          {/* Activity Card */}
          <Card className="hover-lift animate-fade-up border-primary/20 bg-gradient-to-br from-primary/5 to-transparent" style={{ animationDelay: "0.3s" }}>
            <CardHeader className="pb-3">
              <CardDescription className="font-medium">Activity Level</CardDescription>
              <CardTitle className="text-3xl font-bold capitalize text-primary">
                {profile?.activity_level.replace("_", " ")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-primary">
                <Footprints className="w-5 h-5" />
                <span className="text-sm font-bold">Keep moving!</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Step Tracker and Health Tips */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <StepTracker
              currentSteps={dailyTracking.steps}
              onUpdate={fetchData}
            />
          </div>
          <div>
            <HealthTips tips={healthTips} />
          </div>
        </div>

        {/* Additional Trackers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <WaterTracker 
            currentIntake={dailyTracking.water_intake}
            onUpdate={fetchData}
          />
          <SleepTracker
            currentSleep={dailyTracking.sleep_hours}
            onUpdate={fetchData}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FoodTracker />
          <MedicationTracker />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
