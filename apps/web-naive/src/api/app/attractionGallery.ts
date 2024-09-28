import { requestClient } from '#/api/request';

export interface AttractionViewReq {
  regionId?: number;
  title?: string;
}

export interface AttractionViewResp {
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

export interface GalleryListReq {
  attractionId?: number;
  fileType?: 'PICTURE' | 'VIDEO';
}

export interface GalleryListResp {
  id: number;
  gmtCreate: string;
  gmtModified: string;
  attractionId: number;
  fileName: string;
  fileUrl: string;
  coverUrl?: string;
  fileType: 'PICTURE' | 'VIDEO';
  height: number;
  width: number;
  mark: string;
  sortNo: number;
  userId: number;
}

export interface AttractionGalleryAddReq {
  attractionId: number;
  fileName: string;
  fileUrl: string;
  fileType: 'PICTURE' | 'VIDEO';
  height: number;
  width: number;
  mark: string;
  sortNo: number;
}

export interface PageQuery<T> {
  page: {
    current: number;
    size: number;
  };
  queryBody: T;
}

export interface PageResult<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

export function queryAttraction(params: PageQuery<AttractionViewReq>) {
  return requestClient.post<PageResult<AttractionViewResp>>(
    '/open/attractionGallery/attraction',
    params,
  );
}

export function queryGalleryList(params: PageQuery<GalleryListReq>) {
  return requestClient.post<PageResult<GalleryListResp>>(
    '/open/attractionGallery/galleryPageQuery',
    params,
  );
}

export function removeAttractionGallery(ids: number[]) {
  return requestClient.delete('/open/attractionGallery/remove', { data: ids });
}

export function saveAttractionGallery(galleries: AttractionGalleryAddReq[]) {
  return requestClient.post('/open/attractionGallery/saveGallery', galleries);
}

// Add the new method for setting the first image
export function setFirstImage(id: number) {
  return requestClient.put(`/open/attractionGallery/setFirst/${id}`);
}
