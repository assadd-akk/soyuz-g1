import { createClient } from "@libsql/client";
import { SoyuzLeadScorer, TargetPost } from "./scorer"; // Assuming scorer.ts is in the same src folder

export interface Env {
  TURSO_DATABASE_URL: string;
  TURSO_AUTH_TOKEN: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Initialize Turso client bound to the edge
    const db = createClient({
      url: env.TURSO_DATABASE_URL,
      authToken: env.TURSO_AUTH_TOKEN,
    });

    // CORS Headers for API access
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    if (method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // 1. Health Check Route
      if (path === "/api/health" && method === "GET") {
        return new Response(JSON.stringify({ status: "online", system: "Soyuz-G1 Edge" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // 2. Forgot Password Endpoint
      if (path === "/api/auth/forgot-password" && method === "POST") {
        const { email } = await request.json();
        
        const userResult = await db.execute({
          sql: "SELECT id FROM users WHERE email = ?",
          args: [email],
        });

        if (userResult.rows.length === 0) {
          // Prevent user enumeration
          return new Response(JSON.stringify({ message: "If account exists, reset instructions sent." }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Token generation logic can hook here...
        return new Response(JSON.stringify({ message: "Reset token generated successfully." }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Default 404 for unmatched routes
      return new Response(JSON.stringify({ error: "Endpoint not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message || "Internal Server Error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  },
};