import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ResourceRole } from '@/types/database'

// GET /api/projects/[id]/resources - Get project resources with workload data
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
      .select('id, user_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Get resources for this user
    const { data: resources, error: resourcesError } = await supabase
      .from('resources')
      .select('*')
      .eq('user_id', user.id)

    if (resourcesError) {
      return NextResponse.json({ error: resourcesError.message }, { status: 500 })
    }

    // Get all tasks for this project with assignments
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, title, status, estimated_hours, sprint_id')
      .eq('project_id', id)

    // Get task assignments
    const { data: assignments } = await supabase
      .from('task_assignments')
      .select('task_id, resource_id, assigned_hours')

    // Get sprints
    const { data: sprints } = await supabase
      .from('sprints')
      .select('id, name, start_date, end_date, status')
      .eq('project_id', id)
      .order('order_index', { ascending: true })

    // Calculate workload for each resource
    const resourcesWithWorkload = resources?.map(resource => {
      const resourceAssignments = assignments?.filter(a => a.resource_id === resource.id) || []
      const assignedTaskIds = resourceAssignments.map(a => a.task_id)
      const assignedTasks = tasks?.filter(t => assignedTaskIds.includes(t.id)) || []

      const totalAssignedHours = resourceAssignments.reduce((sum, a) =>
        sum + (a.assigned_hours || assignedTasks.find(t => t.id === a.task_id)?.estimated_hours || 0), 0)

      const completedHours = assignedTasks
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + (t.estimated_hours || 0), 0)

      const remainingHours = totalAssignedHours - completedHours
      const utilizationPercentage = resource.weekly_capacity_hours > 0
        ? Math.round((totalAssignedHours / resource.weekly_capacity_hours) * 100)
        : 0

      // Determine workload level
      let workloadLevel: 'underloaded' | 'optimal' | 'heavy' | 'overloaded'
      if (utilizationPercentage < 50) workloadLevel = 'underloaded'
      else if (utilizationPercentage <= 80) workloadLevel = 'optimal'
      else if (utilizationPercentage <= 100) workloadLevel = 'heavy'
      else workloadLevel = 'overloaded'

      // Calculate sprint breakdown
      const sprintBreakdown = sprints?.map(sprint => {
        const sprintTasks = assignedTasks.filter(t => t.sprint_id === sprint.id)
        const sprintAssignedHours = sprintTasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0)
        // Calculate capacity based on sprint duration
        const sprintStart = new Date(sprint.start_date)
        const sprintEnd = new Date(sprint.end_date)
        const sprintWeeks = Math.ceil((sprintEnd.getTime() - sprintStart.getTime()) / (7 * 24 * 60 * 60 * 1000))
        const sprintCapacity = resource.weekly_capacity_hours * sprintWeeks

        return {
          sprint_id: sprint.id,
          sprint_name: sprint.name,
          assigned_hours: sprintAssignedHours,
          capacity_hours: sprintCapacity,
          utilization: sprintCapacity > 0 ? Math.round((sprintAssignedHours / sprintCapacity) * 100) : 0
        }
      }) || []

      return {
        ...resource,
        total_assigned_hours: totalAssignedHours,
        completed_hours: completedHours,
        remaining_hours: remainingHours,
        utilization_percentage: utilizationPercentage,
        workload_level: workloadLevel,
        assigned_task_count: assignedTasks.length,
        overdue_tasks: 0, // TODO: Calculate based on due dates
        sprint_breakdown: sprintBreakdown
      }
    }) || []

    // Calculate team summary
    const totalCapacity = resourcesWithWorkload.reduce((sum, r) => sum + r.weekly_capacity_hours, 0)
    const totalAssigned = resourcesWithWorkload.reduce((sum, r) => sum + r.total_assigned_hours, 0)

    const teamSummary = {
      total_team_capacity: totalCapacity,
      total_assigned_hours: totalAssigned,
      team_utilization_percentage: totalCapacity > 0 ? Math.round((totalAssigned / totalCapacity) * 100) : 0,
      overallocated_resources: resourcesWithWorkload.filter(r => r.workload_level === 'overloaded').length,
      underutilized_resources: resourcesWithWorkload.filter(r => r.workload_level === 'underloaded').length,
      workload_distribution: {
        underloaded: resourcesWithWorkload.filter(r => r.workload_level === 'underloaded').length,
        optimal: resourcesWithWorkload.filter(r => r.workload_level === 'optimal').length,
        heavy: resourcesWithWorkload.filter(r => r.workload_level === 'heavy').length,
        overloaded: resourcesWithWorkload.filter(r => r.workload_level === 'overloaded').length
      },
      bottlenecks: resourcesWithWorkload
        .filter(r => r.workload_level === 'overloaded')
        .map(r => ({
          resource_name: r.name,
          overload_hours: r.total_assigned_hours - r.weekly_capacity_hours,
          affected_tasks: [] as string[]
        }))
    }

    return NextResponse.json({
      resources: resourcesWithWorkload,
      team_summary: teamSummary,
      sprints: sprints || []
    })
  } catch (error) {
    console.error('Error fetching resources:', error)
    return NextResponse.json({ error: 'Failed to fetch resources' }, { status: 500 })
  }
}

// POST /api/projects/[id]/resources - Create a new resource
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
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name, role, weekly_capacity_hours } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const { data: resource, error } = await supabase
      .from('resources')
      .insert({
        user_id: user.id,
        name,
        role: role || 'other',
        weekly_capacity_hours: weekly_capacity_hours || 40
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ resource }, { status: 201 })
  } catch (error) {
    console.error('Error creating resource:', error)
    return NextResponse.json({ error: 'Failed to create resource' }, { status: 500 })
  }
}

// PUT /api/projects/[id]/resources - Update resource
export async function PUT(
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

    const body = await request.json()
    const { resource_id, name, role, weekly_capacity_hours } = body

    if (!resource_id) {
      return NextResponse.json({ error: 'Resource ID is required' }, { status: 400 })
    }

    const { data: resource, error } = await supabase
      .from('resources')
      .update({
        name,
        role,
        weekly_capacity_hours
      })
      .eq('id', resource_id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ resource })
  } catch (error) {
    console.error('Error updating resource:', error)
    return NextResponse.json({ error: 'Failed to update resource' }, { status: 500 })
  }
}
