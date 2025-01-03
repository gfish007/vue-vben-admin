export interface LiveItem {
  id: number;
  liveVideoUrl: string;
  status: number;
  liveAccountName: string;
  liveLocationName: string;
  gmtStart: string;
}

export interface QueryParams {
  page: {
    current: number;
    size: number;
  };
  queryBody: Record<string, any>;
}

export interface QueryResponse {
  records: LiveItem[];
  total: number;
}
