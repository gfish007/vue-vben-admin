export namespace UserApi {
  export interface UserRecord {
    id: string;
    nickname: string;
    avatar: string;
    phone: string;
    email: string;
    enabled: number;
    appid: string;
    openid: string;
    unionid: string;
    gmtLogin: string;
    gmtCreate: string;
    gmtModified: string;
  }

  export interface QueryParams {
    page: {
      current: number;
      size: number;
    };
    queryBody: {
      appid?: string;
      enabled?: number | null;
      gmtCreateBegin?: Date | null;
      gmtCreateEnd?: Date | null;
      gmtLoginBegin?: Date | null;
      gmtLoginEnd?: Date | null;
      nickname?: string;
      phone?: string;
    };
  }

  export interface QueryResult {
    records: UserRecord[];
    total: number;
    size: number;
    current: number;
    pages: number;
  }
}