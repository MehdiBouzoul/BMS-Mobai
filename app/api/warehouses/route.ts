import { createRouteClient } from '@/lib/supabase/route';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createRouteClient();
    const { data, error } = await supabase
      .from('warehouses')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ data: data ?? [] }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching warehouses:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
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
      .insert([{
        code: body.code.toUpperCase(),
        name: body.name.trim()
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating warehouse:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
