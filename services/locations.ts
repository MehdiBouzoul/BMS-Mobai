export type LocationType = 'storage' | 'picking' | 'receiving' | 'shipping' | 'staging';

export interface Location {
  id: string;
  floor_id: string;
  code: string;
  type: LocationType;
  is_active: boolean;
  created_at?: string;
}

export interface CreateLocationDto {
  floor_id: string;
  code: string;
  type: LocationType;
  is_active?: boolean;
}

export interface UpdateLocationDto {
  code: string;
  type: LocationType;
  is_active: boolean;
}

export const locationService = {
  async getAll(floorId?: string): Promise<Location[]> {
    const url = floorId 
      ? `/api/locations?floor_id=${floorId}`
      : '/api/locations';
    const response = await fetch(url);
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    return result.data;
  },

  async create(dto: CreateLocationDto): Promise<Location> {
    const response = await fetch('/api/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    return result.data;
  },

  async update(id: string, dto: UpdateLocationDto): Promise<Location> {
    const response = await fetch(`/api/locations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    return result.data;
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`/api/locations/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error);
    }
  },
};
