import { createRouteClient } from '@/lib/supabase/route';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createRouteClient();
    const { data, error } = await supabase
      .from('chariots')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data: data ?? [] }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createRouteClient();
    const body = await request.json();

    const { data, error } = await supabase
      .from('chariots')
      .insert([body])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
