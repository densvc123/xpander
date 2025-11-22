import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/projects/[id]/baseline - Get all baselines for a project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user owns the project
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const { data: baselines, error } = await supabase
      .from('project_baselines')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ baselines })
  } catch (error) {
    console.error('Error fetching baselines:', error)
    return NextResponse.json({ error: 'Failed to fetch baselines' }, { status: 500 })
  }
}

// POST /api/projects/[id]/baseline - Create a new baseline (snapshot)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user owns the project
    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const body = await request.json().catch(() => ({}))
    const { name } = body

    // Get current tasks
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', id)

    // Get current sprints
    const { data: sprints } = await supabase
      .from('sprints')
      .select('*')
      .eq('project_id', id)

    // Calculate totals
    const totalHours = tasks?.reduce((sum, t) => sum + (t.estimated_hours || 0), 0) || 0
    const taskCount = tasks?.length || 0
    const sprintCount = sprints?.length || 0

    // Determine risk level based on project state
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'
    if (project.health === 'critical') riskLevel = 'critical'
    else if (project.health === 'at_risk') riskLevel = 'high'

    // Get latest sprint end date as planned delivery
    const sortedSprints = sprints?.sort((a, b) =>
      new Date(b.end_date).getTime() - new Date(a.end_date).getTime()
    )
    const plannedDelivery = sortedSprints?.[0]?.end_date || project.deadline

    // Count existing baselines for naming
    const { count } = await supabase
      .from('project_baselines')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', id)

    const baselineNumber = (count || 0) + 1
    const baselineName = name || `Baseline ${baselineNumber}`

    // Create the baseline
    const { data: baseline, error } = await supabase
      .from('project_baselines')
      .insert({
        project_id: id,
        name: baselineName,
        total_hours: totalHours,
        task_count: taskCount,
        sprint_count: sprintCount,
        planned_delivery_date: plannedDelivery,
        risk_level: riskLevel,
        tasks_snapshot: tasks || [],
        sprints_snapshot: sprints || []
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Add to change history
    await supabase
      .from('change_history')
      .insert({
        project_id: id,
        action: 'baseline_created',
        description: `Baseline "${baselineName}" created`,
        metadata: {
          baseline_id: baseline.id,
          total_hours: totalHours,
          task_count: taskCount,
          sprint_count: sprintCount
        }
      })

    return NextResponse.json({ baseline }, { status: 201 })
  } catch (error) {
    console.error('Error creating baseline:', error)
    return NextResponse.json({ error: 'Failed to create baseline' }, { status: 500 })
  }
}
