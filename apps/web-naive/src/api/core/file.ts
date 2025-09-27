import { requestClient } from '#/api/request';

interface UploadResult {
  fileName: string;
  fileUrl: string;
}

export async function uploadFile(
  formData: FormData,
  onProgress?: (progress: number) => void,
  key?: string,
) {
  // 如果提供了key参数，则添加到FormData中
  if (key) {
    formData.append('key', key);
  }
  
  return requestClient.post<UploadResult>('/open/files/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total,
        );
        onProgress?.(percentCompleted);
      }
    },
  });
}
