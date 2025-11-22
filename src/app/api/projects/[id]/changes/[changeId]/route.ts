import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/projects/[id]/changes/[changeId] - Get a single change request with analysis
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; changeId: string }> }
) {
  try {
    const { id, changeId } = await params
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

    // Get the change request with analysis
    const { data: changeRequest, error } = await supabase
      .from('change_requests')
      .select(`
        *,
        change_request_analysis (*)
      `)
      .eq('id', changeId)
      .eq('project_id', id)
      .single()

    if (error || !changeRequest) {
      return NextResponse.json({ error: 'Change request not found' }, { status: 404 })
    }

    return NextResponse.json({ changeRequest })
  } catch (error) {
    console.error('Error fetching change request:', error)
    return NextResponse.json({ error: 'Failed to fetch change request' }, { status: 500 })
  }
}

// PATCH /api/projects/[id]/changes/[changeId] - Update a change request
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; changeId: string }> }
) {
  try {
    const { id, changeId } = await params
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
    const updateData: Record<string, unknown> = {}

    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.change_type !== undefined) updateData.change_type = body.change_type
    if (body.priority !== undefined) updateData.priority = body.priority
    if (body.area !== undefined) updateData.area = body.area
    if (body.status !== undefined) updateData.status = body.status
    if (body.desired_due_date !== undefined) updateData.desired_due_date = body.desired_due_date

    const { data: changeRequest, error } = await supabase
      .from('change_requests')
      .update(updateData)
      .eq('id', changeId)
      .eq('project_id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ changeRequest })
  } catch (error) {
    console.error('Error updating change request:', error)
    return NextResponse.json({ error: 'Failed to update change request' }, { status: 500 })
  }
}

// DELETE /api/projects/[id]/changes/[changeId] - Delete a change request
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; changeId: string }> }
) {
  try {
    const { id, changeId } = await params
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

    const { error } = await supabase
      .from('change_requests')
      .delete()
      .eq('id', changeId)
      .eq('project_id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting change request:', error)
    return NextResponse.json({ error: 'Failed to delete change request' }, { status: 500 })
  }
}
