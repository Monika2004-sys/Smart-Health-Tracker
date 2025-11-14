export const calculateBMI = (weight: number, height: number): number => {
  // weight in kg, height in cm
  const heightInMeters = height / 100;
  return Number((weight / Math.pow(heightInMeters, 2)).toFixed(2));
};

export const getBMICategory = (bmi: number): string => {
  if (bmi < 18.5) return "underweight";
  if (bmi < 25) return "normal";
  if (bmi < 30) return "overweight";
  return "obese";
};

export const getBMICategoryColor = (category: string): string => {
  switch (category) {
    case "underweight":
      return "text-info";
    case "normal":
      return "text-success";
    case "overweight":
      return "text-warning";
    case "obese":
      return "text-destructive";
    default:
      return "text-foreground";
  }
};

export const calculateCalories = (
  weight: number,
  height: number,
  age: number,
  gender: string,
  activityLevel: string
): number => {
  // Mifflin-St Jeor Equation
  let bmr: number;
  
  if (gender === "male") {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else if (gender === "female") {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  } else {
    // Average for "other"
    bmr = 10 * weight + 6.25 * height - 5 * age - 78;
  }

  // Activity multiplier
  const activityMultipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };

  const multiplier = activityMultipliers[activityLevel] || 1.55;
  return Math.round(bmr * multiplier);
};

export const getHealthTips = (
  bmi: number,
  category: string,
  steps: number,
  calorieGoal: number
): string[] => {
  const tips: string[] = [];

  // BMI-based tips
  if (category === "underweight") {
    tips.push("🍽️ Add more nutritious, calorie-dense meals to your diet.");
    tips.push("💪 Consider strength training to build muscle mass.");
  } else if (category === "normal") {
    tips.push("✨ Great job! Maintain your healthy lifestyle.");
    tips.push("🥗 Continue balanced eating and regular exercise.");
  } else if (category === "overweight") {
    tips.push("🧘‍♀️ Try 20 minutes of morning yoga or stretching.");
    tips.push("🚶‍♂️ Increase your daily walking by 2,000 steps.");
  } else if (category === "obese") {
    tips.push("🏃‍♀️ Start with low-impact exercises like swimming or cycling.");
    tips.push("📱 Consider consulting a healthcare professional for guidance.");
  }

  // Steps-based tips
  if (steps < 5000) {
    tips.push("⏰ Take short 5-minute walking breaks every hour.");
  } else if (steps < 8000) {
    tips.push("🎯 You're doing well! Aim for 10,000 steps daily.");
  } else {
    tips.push("🌟 Excellent activity level! Keep up the great work.");
  }

  // General wellness tips
  tips.push("💧 Remember to drink 8 glasses of water daily.");
  tips.push("😴 Aim for 7-9 hours of quality sleep each night.");

  return tips;
};
