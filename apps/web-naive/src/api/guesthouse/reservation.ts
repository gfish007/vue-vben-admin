import type { PageQuery, PageResult } from '#/types/global';

import { requestClient } from '#/api/request';

export interface GuesthouseReservationQuery {
  roomId?: number;
  realName?: string;
  phone?: string;
  gmtStart?: Date;
  gmtEnd?: Date;
}

export interface GuesthouseReservationListResp {
  id: number;
  gmtCreate: string;
  gmtModified: string;
  regionId: number;
  guestsId: number;
  roomId: number;
  realName: string;
  idCard: string;
  gmtStart: string;
  gmtEnd: string;
  oriPrice: number;
  payPrice: number;
  discountPrice: number;
  phone: string;
}

export interface GuesthouseReservationSaveReq {
  id?: number;
  gmtCreate?: string;
  gmtModified?: string;
  regionId: string;
  guestsId: string;
  roomId: string;
  realName: string;
  idCard: string;
  gmtStart: Date | null;
  gmtEnd: Date | null;
  oriPrice: number;
  payPrice: number;
  discountPrice: number;
  phone: string;
  remark: string;
}

export const guesthouseReservationApi = {
  getById: (id: number) =>
    requestClient.get<GuesthouseReservationSaveReq>(
      `/open/guesthouseReservation/${id}`,
    ),

  remove: (ids: number[]) =>
    requestClient.delete<void>('/open/guesthouseReservation/remove', {
      data: ids,
    }),

  saveOrUpdate: (params: GuesthouseReservationSaveReq) =>
    requestClient.post<void>(
      '/open/guesthouseReservation/saveOrUpdate',
      params,
    ),

  list: (params: PageQuery<GuesthouseReservationQuery>) =>
    requestClient.post<PageResult<GuesthouseReservationListResp>>(
      '/open/guesthouseReservation/list',
      params,
    ),
};
