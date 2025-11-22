import { NextRequest, NextResponse } from 'next/server'
import { generateAIResponse } from '@/lib/openai'
import { AI_PROMPTS } from '@/lib/ai-prompts'

export async function POST(request: NextRequest) {
  try {
    const {
      message,
      projectContext,
      conversationHistory = []
    } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Build context from project data
    const contextSummary = projectContext ? `
Current Project Context:
- Project: ${projectContext.name || 'Unknown'}
- Status: ${projectContext.status || 'Unknown'}
- Progress: ${projectContext.progress || 0}%
- Deadline: ${projectContext.deadline || 'Not set'}
- Total Tasks: ${projectContext.totalTasks || 0}
- Completed Tasks: ${projectContext.completedTasks || 0}
- Active Sprint: ${projectContext.activeSprint || 'None'}
- Key Risks: ${projectContext.risks?.join(', ') || 'None identified'}
` : ''

    // Build conversation history
    const historyText = conversationHistory
      .slice(-10) // Last 10 messages for context
      .map((msg: { role: string; content: string }) => `${msg.role}: ${msg.content}`)
      .join('\n')

    const userPrompt = `
${contextSummary}

${historyText ? `Previous conversation:\n${historyText}\n\n` : ''}
User question: ${message}
`

    const response = await generateAIResponse(
      AI_PROMPTS.advisor,
      userPrompt,
      {
        temperature: 0.8,
        maxTokens: 1024
      }
    )

    // The advisor returns a JSON object, but we want the message content
    const advisorResponse = response.response || response.message || JSON.stringify(response)

    return NextResponse.json({
      response: advisorResponse,
      role: 'assistant'
    })
  } catch (error) {
    console.error('AI Advisor error:', error)
    return NextResponse.json(
      { error: 'Failed to get advisor response' },
      { status: 500 }
    )
  }
}
