import { createRouteClient } from '@/lib/supabase/route';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteClient();
    const { data, error } = await supabase
      .from('warehouses')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching warehouse:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteClient();
    const body = await request.json();

    if (!body.code || !body.name) {
      return NextResponse.json(
        { error: 'Code and name are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('warehouses')
      .update({
        code: body.code.toUpperCase(),
        name: body.name.trim()
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating warehouse:', error);
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
      .from('warehouses')
      .delete()
      .eq('id', params.id);

    if (error) throw error;

    return NextResponse.json({ message: 'Warehouse deleted' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting warehouse:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
