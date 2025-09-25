export namespace MerchantApi {
  export interface MerchantRecord {
    id: string;
    gmtCreate: string;
    gmtModified: string;
    merchantCode: string;
    userId: number;
    name: string;
    shortName: string;
    type: number;
    status: number;
    auditStatus: number;
    auditOpinion: string;
    level: number;
    logoUrl: string;
    industryId: number;
    contactName: string;
    contactPhone: string;
    wchat: string;
    contactEmail: string;
    province: string;
    provinceCode: string;
    city: string;
    cityCode: string;
    district: string;
    districtCode: string;
    town: string;
    townCode: string;
    address: string;
    longitude: string;
    latitude: string;
    businessLicenseNo: string;
    businessLicenseImg: string;
    legalPerson: string;
    legalPersonIdCard: string;
    legalPersonIdCardFront: string;
    legalPersonIdCardBack: string;
    introduction: string;
    businessHours: string;
    available: number;
    gmtApprove: string;
  }

  export interface MerchantSaveReq {
    id?: string;
    merchantCode?: string;
    userId?: number;
    name: string;
    shortName: string;
    type: number;
    status?: number;
    auditStatus?: number;
    auditOpinion?: string;
    level?: number;
    logoUrl?: string;
    industryId?: number;
    contactName: string;
    contactPhone: string;
    wchat?: string;
    contactEmail?: string;
    province: string;
    provinceCode: string;
    city: string;
    cityCode: string;
    district: string;
    districtCode: string;
    town: string;
    townCode: string;
    address: string;
    longitude?: string;
    latitude?: string;
    businessLicenseNo?: string;
    businessLicenseImg?: string;
    legalPerson?: string;
    legalPersonIdCard?: string;
    legalPersonIdCardFront?: string;
    legalPersonIdCardBack?: string;
    introduction?: string;
    businessHours?: string;
    available?: number;
    gmtApprove?: string;
  }

  export interface QueryParams {
    page: {
      current: number;
      size: number;
    };
    queryBody: {
      name?: string;
      merchantCode?: string;
      status?: number;
      auditStatus?: number;
      available?: number;
      gmtApproveBegin?: string;
      gmtApproveEnd?: string;
    };
  }

  export interface QueryResult {
    records: MerchantRecord[];
    total: number;
    size: number;
    current: number;
    pages: number;
  }

  export interface AuditReq {
    id: string;
    auditStatus: number;
  }

  export interface StatusReq {
    id: string;
    status: number;
  }
}