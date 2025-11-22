import { NextRequest, NextResponse } from 'next/server'
import { generateAIResponse } from '@/lib/openai'
import { AI_PROMPTS } from '@/lib/ai-prompts'

export async function POST(request: NextRequest) {
  try {
    const { requirements, analysis, projectName } = await request.json()

    if (!requirements && !analysis) {
      return NextResponse.json(
        { error: 'Requirements or analysis is required' },
        { status: 400 }
      )
    }

    const userPrompt = `
Project Name: ${projectName || 'Untitled Project'}

${analysis ? `Previous Analysis:
${JSON.stringify(analysis, null, 2)}

` : ''}Requirements:
${requirements}

Break down these requirements into detailed, actionable tasks. Consider all aspects: backend, frontend, database, API design, testing, and deployment.
`

    const breakdown = await generateAIResponse(
      AI_PROMPTS.taskBreakdown,
      userPrompt,
      { temperature: 0.7, maxTokens: 8192 }
    )

    return NextResponse.json({ breakdown })
  } catch (error) {
    console.error('Task breakdown error:', error)
    return NextResponse.json(
      { error: 'Failed to break down tasks' },
      { status: 500 }
    )
  }
}
