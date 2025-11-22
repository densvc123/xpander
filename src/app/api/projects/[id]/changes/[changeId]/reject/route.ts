import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/projects/[id]/changes/[changeId]/reject - Reject a change request
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
      .select('id')
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
      .eq('id', changeId)
      .eq('project_id', projectId)
      .single()

    if (changeError || !changeRequest) {
      return NextResponse.json({ error: 'Change request not found' }, { status: 404 })
    }

    const body = await request.json().catch(() => ({}))
    const { reason } = body

    // Update change request status to rejected
    const { error: updateError } = await supabase
      .from('change_requests')
      .update({ status: 'rejected' })
      .eq('id', changeId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Add to change history
    await supabase
      .from('change_history')
      .insert({
        project_id: projectId,
        change_request_id: changeId,
        action: 'rejected',
        description: `Change request "${changeRequest.title}" rejected${reason ? `: ${reason}` : ''}`,
        metadata: { rejection_reason: reason || null }
      })

    return NextResponse.json({
      success: true,
      message: 'Change request rejected'
    })
  } catch (error) {
    console.error('Error rejecting change request:', error)
    return NextResponse.json({ error: 'Failed to reject change request' }, { status: 500 })
  }
}
