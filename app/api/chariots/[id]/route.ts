
import { createRouteClient } from '@/lib/supabase/route';
import { NextResponse } from 'next/server';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteClient();
    const body = await request.json();

    const { data, error } = await supabase
      .from('chariots')
      .update(body)
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteClient();
    const { error } = await supabase
      .from('chariots')
      .delete()
      .eq('id', params.id);

    if (error) throw error;

    return NextResponse.json({ message: 'Chariot deleted' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}