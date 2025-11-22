import { NextRequest, NextResponse } from 'next/server'
import { generateAIResponse } from '@/lib/openai'
import { AI_PROMPTS } from '@/lib/ai-prompts'

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

    const userPrompt = `
Planning Constraints:
- Start Date: ${startDate || new Date().toISOString().split('T')[0]}
- Target Deadline: ${deadline || 'Flexible'}
- Weekly Capacity: ${weeklyCapacity} hours
- Preferred Sprint Length: ${sprintLength} days

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
