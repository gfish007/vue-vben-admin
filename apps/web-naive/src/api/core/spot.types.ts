export namespace SpotApi {
  export interface SpotRecord {
    id: number;
    gmtCreate: string;
    gmtModified: string;
    deleteFlag: number;
    adcode: number;
    pcode: number;
    townCode: number;
    townName: string;
    sortNo: number;
    score: string;
    spotType: 'FOOD' | 'ACTIVITY' | 'HOTEL' | 'ATTRACTION';
    poiId: string;
    title: string;
    address: string;
    tel: string;
    category: string;
    type: string;
    location: {
      lat: number;
      lng: number;
    };
    locationInfo?: Record<string, any>; // 添加locationInfo字段
    businessInfo: {
      tel?: string;
      rating?: string;
      cost?: string;
      opentimeWeek?: string;
      opentimeToday?: string;
    };
    imageUrls: string[];
  }

  export interface SpotSaveReq {
    id?: number;
    adcode: number;
    pcode: number;
    townCode: number;
    townName: string;
    sortNo: number;
    score: string;
    spotType: 'FOOD' | 'ACTIVITY' | 'HOTEL' | 'ATTRACTION';
    poiId: string;
    title: string;
    address: string;
    tel: string;
    category: string;
    type: string;
    location: {
      lat: number;
      lng: number;
    };
    locationInfo?: Record<string, any>; // 添加locationInfo字段
    businessInfo: {
      tel?: string;
      rating?: string;
      cost?: string;
      opentimeWeek?: string;
      opentimeToday?: string;
    };
    imageUrls: string[];
  }

  export interface QueryParams {
    page: {
      current: number;
      size: number;
    };
    queryBody: {
      adcode?: number;
      spotType?: 'FOOD' | 'ACTIVITY' | 'HOTEL' | 'ATTRACTION';
      title?: string;
      townCode?: number;
      handleFlag?: 'Y' | 'N';
      address?: string;
    };
    regionId?: string; // 添加regionId参数
  }

  export interface QueryResult {
    records: SpotRecord[];
    total: number;
    current: number;
    size: number;
    pages: number;
  }
}