"use client"

import { useEffect, useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  User,
  Clock,
  Key,
  LogOut,
  Loader2,
  Save
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type SettingsState = {
  fullName: string
  email: string
  weeklyCapacity: number
  timezone: string
  defaultSprintLengthDays: number
  workHoursPerDay: number
  aiUseWizardSuggestions: boolean
  aiShowRebalanceHints: boolean
  aiReportTone: "internal" | "client"
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsState>({
    fullName: "",
    email: "",
    weeklyCapacity: 40,
    timezone: "",
    defaultSprintLengthDays: 14,
    workHoursPerDay: 8,
    aiUseWizardSuggestions: true,
    aiShowRebalanceHints: true,
    aiReportTone: "internal"
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const res = await fetch("/api/settings")
        if (!res.ok) {
          setError("Could not load your settings.")
          return
        }
        const data = await res.json()
        const s = data.settings
        setSettings({
          fullName: s.full_name || "",
          email: s.email || "",
          weeklyCapacity: s.weekly_capacity_hours ?? 40,
          timezone: s.timezone || "",
          defaultSprintLengthDays: s.default_sprint_length_days ?? 14,
          workHoursPerDay: s.default_work_hours_per_day ?? 8,
          aiUseWizardSuggestions: s.ai_use_wizard_suggestions ?? true,
          aiShowRebalanceHints: s.ai_show_rebalance_hints ?? true,
          aiReportTone: s.ai_report_tone === "client" ? "client" : "internal"
        })
      } catch (err) {
        console.error("Error loading settings:", err)
        setError("Unexpected error while loading settings.")
      } finally {
        setIsLoading(false)
      }
    }
    void loadSettings()
  }, [])

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setSaveMessage(null)
      setError(null)

      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: settings.fullName,
          weekly_capacity_hours: settings.weeklyCapacity,
          timezone: settings.timezone,
          default_sprint_length_days: settings.defaultSprintLengthDays,
          default_work_hours_per_day: settings.workHoursPerDay,
          ai_use_wizard_suggestions: settings.aiUseWizardSuggestions,
          ai_show_rebalance_hints: settings.aiShowRebalanceHints,
          ai_report_tone: settings.aiReportTone
        })
      })

      if (!res.ok) {
        setError("Failed to save your settings.")
        return
      }

      setSaveMessage("Settings saved")
      setTimeout(() => setSaveMessage(null), 2000)
    } catch (err) {
      console.error("Error saving settings:", err)
      setError("Unexpected error while saving settings.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <MainLayout title="Settings">
      <div className="max-w-2xl space-y-6">
        {error && (
          <Card>
            <CardContent className="py-3 text-sm text-red-600">
              {error}
            </CardContent>
          </Card>
        )}

        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-gray-500" />
              <CardTitle>Profile</CardTitle>
            </div>
            <CardDescription>Manage your personal information and identity used across projects.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={settings.fullName}
                onChange={(e) => setSettings({ ...settings, fullName: e.target.value })}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={settings.email}
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500">Email cannot be changed</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Time zone</Label>
              <Select
                value={settings.timezone || "local"}
                onValueChange={(value) =>
                  setSettings((prev) => ({
                    ...prev,
                    timezone: value === "local" ? "" : value
                  }))
                }
                disabled={isLoading}
              >
                <SelectTrigger id="timezone">
                  <SelectValue placeholder="Use browser time zone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="local">Use browser time zone</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="Asia/Bangkok">Asia/Bangkok</SelectItem>
                  <SelectItem value="Europe/London">Europe/London</SelectItem>
                  <SelectItem value="America/New_York">America/New_York</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Used for sprint dates, deadlines, and report timestamps.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Planning Defaults */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-500" />
              <CardTitle>Planning defaults</CardTitle>
            </div>
            <CardDescription>Defaults used when creating new sprints and calculating workload.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="capacity">Weekly Capacity (hours)</Label>
              <Input
                id="capacity"
                type="number"
                min={1}
                max={80}
                value={settings.weeklyCapacity}
                disabled={isLoading}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    weeklyCapacity: parseInt(e.target.value, 10) || 40
                  })
                }
              />
              <p className="text-xs text-gray-500">
                Used to calculate sprint capacity, workload charts, and AI planning.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sprint-length">Default sprint length (days)</Label>
                <Input
                  id="sprint-length"
                  type="number"
                  min={1}
                  max={28}
                  value={settings.defaultSprintLengthDays}
                  disabled={isLoading}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      defaultSprintLengthDays: parseInt(e.target.value, 10) || 14
                    })
                  }
                />
                <p className="text-xs text-gray-500">
                  Used when the sprint planner proposes new sprint windows.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="workday-hours">Working hours per day</Label>
                <Input
                  id="workday-hours"
                  type="number"
                  min={1}
                  max={24}
                  value={settings.workHoursPerDay}
                  disabled={isLoading}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      workHoursPerDay: parseInt(e.target.value, 10) || 8
                    })
                  }
                />
                <p className="text-xs text-gray-500">
                  Helps AI estimate realistic effort and buffers.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI & Automation */}
        <Card>
          <CardHeader>
            <CardTitle>AI &amp; automation</CardTitle>
            <CardDescription>
              Control how XPANDER uses AI in the project wizard, advisor, and reports.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <input
                id="ai-wizard"
                type="checkbox"
                className="mt-1"
                checked={settings.aiUseWizardSuggestions}
                disabled={isLoading}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    aiUseWizardSuggestions: e.target.checked
                  })
                }
              />
              <div>
                <Label htmlFor="ai-wizard">Use AI suggestions by default in project wizard</Label>
                <p className="text-xs text-gray-500">
                  When enabled, new projects will propose AI-generated analysis, sprint plans, and task breakdowns.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <input
                id="ai-rebalance"
                type="checkbox"
                className="mt-1"
                checked={settings.aiShowRebalanceHints}
                disabled={isLoading}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    aiShowRebalanceHints: e.target.checked
                  })
                }
              />
              <div>
                <Label htmlFor="ai-rebalance">Show AI workload rebalance prompts</Label>
                <p className="text-xs text-gray-500">
                  Controls whether “Ask AI to rebalance” hints appear on dashboards and project resources.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ai-tone">Default tone for AI reports</Label>
              <Select
                value={settings.aiReportTone}
                onValueChange={(value) =>
                  setSettings({
                    ...settings,
                    aiReportTone: value as SettingsState["aiReportTone"]
                  })
                }
                disabled={isLoading}
              >
                <SelectTrigger id="ai-tone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">Internal / team-focused</SelectItem>
                  <SelectItem value="client">Client-ready / stakeholder friendly</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Used as a hint when generating project status and sprint reports.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* API Keys */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-gray-500" />
              <CardTitle>API Configuration</CardTitle>
            </div>
            <CardDescription>Manage how XPANDER connects to AI services.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="openaiKey">OpenAI API Key</Label>
              <Input
                id="openaiKey"
                type="password"
                placeholder="sk-..."
                defaultValue=""
              />
              <p className="text-xs text-gray-500">
                This project typically uses a workspace-level key configured by the administrator. Optionally override
                it with your own key using environment variables or a secure backend configuration.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {saveMessage && <span className="text-emerald-600">{saveMessage}</span>}
          </div>
          <Button onClick={handleSave} disabled={isLoading || isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>

        <Separator />

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
            <CardDescription>Irreversible actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Sign Out</p>
                <p className="text-sm text-gray-500">Sign out from all devices</p>
              </div>
              <Button variant="destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
