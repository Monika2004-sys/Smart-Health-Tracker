import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Activity } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Check if user has completed profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (profile) {
          navigate("/dashboard");
        } else {
          navigate("/profile");
        }
      } else {
        navigate("/auth");
      }
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        checkAuth();
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
        <Activity className="w-12 h-12 text-primary animate-pulse" />
      </div>
    );
  }

  return null;
};

export default Index;
