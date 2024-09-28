import type { GuesthouseRoomsApi } from './rooms.types';

import { requestClient } from '#/api/request';

/**
 * 查询客房列表
 */
export async function queryGuesthouseRoomsList(
  params: GuesthouseRoomsApi.QueryParams,
) {
  return requestClient.post<GuesthouseRoomsApi.QueryResult>(
    '/open/guesthouseRooms/list',
    params,
  );
}

/**
 * 保存或更新客房
 */
export async function saveOrUpdateGuesthouseRoom(
  params: GuesthouseRoomsApi.GuesthouseRoomSaveReq,
) {
  return requestClient.post<GuesthouseRoomsApi.GuesthouseRoomRecord>(
    '/open/guesthouseRooms/saveOrUpdate',
    params,
  );
}

/**
 * 获取客房详情
 */
export async function getGuesthouseRoomDetail(id: number) {
  return requestClient.get<GuesthouseRoomsApi.GuesthouseRoomRecord>(
    `/open/guesthouseRooms/${id}`,
  );
}

/**
 * 删除客房
 */
export async function deleteGuesthouseRooms(ids: number[]) {
  return requestClient.delete<void>('/open/guesthouseRooms/remove', {
    data: ids,
  });
}

/**
 * 发布客房
 */
export function publishGuesthouseRoom(id: number) {
  return requestClient.put<void>(`/open/guesthouseRooms/publish/${id}`);
}

/**
 * 撤回客房
 */
export function rollbackGuesthouseRoom(id: number) {
  return requestClient.put<void>(`/open/guesthouseRooms/rollback/${id}`);
}
