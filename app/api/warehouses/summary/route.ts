import { createRouteClient } from '@/lib/supabase/route';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createRouteClient();

    const { data: warehouses, error: whError } = await supabase
      .from('warehouses')
      .select('*')
      .order('name', { ascending: true });

    if (whError) throw whError;

    if (!warehouses || warehouses.length === 0) {
      return NextResponse.json({ data: [] }, { status: 200 });
    }

    const { data: floors } = await supabase
      .from('floors')
      .select('id, warehouse_id');

    const { data: locations } = await supabase
      .from('locations')
      .select('floor_id');

    const floorsByWarehouse = new Map<string, string[]>();
    const locationsByFloor = new Map<string, number>();

    for (const floor of floors ?? []) {
      const list = floorsByWarehouse.get(floor.warehouse_id) ?? [];
      list.push(floor.id);
      floorsByWarehouse.set(floor.warehouse_id, list);
    }

    for (const loc of locations ?? []) {
      locationsByFloor.set(
        loc.floor_id,
        (locationsByFloor.get(loc.floor_id) ?? 0) + 1
      );
    }

    const data = warehouses.map((wh) => {
      const whFloors = floorsByWarehouse.get(wh.id) ?? [];
      const locsCount = whFloors.reduce(
        (sum, fid) => sum + (locationsByFloor.get(fid) ?? 0),
        0
      );
      return {
        ...wh,
        floors_count: whFloors.length,
        locations_count: locsCount,
      };
    });

    return NextResponse.json({ data }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching warehouses summary:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}