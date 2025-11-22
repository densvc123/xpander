import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/projects/[id]/sprints - Get project sprints
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

    const { data: sprints, error } = await supabase
      .from('sprints')
      .select(`
        *,
        tasks (*)
      `)
      .eq('project_id', id)
      .order('order_index', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ sprints })
  } catch (error) {
    console.error('Error fetching sprints:', error)
    return NextResponse.json({ error: 'Failed to fetch sprints' }, { status: 500 })
  }
}

// POST /api/projects/[id]/sprints - Create sprints (bulk)
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
    const { sprints } = body

    if (!sprints || !Array.isArray(sprints)) {
      return NextResponse.json({ error: 'Sprints array is required' }, { status: 400 })
    }

    // Prepare sprints for insertion
    const sprintsToInsert = sprints.map((sprint, index) => ({
      project_id: id,
      name: sprint.name,
      goal: sprint.goal,
      start_date: sprint.start_date,
      end_date: sprint.end_date,
      status: sprint.status || 'planned',
      order_index: index
    }))

    const { data: createdSprints, error } = await supabase
      .from('sprints')
      .insert(sprintsToInsert)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ sprints: createdSprints }, { status: 201 })
  } catch (error) {
    console.error('Error creating sprints:', error)
    return NextResponse.json({ error: 'Failed to create sprints' }, { status: 500 })
  }
}
