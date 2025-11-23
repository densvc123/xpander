import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { CreateProjectRiskInput } from '@/types/governance'

// GET /api/projects/[id]/risks - Get all risks for a project
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

    // Get risks ordered by severity (critical first)
    const { data: risks, error } = await supabase
      .from('project_risks')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ risks })
  } catch (error) {
    console.error('Error fetching risks:', error)
    return NextResponse.json({ error: 'Failed to fetch risks' }, { status: 500 })
  }
}

// POST /api/projects/[id]/risks - Create a new risk
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

    const body: CreateProjectRiskInput = await request.json()
    const { title, owner, severity, impact } = body

    if (!title || !owner || !severity || !impact) {
      return NextResponse.json(
        { error: 'Title, owner, severity, and impact are required' },
        { status: 400 }
      )
    }

    const { data: risk, error } = await supabase
      .from('project_risks')
      .insert({
        project_id: id,
        title,
        description: body.description,
        owner,
        severity,
        status: body.status || 'open',
        impact,
        mitigation_plan: body.mitigation_plan,
        due_date: body.due_date
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ risk }, { status: 201 })
  } catch (error) {
    console.error('Error creating risk:', error)
    return NextResponse.json({ error: 'Failed to create risk' }, { status: 500 })
  }
}
