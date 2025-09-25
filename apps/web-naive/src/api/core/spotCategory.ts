import { requestClient } from '#/api/request';

export interface SpotCategory {
  big: string;
  middle: string;
  sub: string;
  code: string;
  id: string;
}

export async function getAllSpotCategories(): Promise<SpotCategory[]> {
  return requestClient.get<SpotCategory[]>('/open/regionSpotCategory/all');
}