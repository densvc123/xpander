import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/projects/[id]/changes - Get all change requests for a project
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

    // Get change requests with their analyses
    const { data: changeRequests, error } = await supabase
      .from('change_requests')
      .select(`
        *,
        change_request_analysis (*)
      `)
      .eq('project_id', id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ changeRequests })
  } catch (error) {
    console.error('Error fetching change requests:', error)
    return NextResponse.json({ error: 'Failed to fetch change requests' }, { status: 500 })
  }
}

// POST /api/projects/[id]/changes - Create a new change request
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
    const { title, description, change_type, priority, area, desired_due_date } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Create the change request
    const { data: changeRequest, error } = await supabase
      .from('change_requests')
      .insert({
        project_id: id,
        title,
        description,
        change_type: change_type || 'modification',
        priority: priority || 'medium',
        area: area || 'other',
        desired_due_date,
        status: 'open'
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
        change_request_id: changeRequest.id,
        action: 'created',
        description: `Change request "${title}" created`
      })

    return NextResponse.json({ changeRequest }, { status: 201 })
  } catch (error) {
    console.error('Error creating change request:', error)
    return NextResponse.json({ error: 'Failed to create change request' }, { status: 500 })
  }
}
