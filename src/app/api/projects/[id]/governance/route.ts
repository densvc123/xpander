import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/projects/[id]/governance - Get all governance data (risks, decisions, milestones)
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

    // Fetch all governance data in parallel
    const [risksResult, decisionsResult, milestonesResult] = await Promise.all([
      supabase
        .from('project_risks')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: false }),
      supabase
        .from('project_decisions')
        .select('*')
        .eq('project_id', id)
        .order('due_date', { ascending: true, nullsFirst: false }),
      supabase
        .from('project_milestones')
        .select('*')
        .eq('project_id', id)
        .order('due_date', { ascending: true })
    ])

    if (risksResult.error) {
      return NextResponse.json({ error: risksResult.error.message }, { status: 500 })
    }
    if (decisionsResult.error) {
      return NextResponse.json({ error: decisionsResult.error.message }, { status: 500 })
    }
    if (milestonesResult.error) {
      return NextResponse.json({ error: milestonesResult.error.message }, { status: 500 })
    }

    return NextResponse.json({
      risks: risksResult.data,
      decisions: decisionsResult.data,
      milestones: milestonesResult.data
    })
  } catch (error) {
    console.error('Error fetching governance data:', error)
    return NextResponse.json({ error: 'Failed to fetch governance data' }, { status: 500 })
  }
}
