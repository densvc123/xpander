import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { CreateProjectDecisionInput } from '@/types/governance'

// GET /api/projects/[id]/decisions - Get all decisions for a project
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

    // Get decisions ordered by due date
    const { data: decisions, error } = await supabase
      .from('project_decisions')
      .select('*')
      .eq('project_id', id)
      .order('due_date', { ascending: true, nullsFirst: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ decisions })
  } catch (error) {
    console.error('Error fetching decisions:', error)
    return NextResponse.json({ error: 'Failed to fetch decisions' }, { status: 500 })
  }
}

// POST /api/projects/[id]/decisions - Create a new decision
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

    const body: CreateProjectDecisionInput = await request.json()
    const { title, owner } = body

    if (!title || !owner) {
      return NextResponse.json(
        { error: 'Title and owner are required' },
        { status: 400 }
      )
    }

    const { data: decision, error } = await supabase
      .from('project_decisions')
      .insert({
        project_id: id,
        title,
        description: body.description,
        owner,
        due_date: body.due_date,
        status: body.status || 'pending',
        rationale: body.rationale
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ decision }, { status: 201 })
  } catch (error) {
    console.error('Error creating decision:', error)
    return NextResponse.json({ error: 'Failed to create decision' }, { status: 500 })
  }
}
