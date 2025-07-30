// Shared configuration for CRDO Backend functions

export interface Config {
  supabaseUrl: string;
  serviceKey: string;
  corsHeaders: Record<string, string>;
  rateLimits: {
    finishRun: {
      maxRequests: number;
      windowMs: number;
    };
  };
  validation: {
    maxDistance: number;
    maxDuration: number;
    maxAverageSpeed: number;
    maxPeakSpeed: number;
  };
  achievements: {
    distanceBased: Array<{
      name: string;
      description: string;
      distance: number;
      points: number;
    }>;
    streakBased: Array<{
      name: string;
      description: string;
      days: number;
      points: number;
    }>;
    speedBased: Array<{
      name: string;
      description: string;
      speed: number;
      points: number;
    }>;
  };
}

export const config: Config = {
  supabaseUrl: Deno.env.get("SUPABASE_URL") || "",
  serviceKey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
  corsHeaders: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  },
  rateLimits: {
    finishRun: {
      maxRequests: 10,
      windowMs: 60 * 1000, // 1 minute
    },
  },
  validation: {
    maxDistance: 100000, // 100km
    maxDuration: 86400, // 24 hours
    maxAverageSpeed: 20, // 20 m/s
    maxPeakSpeed: 30, // 30 m/s
  },
  achievements: {
    distanceBased: [
      {
        name: "5K Runner",
        description: "Complete a 5km run",
        distance: 5000,
        points: 50,
      },
      {
        name: "10K Runner", 
        description: "Complete a 10km run",
        distance: 10000,
        points: 100,
      },
    ],
    streakBased: [
      {
        name: "Week Warrior",
        description: "Maintain a 7-day streak",
        days: 7,
        points: 75,
      },
      {
        name: "Monthly Master",
        description: "Maintain a 30-day streak", 
        days: 30,
        points: 200,
      },
    ],
    speedBased: [
      {
        name: "Speed Demon",
        description: "Maintain an average speed of 3 m/s",
        speed: 3.0,
        points: 150,
      },
    ],
  },
}; 