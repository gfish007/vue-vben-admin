import { requestClient } from '#/api/request';

interface UploadResult {
  fileName: string;
  fileUrl: string;
}

export async function uploadFile(
  formData: FormData,
  onProgress?: (progress: number) => void,
) {
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
