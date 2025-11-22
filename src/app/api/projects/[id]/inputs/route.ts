import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/projects/[id]/inputs - Get project inputs
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

    const { data: inputs, error } = await supabase
      .from('project_inputs')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ inputs })
  } catch (error) {
    console.error('Error fetching inputs:', error)
    return NextResponse.json({ error: 'Failed to fetch inputs' }, { status: 500 })
  }
}

// POST /api/projects/[id]/inputs - Create a new input
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
    const { content, inputType = 'prd_text' } = body

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    // Get current version count
    const { count } = await supabase
      .from('project_inputs')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', id)

    const { data: input, error } = await supabase
      .from('project_inputs')
      .insert({
        project_id: id,
        content,
        input_type: inputType,
        version: (count || 0) + 1
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ input }, { status: 201 })
  } catch (error) {
    console.error('Error creating input:', error)
    return NextResponse.json({ error: 'Failed to create input' }, { status: 500 })
  }
}
