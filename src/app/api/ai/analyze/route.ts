import { NextRequest, NextResponse } from 'next/server'
import { generateAIResponse } from '@/lib/openai'
import { AI_PROMPTS } from '@/lib/ai-prompts'

export async function POST(request: NextRequest) {
  try {
    const { requirements, projectName, deadline } = await request.json()

    if (!requirements) {
      return NextResponse.json(
        { error: 'Requirements are required' },
        { status: 400 }
      )
    }

    const userPrompt = `
Project Name: ${projectName || 'Untitled Project'}
Target Deadline: ${deadline || 'Not specified'}

Requirements:
${requirements}
`

    const analysis = await generateAIResponse(
      AI_PROMPTS.projectAnalysis,
      userPrompt,
      { temperature: 0.7 }
    )

    return NextResponse.json({ analysis })
  } catch (error) {
    console.error('AI Analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze project' },
      { status: 500 }
    )
  }
}
