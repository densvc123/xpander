import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/projects/[id]/resources/allocations - Get all allocations for project
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

    // Get all tasks for this project
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, title, status, estimated_hours, sprint_id, task_type')
      .eq('project_id', id)

    const taskIds = tasks?.map(t => t.id) || []

    // Get all assignments for these tasks
    const { data: assignments, error } = await supabase
      .from('task_assignments')
      .select('*')
      .in('task_id', taskIds.length > 0 ? taskIds : [''])

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get resources
    const { data: resources } = await supabase
      .from('resources')
      .select('id, name, role')
      .eq('user_id', user.id)

    // Get sprints
    const { data: sprints } = await supabase
      .from('sprints')
      .select('id, name, start_date, end_date')
      .eq('project_id', id)

    // Build allocation view
    const allocations = resources?.map(resource => {
      const resourceAssignments = assignments?.filter(a => a.resource_id === resource.id) || []
      const assignedTaskIds = resourceAssignments.map(a => a.task_id)
      const assignedTasks = tasks?.filter(t => assignedTaskIds.includes(t.id)) || []

      // Group by sprint
      const sprintAllocations = sprints?.map(sprint => ({
        sprint_id: sprint.id,
        sprint_name: sprint.name,
        tasks: assignedTasks
          .filter(t => t.sprint_id === sprint.id)
          .map(t => ({
            task_id: t.id,
            task_title: t.title,
            task_type: t.task_type,
            status: t.status,
            allocated_hours: resourceAssignments.find(a => a.task_id === t.id)?.assigned_hours || t.estimated_hours
          })),
        total_hours: assignedTasks
          .filter(t => t.sprint_id === sprint.id)
          .reduce((sum, t) => sum + (t.estimated_hours || 0), 0)
      })) || []

      // Unassigned to sprint
      const unassignedTasks = assignedTasks.filter(t => !t.sprint_id)

      return {
        resource_id: resource.id,
        resource_name: resource.name,
        role: resource.role,
        sprint_allocations: sprintAllocations,
        unassigned_tasks: unassignedTasks.map(t => ({
          task_id: t.id,
          task_title: t.title,
          task_type: t.task_type,
          status: t.status,
          allocated_hours: resourceAssignments.find(a => a.task_id === t.id)?.assigned_hours || t.estimated_hours
        })),
        total_allocated_hours: assignedTasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0)
      }
    }) || []

    return NextResponse.json({ allocations })
  } catch (error) {
    console.error('Error fetching allocations:', error)
    return NextResponse.json({ error: 'Failed to fetch allocations' }, { status: 500 })
  }
}

// POST /api/projects/[id]/resources/allocations - Assign task to resource
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
    const { task_id, resource_id, assigned_hours } = body

    if (!task_id || !resource_id) {
      return NextResponse.json({ error: 'task_id and resource_id are required' }, { status: 400 })
    }

    // Verify task belongs to project
    const { data: task } = await supabase
      .from('tasks')
      .select('id, estimated_hours')
      .eq('id', task_id)
      .eq('project_id', id)
      .single()

    if (!task) {
      return NextResponse.json({ error: 'Task not found in project' }, { status: 404 })
    }

    // Verify resource belongs to user
    const { data: resource } = await supabase
      .from('resources')
      .select('id')
      .eq('id', resource_id)
      .eq('user_id', user.id)
      .single()

    if (!resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 })
    }

    // Check if assignment already exists
    const { data: existing } = await supabase
      .from('task_assignments')
      .select('id')
      .eq('task_id', task_id)
      .eq('resource_id', resource_id)
      .single()

    if (existing) {
      // Update existing assignment
      const { data: updated, error } = await supabase
        .from('task_assignments')
        .update({ assigned_hours: assigned_hours || task.estimated_hours })
        .eq('task_id', task_id)
        .eq('resource_id', resource_id)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ assignment: updated })
    }

    // Create new assignment
    const { data: assignment, error } = await supabase
      .from('task_assignments')
      .insert({
        task_id,
        resource_id,
        assigned_hours: assigned_hours || task.estimated_hours
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ assignment }, { status: 201 })
  } catch (error) {
    console.error('Error creating allocation:', error)
    return NextResponse.json({ error: 'Failed to create allocation' }, { status: 500 })
  }
}

// DELETE /api/projects/[id]/resources/allocations - Remove task assignment
export async function DELETE(
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
    const { task_id, resource_id } = body

    if (!task_id || !resource_id) {
      return NextResponse.json({ error: 'task_id and resource_id are required' }, { status: 400 })
    }

    // Ensure task belongs to the project before deleting assignment
    const { data: task } = await supabase
      .from('tasks')
      .select('id')
      .eq('id', task_id)
      .eq('project_id', id)
      .single()

    if (!task) {
      return NextResponse.json({ error: 'Task not found in project' }, { status: 404 })
    }

    const { error } = await supabase
      .from('task_assignments')
      .delete()
      .eq('task_id', task_id)
      .eq('resource_id', resource_id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting allocation:', error)
    return NextResponse.json({ error: 'Failed to delete allocation' }, { status: 500 })
  }
}
