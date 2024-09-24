import { requestClient } from '#/api/request';

export interface AttractionGalleryViewReq {
  regionId?: number;
  title?: string;
}

export interface AttractionGalleryViewResp {
  gmtModified: string;
  locationInfo: {
    latitude: number;
    longitude: number;
  };
  regionId: number;
  regionName: string;
  sortNo: number;
  title: string;
}

export interface PageQuery<T> {
  page: {
    current: number;
    size: number;
  };
  queryBody: T;
}

export interface PageResult<T> {
  current: number;
  pages: number;
  records: T[];
  size: number;
  total: number;
}

export async function queryAttractionGallery(
  params: PageQuery<AttractionGalleryViewReq>,
) {
  return requestClient.post<PageResult<AttractionGalleryViewResp>>(
    '/open/attractionGallery/attractionPageQuery',
    params,
  );
}
