import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateAIResponse } from '@/lib/openai'
import { AI_PROMPTS } from '@/lib/ai-prompts'

// POST /api/ai/optimize-workload - AI-powered workload optimization recommendations
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { projectId } = body

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
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

    // Get resources
    const { data: resources } = await supabase
      .from('resources')
      .select('*')
      .eq('user_id', user.id)

    // Get tasks
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index')

    // Get sprints
    const { data: sprints } = await supabase
      .from('sprints')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index')

    // Get task assignments
    const taskIds = tasks?.map(t => t.id) || []
    const { data: assignments } = await supabase
      .from('task_assignments')
      .select('*')
      .in('task_id', taskIds.length > 0 ? taskIds : [''])

    // Calculate current workload for each resource
    const resourceWorkloads = resources?.map(resource => {
      const resourceAssignments = assignments?.filter(a => a.resource_id === resource.id) || []
      const assignedTaskIds = resourceAssignments.map(a => a.task_id)
      const assignedTasks = tasks?.filter(t => assignedTaskIds.includes(t.id)) || []

      const totalHours = assignedTasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0)
      const completedHours = assignedTasks
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + (t.estimated_hours || 0), 0)

      const utilizationPct = resource.weekly_capacity_hours > 0
        ? Math.round((totalHours / resource.weekly_capacity_hours) * 100)
        : 0

      return {
        id: resource.id,
        name: resource.name,
        role: resource.role,
        capacity: resource.weekly_capacity_hours,
        assigned_hours: totalHours,
        completed_hours: completedHours,
        remaining_hours: totalHours - completedHours,
        utilization_percentage: utilizationPct,
        is_overloaded: utilizationPct > 100,
        assigned_tasks: assignedTasks.map(t => ({
          id: t.id,
          title: t.title,
          type: t.task_type,
          hours: t.estimated_hours,
          status: t.status,
          sprint_id: t.sprint_id
        }))
      }
    }) || []

    // Calculate unassigned tasks
    const assignedTaskIds = assignments?.map(a => a.task_id) || []
    const unassignedTasks = tasks?.filter(t => !assignedTaskIds.includes(t.id)) || []

    // Calculate sprint loads
    const sprintLoads = sprints?.map(sprint => {
      const sprintTasks = tasks?.filter(t => t.sprint_id === sprint.id) || []
      const totalHours = sprintTasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0)

      // Calculate total capacity for sprint
      const sprintStart = new Date(sprint.start_date)
      const sprintEnd = new Date(sprint.end_date)
      const sprintWeeks = Math.ceil((sprintEnd.getTime() - sprintStart.getTime()) / (7 * 24 * 60 * 60 * 1000))
      const totalCapacity = (resources?.reduce((sum, r) => sum + r.weekly_capacity_hours, 0) || 0) * sprintWeeks

      return {
        id: sprint.id,
        name: sprint.name,
        start_date: sprint.start_date,
        end_date: sprint.end_date,
        status: sprint.status,
        total_hours: totalHours,
        capacity: totalCapacity,
        utilization_percentage: totalCapacity > 0 ? Math.round((totalHours / totalCapacity) * 100) : 0,
        task_count: sprintTasks.length
      }
    }) || []

    // Build context for AI
    const contextPrompt = `
PROJECT CONTEXT:
Name: ${project.name}
Description: ${project.description || 'No description'}
Deadline: ${project.deadline || 'Not set'}
Current Status: ${project.status}

TEAM RESOURCES:
${resourceWorkloads.map(r => `
- ${r.name} (${r.role || 'unspecified role'})
  Capacity: ${r.capacity}h/week
  Assigned: ${r.assigned_hours}h (${r.utilization_percentage}% utilization)
  Status: ${r.is_overloaded ? 'OVERLOADED' : 'OK'}
  Tasks: ${r.assigned_tasks.map(t => `${t.title} (${t.hours}h, ${t.status})`).join(', ') || 'None'}
`).join('\n')}

SPRINTS:
${sprintLoads.map(s => `
- ${s.name}: ${s.start_date} to ${s.end_date}
  Status: ${s.status}
  Load: ${s.total_hours}h / ${s.capacity}h capacity (${s.utilization_percentage}%)
  Tasks: ${s.task_count}
`).join('\n') || 'No sprints defined'}

UNASSIGNED TASKS (${unassignedTasks.length}):
${unassignedTasks.map(t => `- ${t.title} (${t.task_type}, ${t.estimated_hours}h, priority: ${t.priority})`).join('\n') || 'None'}

ALL TASKS SUMMARY:
Total Tasks: ${tasks?.length || 0}
Total Hours: ${tasks?.reduce((sum, t) => sum + (t.estimated_hours || 0), 0) || 0}h
Completed: ${tasks?.filter(t => t.status === 'completed').length || 0}
In Progress: ${tasks?.filter(t => t.status === 'in_progress').length || 0}
Pending: ${tasks?.filter(t => t.status === 'pending').length || 0}
Blocked: ${tasks?.filter(t => t.status === 'blocked').length || 0}

Analyze this workload distribution and provide optimization recommendations.
`

    // Call AI for optimization recommendations
    const optimization = await generateAIResponse(
      AI_PROMPTS.workloadOptimization,
      contextPrompt,
      { temperature: 0.7, maxTokens: 4096 }
    )

    // Calculate team statistics
    const totalCapacity = resourceWorkloads.reduce((sum, r) => sum + r.capacity, 0)
    const totalAssigned = resourceWorkloads.reduce((sum, r) => sum + r.assigned_hours, 0)
    const overloadedCount = resourceWorkloads.filter(r => r.is_overloaded).length

    return NextResponse.json({
      optimization,
      current_state: {
        resources: resourceWorkloads,
        sprints: sprintLoads,
        unassigned_tasks: unassignedTasks.length,
        team_summary: {
          total_capacity: totalCapacity,
          total_assigned: totalAssigned,
          team_utilization: totalCapacity > 0 ? Math.round((totalAssigned / totalCapacity) * 100) : 0,
          overloaded_resources: overloadedCount,
          underutilized_resources: resourceWorkloads.filter(r => r.utilization_percentage < 50).length
        }
      }
    })
  } catch (error) {
    console.error('Error optimizing workload:', error)
    return NextResponse.json({ error: 'Failed to optimize workload' }, { status: 500 })
  }
}
