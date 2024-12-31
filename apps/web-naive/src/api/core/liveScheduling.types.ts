export namespace LiveSchedulingApi {
  export interface LiveSchedulingMember {
    id?: number;
    gmtCreate?: string;
    gmtModified?: string;
    schedulingId?: number;
    memberId: number;
    gmtStart: string;
    gmtEnd: string;
    role: string;
  }

  export interface LiveSchedulingRecord {
    id: null | number;
    gmtCreate?: string;
    gmtModified?: string;
    liveAccountId: number;
    liveLocationId: number;
    gmtPlay: string;
    gmtStart: string;
    gmtEnd: string;
    nobodyFlag: 'N' | 'Y';
    schedulingMembers: LiveSchedulingMember[];
    // 响应字段
    liveMemberInfo?: any;
    liveLocationInfo?: any;
    schedulingMemberName?: string[];
  }

  export interface QueryParams {
    page: {
      current: number;
      size: number;
    };
    queryBody: {
      gmtEnd?: string;
      gmtStart?: string;
      liveAccountId?: number;
      memberId?: number;
      nobodyFlag?: string;
    };
  }

  export interface QueryResult {
    records: LiveSchedulingRecord[];
    total: number;
    size: number;
    current: number;
  }
}
