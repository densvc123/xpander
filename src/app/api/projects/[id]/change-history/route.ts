import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/projects/[id]/change-history - Get change history for a project
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

    // Get change history with related change requests
    const { data: history, error } = await supabase
      .from('change_history')
      .select(`
        *,
        change_requests (
          id,
          title,
          change_type,
          priority
        )
      `)
      .eq('project_id', id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ history })
  } catch (error) {
    console.error('Error fetching change history:', error)
    return NextResponse.json({ error: 'Failed to fetch change history' }, { status: 500 })
  }
}
