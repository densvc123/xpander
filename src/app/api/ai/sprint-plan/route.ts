import { NextRequest, NextResponse } from 'next/server'
import { generateAIResponse } from '@/lib/openai'
import { AI_PROMPTS } from '@/lib/ai-prompts'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const {
      tasks,
      startDate,
      deadline,
      weeklyCapacity = 40,
      sprintLength = 14 // days
    } = await request.json()

    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json(
        { error: 'Tasks array is required' },
        { status: 400 }
      )
    }

    // Try to refine capacity / sprint length based on user defaults
    let effectiveWeeklyCapacity = weeklyCapacity
    let effectiveSprintLength = sprintLength
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: settings } = await supabase
          .from('users')
          .select('weekly_capacity_hours, default_sprint_length_days')
          .eq('id', user.id)
          .single()

        if (settings?.weekly_capacity_hours) {
          effectiveWeeklyCapacity = settings.weekly_capacity_hours
        }
        if (settings?.default_sprint_length_days) {
          effectiveSprintLength = settings.default_sprint_length_days
        }
      }
    } catch (settingsError) {
      console.warn('Unable to load sprint planning defaults:', settingsError)
    }

    const userPrompt = `
Planning Constraints:
- Start Date: ${startDate || new Date().toISOString().split('T')[0]}
- Target Deadline: ${deadline || 'Flexible'}
- Weekly Capacity: ${effectiveWeeklyCapacity} hours
- Preferred Sprint Length: ${effectiveSprintLength} days

Tasks to Plan:
${JSON.stringify(tasks, null, 2)}

Create a sprint plan that:
1. Respects task dependencies
2. Balances workload across sprints
3. Keeps each sprint focused on related work
4. Includes buffer time for unexpected issues
5. Prioritizes critical path items early
`

    const sprintPlan = await generateAIResponse(
      AI_PROMPTS.sprintPlanner,
      userPrompt,
      { temperature: 0.7, maxTokens: 8192 }
    )

    return NextResponse.json({ sprintPlan })
  } catch (error) {
    console.error('Sprint planning error:', error)
    return NextResponse.json(
      { error: 'Failed to plan sprints' },
      { status: 500 }
    )
  }
}
