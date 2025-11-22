import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/projects/[id]/changes/[changeId]/approve - Approve a change request
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; changeId: string }> }
) {
  try {
    const { id: projectId, changeId } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user owns the project
    const { data: project } = await supabase
      .from('projects')
      .select('id, deadline')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Get the change request with its analysis
    const { data: changeRequest, error: changeError } = await supabase
      .from('change_requests')
      .select(`
        *,
        change_request_analysis (*)
      `)
      .eq('id', changeId)
      .eq('project_id', projectId)
      .single()

    if (changeError || !changeRequest) {
      return NextResponse.json({ error: 'Change request not found' }, { status: 404 })
    }

    if (changeRequest.status !== 'analyzed') {
      return NextResponse.json({ error: 'Change request must be analyzed before approval' }, { status: 400 })
    }

    const analysis = changeRequest.change_request_analysis?.[0]

    // Update change request status to approved
    const { error: updateError } = await supabase
      .from('change_requests')
      .update({ status: 'approved' })
      .eq('id', changeId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // If there's an analysis with new tasks, create them
    if (analysis && analysis.new_tasks && Array.isArray(analysis.new_tasks)) {
      const newTasks = analysis.new_tasks as Array<{
        title: string
        description: string
        task_type: string
        estimate_hours: number
        priority: string
      }>

      if (newTasks.length > 0) {
        const priorityMap: Record<string, number> = {
          'critical': 1,
          'high': 2,
          'medium': 3,
          'low': 4
        }

        const tasksToInsert = newTasks.map((task, index) => ({
          project_id: projectId,
          title: task.title,
          description: task.description,
          task_type: task.task_type || 'other',
          status: 'pending',
          priority: priorityMap[task.priority] || 3,
          estimated_hours: task.estimate_hours || 0,
          order_index: 1000 + index // Add at the end
        }))

        await supabase.from('tasks').insert(tasksToInsert)
      }
    }

    // Add to change history
    await supabase
      .from('change_history')
      .insert({
        project_id: projectId,
        change_request_id: changeId,
        action: 'approved',
        description: `Change request "${changeRequest.title}" approved`,
        delta_hours: analysis?.effort_hours || 0,
        delta_days: analysis?.impact_on_deadline_days || 0,
        metadata: {
          new_tasks_count: analysis?.new_tasks?.length || 0,
          updated_tasks_count: analysis?.updated_tasks?.length || 0
        }
      })

    return NextResponse.json({
      success: true,
      message: 'Change request approved',
      tasksCreated: analysis?.new_tasks?.length || 0
    })
  } catch (error) {
    console.error('Error approving change request:', error)
    return NextResponse.json({ error: 'Failed to approve change request' }, { status: 500 })
  }
}
