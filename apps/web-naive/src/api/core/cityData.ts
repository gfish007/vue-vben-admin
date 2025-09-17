import { requestClient } from '#/api/request';

export interface CityData {
  id: number;
  pid: number;
  deep: number;
  name: string;
  pinyinPrefix: string;
  pinyin: string;
  extId: number;
  extName: string;
}

/**
 * 根据父级id获取子级地址列表
 * @param pid 父级id，第一级是省，pid为0
 * @returns 子级地址列表
 */
export async function getCityDataByPid(pid: string): Promise<CityData[]> {
  return requestClient.get<CityData[]>(`/open/cityData/listByPid/${pid}`);
}