export namespace GuesthouseRoomsApi {
  export interface QueryParams {
    page: {
      current: number;
      size: number;
    };
    queryBody: {
      booksStatus?: boolean;
      enableStatus?: boolean;
      regionId?: number;
      roomNo?: string;
      title?: string;
    };
  }

  export interface QueryResult {
    records: GuesthouseRoomRecord[];
    total: number;
  }

  export interface GuesthouseRoomRecord {
    id: number;
    gmtCreate: string;
    gmtModified: string;
    regionId: number;
    title: string;
    roomNo: string;
    roomAmenities: any[];
    roomDesc: any[];
    policies: string;
    coverList: any[];
    enableStatus: boolean;
    oriPrice: number;
    price: number;
    sortNo: number;
  }

  export interface GuesthouseRoomSaveReq {
    id?: number;
    regionId: number;
    title: string;
    roomNo: string;
    roomAmenities: any[];
    roomDesc: any[];
    policies: string;
    coverList: any[];
    enableStatus: boolean;
    oriPrice: number;
    price: number;
    sortNo: number;
  }
}
