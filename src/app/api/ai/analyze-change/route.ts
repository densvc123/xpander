import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateAIResponse } from '@/lib/openai'
import { AI_PROMPTS } from '@/lib/ai-prompts'

// POST /api/ai/analyze-change - Analyze impact of a change request
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { changeRequestId, projectId } = body

    if (!changeRequestId || !projectId) {
      return NextResponse.json({ error: 'changeRequestId and projectId are required' }, { status: 400 })
    }

    // Verify user owns the project
    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Get the change request
    const { data: changeRequest, error: changeError } = await supabase
      .from('change_requests')
      .select('*')
      .eq('id', changeRequestId)
      .eq('project_id', projectId)
      .single()

    if (changeError || !changeRequest) {
      return NextResponse.json({ error: 'Change request not found' }, { status: 404 })
    }

    // Get current tasks
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index')

    // Get current sprints
    const { data: sprints } = await supabase
      .from('sprints')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index')

    // Get latest baseline if exists
    const { data: baselines } = await supabase
      .from('project_baselines')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)

    const baseline = baselines?.[0]

    // Calculate current totals
    const currentTotalHours = tasks?.reduce((sum, t) => sum + (t.estimated_hours || 0), 0) || 0

    // Build context for AI
    const contextPrompt = `
PROJECT CONTEXT:
Name: ${project.name}
Description: ${project.description || 'No description'}
Deadline: ${project.deadline || 'Not set'}
Current Status: ${project.status}

BASELINE (if exists):
${baseline ? `
- Total Hours: ${baseline.total_hours}
- Task Count: ${baseline.task_count}
- Sprint Count: ${baseline.sprint_count}
- Planned Delivery: ${baseline.planned_delivery_date}
` : 'No baseline exists yet'}

CURRENT STATE:
- Total Hours: ${currentTotalHours}
- Task Count: ${tasks?.length || 0}
- Sprint Count: ${sprints?.length || 0}

CURRENT TASKS:
${tasks?.map(t => `- ${t.title} (${t.task_type}, ${t.estimated_hours}h, ${t.status})`).join('\n') || 'No tasks'}

CURRENT SPRINTS:
${sprints?.map(s => `- ${s.name}: ${s.start_date} to ${s.end_date} (${s.status})`).join('\n') || 'No sprints'}

CHANGE REQUEST:
Title: ${changeRequest.title}
Description: ${changeRequest.description || 'No description'}
Type: ${changeRequest.change_type}
Priority: ${changeRequest.priority}
Area: ${changeRequest.area}
Desired Due Date: ${changeRequest.desired_due_date || 'Not specified'}

Analyze this change request and provide impact assessment.
`

    // Call AI for analysis
    const analysis = await generateAIResponse(
      AI_PROMPTS.changeImpactAnalysis,
      contextPrompt,
      { temperature: 0.7, maxTokens: 4096 }
    )

    // Calculate baseline comparison
    const baselineComparison = {
      baseline_total_hours: baseline?.total_hours || currentTotalHours,
      new_total_hours: currentTotalHours + (analysis.effort_hours || 0) + (analysis.rework_hours || 0),
      delta_hours: (analysis.effort_hours || 0) + (analysis.rework_hours || 0),
      baseline_delivery_date: baseline?.planned_delivery_date || project.deadline,
      new_delivery_date: null as string | null,
      delta_days: analysis.impact_on_deadline_days || 0,
      baseline_sprint_count: baseline?.sprint_count || (sprints?.length || 0),
      new_sprint_count: sprints?.length || 0,
      sprint_overload: [] as string[]
    }

    // Calculate new delivery date
    if (baselineComparison.baseline_delivery_date && baselineComparison.delta_days > 0) {
      const baseDate = new Date(baselineComparison.baseline_delivery_date)
      baseDate.setDate(baseDate.getDate() + baselineComparison.delta_days)
      baselineComparison.new_delivery_date = baseDate.toISOString().split('T')[0]
    }

    // Store the analysis
    const { data: savedAnalysis, error: saveError } = await supabase
      .from('change_request_analysis')
      .insert({
        change_request_id: changeRequestId,
        impact_summary: analysis.impact_summary,
        affected_modules: analysis.affected_modules || [],
        new_tasks: analysis.new_tasks || [],
        updated_tasks: analysis.updated_tasks || [],
        risks: analysis.risks || [],
        effort_hours: analysis.effort_hours || 0,
        rework_hours: analysis.rework_hours || 0,
        impact_on_deadline_days: analysis.impact_on_deadline_days || 0,
        baseline_comparison: baselineComparison,
        model_used: 'gpt-4o-mini'
      })
      .select()
      .single()

    if (saveError) {
      console.error('Error saving analysis:', saveError)
      return NextResponse.json({ error: 'Failed to save analysis' }, { status: 500 })
    }

    // Update change request status to analyzed
    await supabase
      .from('change_requests')
      .update({ status: 'analyzed' })
      .eq('id', changeRequestId)

    // Add to change history
    await supabase
      .from('change_history')
      .insert({
        project_id: projectId,
        change_request_id: changeRequestId,
        action: 'analyzed',
        description: `Change request "${changeRequest.title}" analyzed`,
        delta_hours: (analysis.effort_hours || 0) + (analysis.rework_hours || 0),
        delta_days: analysis.impact_on_deadline_days || 0
      })

    return NextResponse.json({
      analysis: savedAnalysis,
      baselineComparison
    })
  } catch (error) {
    console.error('Error analyzing change request:', error)
    return NextResponse.json({ error: 'Failed to analyze change request' }, { status: 500 })
  }
}
