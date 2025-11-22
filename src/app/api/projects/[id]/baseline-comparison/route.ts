import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/projects/[id]/baseline-comparison - Compare current state with baseline
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
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Get the latest baseline
    const { data: baselines } = await supabase
      .from('project_baselines')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: false })
      .limit(1)

    const baseline = baselines?.[0]

    // Get current tasks
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', id)

    // Get current sprints
    const { data: sprints } = await supabase
      .from('sprints')
      .select(`
        *,
        tasks (*)
      `)
      .eq('project_id', id)
      .order('order_index')

    // Calculate current totals
    const currentTotalHours = tasks?.reduce((sum, t) => sum + (t.estimated_hours || 0), 0) || 0
    const currentTaskCount = tasks?.length || 0
    const currentSprintCount = sprints?.length || 0

    // Get latest sprint end date as current planned delivery
    const sortedSprints = sprints?.sort((a, b) =>
      new Date(b.end_date).getTime() - new Date(a.end_date).getTime()
    )
    const currentDeliveryDate = sortedSprints?.[0]?.end_date || project.deadline

    // Calculate sprint load for overload detection
    const sprintOverload: string[] = []
    if (sprints) {
      for (const sprint of sprints) {
        const sprintTasks = sprint.tasks || []
        const sprintHours = sprintTasks.reduce((sum: number, t: { estimated_hours?: number }) =>
          sum + (t.estimated_hours || 0), 0
        )

        // Calculate sprint capacity (assuming 40h/week, 2 week sprints)
        const startDate = new Date(sprint.start_date)
        const endDate = new Date(sprint.end_date)
        const weeks = Math.ceil((endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
        const sprintCapacity = weeks * 40 // 40 hours per week

        if (sprintHours > sprintCapacity * 0.9) { // 90% threshold
          sprintOverload.push(sprint.name)
        }
      }
    }

    // Build comparison
    const comparison = {
      has_baseline: !!baseline,
      baseline: baseline ? {
        id: baseline.id,
        name: baseline.name,
        created_at: baseline.created_at,
        total_hours: baseline.total_hours,
        task_count: baseline.task_count,
        sprint_count: baseline.sprint_count,
        planned_delivery_date: baseline.planned_delivery_date,
        risk_level: baseline.risk_level
      } : null,
      current: {
        total_hours: currentTotalHours,
        task_count: currentTaskCount,
        sprint_count: currentSprintCount,
        planned_delivery_date: currentDeliveryDate,
        health: project.health
      },
      delta: {
        hours: currentTotalHours - (baseline?.total_hours || 0),
        tasks: currentTaskCount - (baseline?.task_count || 0),
        sprints: currentSprintCount - (baseline?.sprint_count || 0),
        days: 0
      },
      sprint_overload: sprintOverload
    }

    // Calculate days delta
    if (baseline?.planned_delivery_date && currentDeliveryDate) {
      const baselineDate = new Date(baseline.planned_delivery_date)
      const currentDate = new Date(currentDeliveryDate)
      comparison.delta.days = Math.round(
        (currentDate.getTime() - baselineDate.getTime()) / (24 * 60 * 60 * 1000)
      )
    }

    return NextResponse.json({ comparison })
  } catch (error) {
    console.error('Error fetching baseline comparison:', error)
    return NextResponse.json({ error: 'Failed to fetch baseline comparison' }, { status: 500 })
  }
}
