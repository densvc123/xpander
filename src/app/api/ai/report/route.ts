import { NextRequest, NextResponse } from 'next/server'
import { generateAIResponse } from '@/lib/openai'
import { AI_PROMPTS } from '@/lib/ai-prompts'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const {
      reportType = 'project_status',
      projectData,
      customPrompt
    } = await request.json()

    if (!projectData) {
      return NextResponse.json(
        { error: 'Project data is required' },
        { status: 400 }
      )
    }

    let reportInstructions = ''
    switch (reportType) {
      case 'project_status':
        reportInstructions = 'Generate a comprehensive project status report.'
        break
      case 'sprint_review':
        reportInstructions = 'Generate a sprint review report focusing on completed work and velocity.'
        break
      case 'resource_usage':
        reportInstructions = 'Generate a resource utilization report analyzing time spent and capacity.'
        break
      case 'custom':
        reportInstructions = customPrompt || 'Generate a custom project report.'
        break
      default:
        reportInstructions = 'Generate a project status report.'
    }

    // Load user settings to adjust tone if available
    let reportTone: 'internal' | 'client' = 'internal'
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: settings } = await supabase
          .from('users')
          .select('ai_report_tone')
          .eq('id', user.id)
          .single()
        if (settings?.ai_report_tone === 'client') {
          reportTone = 'client'
        }
      }
    } catch (settingsError) {
      console.warn('Unable to load report tone preference:', settingsError)
    }

    const userPrompt = `
Report Type: ${reportType}
Instructions: ${reportInstructions}
Audience / tone: ${reportTone === 'client' ? 'Client-facing, executive-ready language suitable for stakeholders.' : 'Internal team status update tone, direct and pragmatic.'}

Project Data:
${JSON.stringify(projectData, null, 2)}

Generate a professional markdown report. Include relevant metrics, charts suggestions (describe them), and actionable recommendations.
`

    const report = await generateAIResponse(
      AI_PROMPTS.reportGenerator,
      userPrompt,
      { temperature: 0.7, maxTokens: 4096 }
    )

    return NextResponse.json({
      report: report.content || report.report || JSON.stringify(report),
      reportType,
      generatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Report generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}
