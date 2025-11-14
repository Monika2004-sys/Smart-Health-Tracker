-- Create profiles table for user health information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age > 0 AND age < 150),
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  height NUMERIC(5,2) NOT NULL CHECK (height > 0), -- in cm
  weight NUMERIC(5,2) NOT NULL CHECK (weight > 0), -- in kg
  goal TEXT NOT NULL CHECK (goal IN ('lose_weight', 'maintain', 'gain_weight', 'build_muscle')),
  activity_level TEXT DEFAULT 'moderate' CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create daily tracking table
CREATE TABLE public.daily_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  steps INTEGER DEFAULT 0 CHECK (steps >= 0),
  calories_burned INTEGER DEFAULT 0 CHECK (calories_burned >= 0),
  water_intake INTEGER DEFAULT 0 CHECK (water_intake >= 0), -- in ml
  sleep_hours NUMERIC(3,1) CHECK (sleep_hours >= 0 AND sleep_hours <= 24),
  mood TEXT CHECK (mood IN ('very_happy', 'happy', 'neutral', 'sad', 'stressed')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Create BMI history table
CREATE TABLE public.bmi_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bmi NUMERIC(4,2) NOT NULL,
  weight NUMERIC(5,2) NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('underweight', 'normal', 'overweight', 'obese')),
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bmi_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for daily_tracking
CREATE POLICY "Users can view own tracking data"
  ON public.daily_tracking FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tracking data"
  ON public.daily_tracking FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tracking data"
  ON public.daily_tracking FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tracking data"
  ON public.daily_tracking FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for bmi_history
CREATE POLICY "Users can view own BMI history"
  ON public.bmi_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own BMI history"
  ON public.bmi_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_daily_tracking_updated_at
  BEFORE UPDATE ON public.daily_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to calculate BMI
CREATE OR REPLACE FUNCTION public.calculate_bmi(weight_kg NUMERIC, height_cm NUMERIC)
RETURNS NUMERIC AS $$
BEGIN
  RETURN ROUND(weight_kg / POWER(height_cm / 100, 2), 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get BMI category
CREATE OR REPLACE FUNCTION public.get_bmi_category(bmi NUMERIC)
RETURNS TEXT AS $$
BEGIN
  IF bmi < 18.5 THEN
    RETURN 'underweight';
  ELSIF bmi < 25 THEN
    RETURN 'normal';
  ELSIF bmi < 30 THEN
    RETURN 'overweight';
  ELSE
    RETURN 'obese';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;