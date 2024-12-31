export namespace LiveMemberApi {
  export interface LiveMemberRecord {
    id: null | number;
    gmtCreate?: string;
    gmtModified?: string;
    memberId: number;
    department: string;
    job: string;
    name: string;
    phone: string;
    role: 'CK' | 'ZB';
  }

  export interface QueryParams {
    page: {
      current: number;
      size: number;
    };
    queryBody: {
      department?: string;
      name?: string;
      role?: string;
    };
  }

  export interface QueryResult {
    records: LiveMemberRecord[];
    total: number;
    size: number;
    current: number;
  }
}
