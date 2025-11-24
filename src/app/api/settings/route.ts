import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const SETTINGS_COLUMNS = `
  id,
  email,
  full_name,
  weekly_capacity_hours,
  timezone,
  default_sprint_length_days,
  default_work_hours_per_day,
  ai_use_wizard_suggestions,
  ai_show_rebalance_hints,
  ai_report_tone
`

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data, error } = await supabase
      .from("users")
      .select(SETTINGS_COLUMNS)
      .eq("id", user.id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "User settings not found" }, { status: 404 })
    }

    return NextResponse.json({ settings: data })
  } catch (error) {
    console.error("Error loading settings:", error)
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    const update: Record<string, unknown> = {}

    if (typeof body.full_name === "string") {
      update.full_name = body.full_name.trim()
    }

    if (typeof body.weekly_capacity_hours === "number") {
      const capacity = Math.min(80, Math.max(1, Math.round(body.weekly_capacity_hours)))
      update.weekly_capacity_hours = capacity
    }

    if (typeof body.timezone === "string") {
      update.timezone = body.timezone.trim() || null
    }

    if (typeof body.default_sprint_length_days === "number") {
      const length = Math.min(28, Math.max(1, Math.round(body.default_sprint_length_days)))
      update.default_sprint_length_days = length
    }

    if (typeof body.default_work_hours_per_day === "number") {
      const hours = Math.min(24, Math.max(1, Math.round(body.default_work_hours_per_day)))
      update.default_work_hours_per_day = hours
    }

    if (typeof body.ai_use_wizard_suggestions === "boolean") {
      update.ai_use_wizard_suggestions = body.ai_use_wizard_suggestions
    }

    if (typeof body.ai_show_rebalance_hints === "boolean") {
      update.ai_show_rebalance_hints = body.ai_show_rebalance_hints
    }

    if (typeof body.ai_report_tone === "string") {
      const tone = body.ai_report_tone === "client" ? "client" : "internal"
      update.ai_report_tone = tone
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("users")
      .update(update)
      .eq("id", user.id)
      .select(SETTINGS_COLUMNS)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ settings: data })
  } catch (error) {
    console.error("Error updating settings:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}

