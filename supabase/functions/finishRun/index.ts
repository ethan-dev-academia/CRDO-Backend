import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get user from auth header
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "").trim();
    
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: { user }, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body = await req.json();
    const { runId, distance, duration, averageSpeed, peakSpeed } = body;

    if (!runId || distance === undefined || duration === undefined) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: runId, distance, duration" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update the run with completion data
    const { error: updateError } = await supabase
      .from("runs")
      .update({
        distance_m: distance,
        duration_s: duration,
        average_speed: averageSpeed || 0,
        peak_speed: peakSpeed || 0,
      })
      .eq("id", runId)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Run update error:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update run", details: updateError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update or create streak
    const today = new Date().toISOString().split('T')[0];
    const { data: existingStreak } = await supabase
      .from("streaks")
      .select("*")
      .eq("user_id", user.id)
      .single();

    let streakData = {
      user_id: user.id,
      current_streak: 1,
      longest_streak: 1,
      last_run_date: today,
      freeze_count: 0,
    };

    if (existingStreak) {
      const lastRunDate = new Date(existingStreak.last_run_date);
      const todayDate = new Date(today);
      const daysDiff = Math.floor((todayDate.getTime() - lastRunDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff === 1) {
        // Consecutive day
        streakData.current_streak = existingStreak.current_streak + 1;
        streakData.longest_streak = Math.max(existingStreak.longest_streak, streakData.current_streak);
      } else if (daysDiff === 0) {
        // Same day, keep existing streak
        streakData.current_streak = existingStreak.current_streak;
        streakData.longest_streak = existingStreak.longest_streak;
      } else {
        // Streak broken, reset to 1
        streakData.current_streak = 1;
        streakData.longest_streak = existingStreak.longest_streak;
      }

      const { error: streakUpdateError } = await supabase
        .from("streaks")
        .update(streakData)
        .eq("user_id", user.id);

      if (streakUpdateError) {
        console.error("Streak update error:", streakUpdateError);
      }
    } else {
      // Create new streak
      const { error: streakCreateError } = await supabase
        .from("streaks")
        .insert([streakData]);

      if (streakCreateError) {
        console.error("Streak creation error:", streakCreateError);
      }
    }

    // Check for achievements
    const achievements = [];
    
    // Distance-based achievements
    if (distance >= 5000) { // 5km
      achievements.push({
        user_id: user.id,
        achievement_name: "5K Runner",
        description: "Complete a 5km run",
        points: 50,
        earned_at: new Date().toISOString()
      });
    }
    
    if (distance >= 10000) { // 10km
      achievements.push({
        user_id: user.id,
        achievement_name: "10K Runner",
        description: "Complete a 10km run",
        points: 100,
        earned_at: new Date().toISOString()
      });
    }

    // Streak-based achievements
    if (streakData.current_streak >= 7) {
      achievements.push({
        user_id: user.id,
        achievement_name: "Week Warrior",
        description: "Maintain a 7-day streak",
        points: 75,
        earned_at: new Date().toISOString()
      });
    }

    if (streakData.current_streak >= 30) {
      achievements.push({
        user_id: user.id,
        achievement_name: "Monthly Master",
        description: "Maintain a 30-day streak",
        points: 200,
        earned_at: new Date().toISOString()
      });
    }

    // Speed-based achievements
    if (averageSpeed >= 3.0) { // 3 m/s = ~10.8 km/h
      achievements.push({
        user_id: user.id,
        achievement_name: "Speed Demon",
        description: "Maintain an average speed of 3 m/s",
        points: 150,
        earned_at: new Date().toISOString()
      });
    }

    // Insert achievements (avoid duplicates)
    for (const achievement of achievements) {
      const { error: achievementError } = await supabase
        .from("achievements")
        .upsert([achievement], { 
          onConflict: "user_id,achievement_name",
          ignoreDuplicates: true 
        });

      if (achievementError) {
        console.error("Achievement insert error:", achievementError);
      }
    }

    return new Response(
      JSON.stringify({
        message: "Run completed successfully",
        runId,
        streak: streakData,
        achievements: achievements.map(a => a.achievement_name)
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (e) {
    console.error("Function error:", e);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
