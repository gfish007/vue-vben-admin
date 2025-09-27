<script setup lang="ts">
import type { FormInst, FormRules, UploadFileInfo, CascaderOption } from 'naive-ui';

import type { RegionApi } from '#/api/core/region.types';
import type { CityData } from '#/api/core/cityData';

import { computed, h, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  NButton,
  NButtonGroup,
  NCascader,
  NCard,
  NConfigProvider,
  NDataTable,
  NDynamicInput,
  NForm,
  NFormItem,
  NInput,
  NModal,
  NPagination,
  NProgress,
  NSelect,
  NSpace,
  NTag,
  NUpload,
  useMessage,
} from 'naive-ui';

import { requestClient } from '#/api/request';
import { uploadFile } from '#/api/core/file';
import {
  deleteRegions,
  doTopRegion,
  getRegionDetail,
  publishRegion,
  queryRegionList,
  rollbackRegion,
  saveOrUpdateRegion,
} from '#/api/core/region';
import { getCityDataByPid } from '#/api/core/cityData';
import LocationMap from '#/components/LocationMap.vue';
import TEditor from '#/components/TEditor.vue';
import { useDynamicHeight } from '#/utils/heightUtils';
import { purpleTheme } from '#/utils/theme';

// Add this type declaration
declare global {
  interface Window {
    _AMapSecurityConfig: {
      securityJsCode: string;
    };
  }
}

const message = useMessage();

// 查询条件
const queryForm = reactive<RegionApi.QueryParams['queryBody']>({
  country: '',
  enable_status: null,
  level: null,
  ncity: '',
  ndistrict: '',
  nprovince: '',
  nstreet: '',
  title: '',
});

// 初始化地区相关
const showInitModal = ref(false);
const initLoading = ref(false);
// 省市区级联相关
const provinceOptions = ref<CascaderOption[]>([]);
const cityOptions = ref<CascaderOption[]>([]);
const districtOptions = ref<CascaderOption[]>([]);
const selectedProvince = ref<string | null>(null);
const selectedCity = ref<string | null>(null);
const selectedDistrict = ref<string | null>(null);

// 表格数据
const tableData = ref<RegionApi.RegionRecord[]>([]);
const loading = ref(false);
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
  itemCount: 0,
  showSizePicker: true,
  showQuickJumper: true,
  pageSizes: [10, 20, 50],
});

// 模态框相关
const showModal = ref(false);
const modalTitle = ref('');
const editingRecord = ref<RegionApi.RegionSaveReq>({
  coverUrl: '',
  description: '',
  extendContent: [{ key: '', value: '' }],
  history: '',
  location: '',
  locationId: 0,
  locationInfo: {},
  disableRegion: null, // 添加disableRegion字段
  pid: undefined,
  title: '',
  level: 0, // 添加level字段
});

// 表单规则
const rules: FormRules = {
  coverUrl: { message: '请输入封面URL', required: true, trigger: 'blur' },
  description: { message: '请输入描述', required: true, trigger: 'blur' },
  extendContent: {
    trigger: ['blur', 'change'],
    validator: (rule, value) => {
      if (!Array.isArray(value) || value.length === 0) {
        return new Error('请至少添加一项扩展内容');
      }
      const hasValidItem = value.some(
        (item) => item.key.trim() !== '' && item.value.trim() !== '',
      );
      if (!hasValidItem) {
        return new Error('至少需要一项有效的扩展内容（键和值都不为空）');
      }
      return true;
    },
  },
  location: { message: '请输入位置信息', required: true, trigger: 'blur' },
  locationId: {
    message: '请输入地理位置ID',
    required: true,
    trigger: 'change',
    type: 'number',
  },
  title: { message: '请输入名称', required: true, trigger: 'blur' },
};

const formRef = ref<FormInst | null>(null);

// 添加新的 loading 状态
const editLoading = ref(false);
const topLoading = ref(false);
const deleteLoading = ref(false);
const saveLoading = ref(false);
const publishLoading = ref(false);
const rollbackLoading = ref(false);

// 修改 handleEdit 函数
const handleEdit = async (row: RegionApi.RegionRecord) => {
  editLoading.value = true;
  try {
    modalTitle.value = '编辑区域';
    const detail = await getRegionDetail(row.id);
    editingRecord.value = {
      ...detail,
      extendContent: Array.isArray(detail.extendContent)
        ? detail.extendContent
        : [{ key: '', value: '' }],
      history: detail.history ?? '',
      id: row.id,
      locationId: detail.locationId ?? 0,
      locationInfo:
        typeof detail.locationInfo === 'string'
          ? JSON.parse(detail.locationInfo)
          : detail.locationInfo || {},
      disableRegion:
        typeof detail.disableRegion === 'string'
          ? JSON.parse(detail.disableRegion)
          : detail.disableRegion || null,
      pid: detail.pid ?? undefined,
      level: detail.level, // 后台已经返回数字级别，直接使用
    };
    showModal.value = true;
  } catch (error) {
    console.error('获取详情失败:', error);
    message.error('获取详情失败');
  } finally {
    editLoading.value = false;
  }
};

// 修改 handleDelete 函数
const handleDelete = async (row: RegionApi.RegionRecord) => {
  deleteLoading.value = true;
  try {
    await deleteRegions([row.id]);
    message.success('删除成功');
    fetchData();
  } catch {
    message.error('删除失败');
  } finally {
    deleteLoading.value = false;
  }
};

// 修改 handleTop 函数
const handleTop = async (row: RegionApi.RegionRecord) => {
  topLoading.value = true;
  try {
    await doTopRegion(row.id);
    message.success('置顶成功');
    fetchData();
  } catch {
    message.error('置顶失败');
  } finally {
    topLoading.value = false;
  }
};

// 发布区域
const handlePublish = async (row: RegionApi.RegionRecord) => {
  publishLoading.value = true;
  try {
    await publishRegion(row.id);
    message.success('发布成功');
    fetchData();
  } catch {
    message.error('发布失败');
  } finally {
    publishLoading.value = false;
  }
};

// 撤回区域
const handleRollback = async (row: RegionApi.RegionRecord) => {
  rollbackLoading.value = true;
  try {
    await rollbackRegion(row.id);
    message.success('撤回成功');
    fetchData();
  } catch {
    message.error('撤回失败');
  } finally {
    rollbackLoading.value = false;
  }
};

// 修改 handleSave 函数
const handleSave = async () => {
  if (!formRef.value) return;
  saveLoading.value = true;
  try {
    await formRef.value.validate();
    const saveData = {
      ...editingRecord.value,
      extendContent: editingRecord.value.extendContent.filter(
        (item) => item.key.trim() !== '' || item.value.trim() !== '',
      ),
      locationInfo:
        typeof editingRecord.value.locationInfo === 'string'
          ? JSON.parse(editingRecord.value.locationInfo)
          : editingRecord.value.locationInfo,
      disableRegion:
        typeof editingRecord.value.disableRegion === 'string'
          ? JSON.parse(editingRecord.value.disableRegion)
          : editingRecord.value.disableRegion,
      // 后台已经使用数字级别，不需要转换
    };
    await saveOrUpdateRegion(saveData);
    message.success(editingRecord.value.id ? '编辑成功' : '新增成功');
    showModal.value = false;
    fetchData();
  } catch (error) {
    console.error('保存失败:', error);
    message.error('保存失败，请检查表单');
  } finally {
    saveLoading.value = false;
  }
};

// 查询数据
const fetchData = async () => {
  loading.value = true;
  try {
    const result = await queryRegionList({
      page: {
        current: pagination.page,
        size: pagination.pageSize,
      },
      queryBody: queryForm,
    });
    tableData.value = result.records;
    pagination.total = result.total;
    pagination.itemCount = result.total;
    pagination.pageSize = result.size;
    // 确保页码不会超过总页数
    const totalPages = Math.ceil(result.total / pagination.pageSize);
    if (pagination.page > totalPages && totalPages > 0) {
      pagination.page = totalPages;
    }
  } catch {
    message.error('获取数据失败');
  } finally {
    loading.value = false;
  }
};

// 表格列定义
const columns = [
  {
    fixed: 'left',
    key: 'title',
    title: '地点名称',
    width: 180,
  },
  { key: 'location', title: '位置信息', width: 180 },
  {
    key: 'locationInfo',
    render: (row: RegionApi.RegionRecord) => {
      const locationInfo =
        typeof row.locationInfo === 'string'
          ? JSON.parse(row.locationInfo)
          : row.locationInfo;

      return locationInfo?.lnglat || '无经纬度信息';
    },
    title: '经纬度',
    width: 180,
  },
  {
    key: 'extendContent',
    render: (row: RegionApi.RegionRecord) => {
      const content =
        typeof row.extendContent === 'string'
          ? JSON.parse(row.extendContent)
          : row.extendContent;
      if (!Array.isArray(content) || content.length === 0) return '无扩展内容';
      return h(
        'div',
        { class: 'extend-content' },
        content.map((item) => h('div', {}, `${item.key}: ${item.value}`)),
      );
    },
    title: '扩展内容',
    width: 180,
  },
  {
    key: 'level',
    render: (row: RegionApi.RegionRecord) => {
      const levelMap = {
        0: '省',
        1: '市',
        2: '区/县',
        3: '镇',
        4: '村',
      };
      return levelMap[row.level] || '未知';
    },
    title: '级别',
    width: 100,
  },
  {
    key: 'enable_status',
    render: (row: RegionApi.RegionRecord) => {
      return h(
        NTag,
        { type: row.enable_status === 1 ? 'success' : 'error' },
        { default: () => (row.enable_status === 1 ? '可用' : '禁用') },
      );
    },
    title: '状态',
    width: 100,
  },
  {
    key: 'publishStatus',
    render: (row: RegionApi.RegionRecord) => {
      const statusMap = {
        PENDING: '待发布',
        PUBLISH: '已发布',
      };
      const typeMap = {
        PENDING: 'warning',
        PUBLISH: 'success',
      };
      return h(
        NTag,
        { type: typeMap[row.publishStatus] || 'default' },
        { default: () => statusMap[row.publishStatus] || '未知' },
      );
    },
    title: '发布状态',
    width: 100,
  },
  {
    fixed: 'right',
    key: 'actions',
    render: (row: RegionApi.RegionRecord) => {
      const buttons = [
        h(
          NButton,
          {
            loading: editLoading.value,
            onClick: () => handleEdit(row),
            type: 'success',
          },
          { default: () => '编辑' },
        ),
        h(
          NButton,
          {
            loading: topLoading.value,
            onClick: () => handleTop(row),
            type: 'info',
          },
          { default: () => '置顶' },
        ),
        h(
          NButton,
          {
            loading: deleteLoading.value,
            onClick: () => handleDelete(row),
            type: 'error',
          },
          { default: () => '删除' },
        ),
      ];

      // 根据发布状态添加发布或撤回按钮
      if (row.publishStatus === 'PENDING') {
        buttons.push(
          h(
            NButton,
            {
              loading: publishLoading.value,
              onClick: (e: Event) => {
                e.stopPropagation();
                handlePublish(row);
              },
              type: 'primary',
            },
            { default: () => '发布' },
          )
        );
      } else if (row.publishStatus === 'PUBLISH') {
        buttons.push(
          h(
            NButton,
            {
              loading: rollbackLoading.value,
              onClick: (e: Event) => {
                e.stopPropagation();
                handleRollback(row);
              },
              type: 'warning',
            },
            { default: () => '撤回' },
          )
        );
      }

      return h(
        NButtonGroup,
        { size: 'small' },
        {
          default: () => buttons,
        },
      );
    },
    title: '操作',
    width: 220,
  },
];

// 处理查询
const handleSearch = () => {
  pagination.page = 1;
  fetchData();
};

// 处理分页变化
const handlePageChange = (page: number) => {
  pagination.page = page;
  fetchData();
};

// 处理分页大小变化
const handlePageSizeChange = (pageSize: number) => {
  pagination.pageSize = pageSize;
  pagination.page = 1;
  fetchData();
};

// 处理新增
const handleAdd = () => {
  modalTitle.value = '新增区域';
  editingRecord.value = {
    coverUrl: '',
    description: '',
    extendContent: [{ key: '', value: '' }],
    history: '',
    location: '',
    locationId: 0,
    locationInfo: {},
    disableRegion: null, // 初始化disableRegion字段
    pid: undefined,
    title: '',
    level: 4, // 默认村级别
  };
  showModal.value = true;
};

// 计算属性：封面文件
const coverFileList = computed<UploadFileInfo[]>(() => {
  return editingRecord.value.coverUrl
    ? [
        {
          id: 'cover',
          name: '当前封面',
          status: 'finished',
          url: editingRecord.value.coverUrl,
        },
      ]
    : [];
});

// 添加上传进度状态
const uploadProgress = ref(0);
const isUploading = ref(false);

// 更新处理文件上传函数
const handleFileUpload = async (options: {
  file: UploadFileInfo;
  fileList: UploadFileInfo[];
}) => {
  const { file } = options;
  if (file.file) {
    try {
      isUploading.value = true;
      uploadProgress.value = 0;
      const formData = new FormData();
      formData.append('file', file.file);
      const result = await uploadFile(formData, (progress) => {
        uploadProgress.value = progress;
      }, 'REGION');
      editingRecord.value.coverUrl = result.fileUrl;
      message.success('文件上传成功');
    } catch (error) {
      console.error('文件上传败:', error);
      message.error('文件上传失败');
    } finally {
      isUploading.value = false;
    }
  }
};

// 处理文件删除
const handleFileRemove = () => {
  editingRecord.value.coverUrl = '';
};

// 文件上传前的验证
const beforeUpload = (data: { file: UploadFileInfo }) => {
  const { file } = data;
  const isImage = file.type?.startsWith('image/');
  const isVideo = file.type?.startsWith('video/');
  if (!isImage && !isVideo) {
    message.error('只能上传图片或视频文件');
    return false;
  }
  return true;
};

// 添加扩展内容的选项
const extendContentOptions = [
  { label: '景点', value: '景点' },
  { label: '美食', value: '美食' },
  { label: '活动', value: '活动' },
  { label: '挑战', value: '挑战' },
  { label: '山', value: '山' },
  { label: '海', value: '海' },
  { label: '优惠', value: '优惠' },
  { label: '打卡', value: '打卡' },
];

// 修改 handleAddExtendContent 函数
const handleAddExtendContent = () => {
  return { key: extendContentOptions[0].value, value: '' };
};

// 获取省份数据
const fetchProvinces = async () => {
  try {
    const provinces = await getCityDataByPid('0');
    provinceOptions.value = provinces.map(province => ({
      label: province.extName,
      value: province.id,
    }));
  } catch (error) {
    console.error('获取省份数据失败:', error);
    message.error('获取省份数据失败');
  }
};

// 获取城市数据
const fetchCities = async (provinceId: string) => {
  try {
    const cities = await getCityDataByPid(provinceId);
    cityOptions.value = cities.map(city => ({
      label: city.extName,
      value: city.id,
    }));
  } catch (error) {
    console.error('获取城市数据失败:', error);
    message.error('获取城市数据失败');
  }
};

// 获取区域数据
const fetchDistricts = async (cityId: string) => {
  try {
    const districts = await getCityDataByPid(cityId);
    districtOptions.value = districts.map(district => ({
      label: district.extName,
      value: district.id,
    }));
  } catch (error) {
    console.error('获取区域数据失败:', error);
    message.error('获取区域数据失败');
  }
};

// 处理省份选择变化
const handleProvinceChange = (value: string | number | null, option: CascaderOption | null) => {
  if (value && option) {
    // 清空城市和区域选择
    selectedCity.value = null;
    selectedDistrict.value = null;
    cityOptions.value = [];
    districtOptions.value = [];
    // 获取城市数据
    fetchCities(value.toString());
  } else {
    // 清空所有下级选择和数据
    selectedCity.value = null;
    selectedDistrict.value = null;
    cityOptions.value = [];
    districtOptions.value = [];
  }
};

// 处理城市选择变化
const handleCityChange = (value: string | number | null, option: CascaderOption | null) => {
  if (value && option) {
    // 清空区域选择
    selectedDistrict.value = null;
    districtOptions.value = [];
    // 获取区域数据
    fetchDistricts(value.toString());
  } else {
    // 清空下级选择和数据
    selectedDistrict.value = null;
    districtOptions.value = [];
  }
};

// 初始化地区
const handleInitRegion = async () => {
  if (!selectedDistrict.value && !selectedCity.value && !selectedProvince.value) {
    message.warning('请选择地区');
    return;
  }

  initLoading.value = true;
  try {
    // 获取最后一级选择的地区ID
    let cityId = '';
    if (selectedDistrict.value) {
      cityId = selectedDistrict.value;
    } else if (selectedCity.value) {
      cityId = selectedCity.value;
    } else if (selectedProvince.value) {
      cityId = selectedProvince.value;
    }

    // 调用初始化接口
    await requestClient.get(`/open/region/defaultInit/${cityId}`);
    message.success('初始化成功');
    showInitModal.value = false;
    // 重置选择
    selectedProvince.value = null;
    selectedCity.value = null;
    selectedDistrict.value = null;
    cityOptions.value = [];
    districtOptions.value = [];
    fetchData(); // 重新加载数据
  } catch (error) {
    console.error('初始化失败:', error);
    message.error('初始化失败');
  } finally {
    initLoading.value = false;
  }
};

// 初始加载数据
fetchData();

// 添加一个计算属性来动态计算表格高度
const queryCardRef = ref<HTMLElement | null>(null);
const { queryCardHeight, tableHeight } = useDynamicHeight(queryCardRef);

onMounted(() => {
  if (queryCardRef.value) {
    queryCardHeight.value = queryCardRef.value.offsetHeight;
  }
  // 获取省份数据
  fetchProvinces();
});
</script>

<template>
  <Page description="管理系统中的区域信息" title="区域管理">
    <div ref="queryCardRef" class="w-full">
      <NCard class="query-card">
        <NForm :model="queryForm" inline>
          <div style="display: flex; flex-wrap: wrap; gap: 16px 24px; width: 100%; align-items: center;">
            <NFormItem label="可用状态" label-placement="left" style="margin-bottom: 0;">
              <NSelect
                v-model:value="queryForm.enable_status"
                :options="[
                  { label: '可用', value: 1 },
                  { label: '不可用', value: 0 },
                ]"
                clearable
                style="width: 120px"
              />
            </NFormItem>
            <NFormItem label="名称" label-placement="left" style="margin-bottom: 0;">
              <NInput v-model:value="queryForm.title" style="width: 200px" />
            </NFormItem>
            <NFormItem label="级别" label-placement="left" style="margin-bottom: 0;">
              <NSelect
                v-model:value="queryForm.level"
                :options="[
                  { label: '省', value: 0 },
                  { label: '市', value: 1 },
                  { label: '区/县', value: 2 },
                  { label: '镇', value: 3 },
                  { label: '村', value: 4 },
                ]"
                clearable
                style="width: 120px"
              />
            </NFormItem>
            <div style="display: flex; gap: 16px; margin-left: auto;">
              <NConfigProvider :theme="purpleTheme">
                <NButton type="primary" @click="handleSearch">搜索</NButton>
              </NConfigProvider>
              <NButton type="success" @click="handleAdd">新增区域</NButton>
              <NButton type="info" @click="showInitModal = true">初始化地区</NButton>
            </div>
          </div>
        </NForm>
      </NCard>
    </div>

    <NCard>
      <NDataTable
        :columns="columns"
        :data="tableData"
        :loading="loading"
        :max-height="`${tableHeight}px`"
        :min-height="`${tableHeight}px`"
        :scroll-x="1100"
        :single-line="false"
        flex-height
        striped
      />
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 16px;">
        <div>共 {{ pagination.itemCount }} 条记录</div>
        <NPagination
          v-model:page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :item-count="pagination.itemCount"
          :page-sizes="pagination.pageSizes"
          show-size-picker
          show-quick-jumper
          @update:page="handlePageChange"
          @update:page-size="handlePageSizeChange"
        />
      </div>
    </NCard>

    <NModal
      v-model:show="showInitModal"
      preset="card"
      title="初始化地区"
      style="width: 500px"
    >
      <NForm label-placement="left" label-width="80px">
        <NFormItem label="选择地区">
          <div style="display: flex; gap: 10px; width: 100%;">
            <NSelect
              v-model:value="selectedProvince"
              :options="provinceOptions"
              clearable
              filterable
              placeholder="请选择省份"
              style="flex: 1;"
              @update:value="handleProvinceChange"
            />
            <NSelect
              v-model:value="selectedCity"
              :options="cityOptions"
              :disabled="!selectedProvince"
              clearable
              filterable
              placeholder="请选择城市"
              style="flex: 1;"
              @update:value="handleCityChange"
            />
            <NSelect
              v-model:value="selectedDistrict"
              :options="districtOptions"
              :disabled="!selectedCity"
              clearable
              filterable
              placeholder="请选择区域"
              style="flex: 1;"
            />
          </div>
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showInitModal = false">取消</NButton>
          <NButton :loading="initLoading" type="primary" @click="handleInitRegion">
            确认初始化
          </NButton>
        </NSpace>
      </template>
    </NModal>

    <NModal
      v-model:show="showModal"
      :title="modalTitle"
      preset="card"
      style="width: 80vw; max-width: 1000px"
    >
      <NForm
        ref="formRef"
        :model="editingRecord"
        :rules="rules"
        label-placement="left"
        label-width="100px"
        require-mark-placement="right-hanging"
      >
        <NFormItem label="名称" path="title">
          <NInput v-model:value="editingRecord.title" />
        </NFormItem>
        <NFormItem label="级别" path="level">
          <NSelect
            v-model:value="editingRecord.level"
            :options="[
              { label: '省', value: 0 },
              { label: '市', value: 1 },
              { label: '区/县', value: 2 },
              { label: '镇', value: 3 },
              { label: '村', value: 4 },
            ]"
            disabled
          />
        </NFormItem>
        <NFormItem label="封面" path="coverUrl">
          <div class="upload-container">
            <NUpload
              :before-upload="beforeUpload"
              :file-list="coverFileList"
              :max="1"
              list-type="image-card"
              @change="handleFileUpload"
              @remove="handleFileRemove"
            >
              上传图片或视频
              <NProgress
                v-if="isUploading"
                :height="6"
                :percentage="uploadProgress"
                :show-indicator="false"
                class="upload-progress"
                processing
              />
            </NUpload>
          </div>
        </NFormItem>
        <NFormItem label="描述" path="description">
          <NInput
            v-model:value="editingRecord.description"
            :autosize="{ minRows: 4, maxRows: 8 }"
            type="textarea"
          />
        </NFormItem>
        <NFormItem label="AI百科" path="history">
          <TEditor v-model="editingRecord.history" />
        </NFormItem>
        <NFormItem label="扩展内容" path="extendContent">
          <NDynamicInput
            v-model:value="editingRecord.extendContent"
            :on-create="handleAddExtendContent"
          >
            <template #create-button-default> 添加扩展内容 </template>
            <template #default="{ value }">
              <NSelect
                v-model:value="value.key"
                :options="extendContentOptions"
                style="width: 40%; margin-right: 4%"
              />
              <NInput
                v-model:value="value.value"
                placeholder="值"
                style="width: 56%"
              />
            </template>
          </NDynamicInput>
        </NFormItem>
        <NFormItem label="位置信息" path="location" style="width: 100%">
          <LocationMap
            v-model:location="editingRecord.location"
            v-model:location-info="editingRecord.locationInfo"
            v-model:disable-region="editingRecord.disableRegion"
            :show-satellite-toggle="true"
            :show-bounds-info="true"
          />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showModal = false">取消</NButton>
          <NConfigProvider :theme="purpleTheme">
            <NButton :loading="saveLoading" type="primary" @click="handleSave">
              保存
            </NButton>
          </NConfigProvider>
        </NSpace>
      </template>
    </NModal>
  </Page>
</template>

<style scoped>
.n-form-item {
  margin-bottom: 24px;
}

.mb-4 {
  margin-bottom: 16px;
}

.n-input-number {
  width: 100%;
}

.n-modal {
  max-height: 90vh;
  overflow-y: auto;
}

/* 添加横线效果 */
.n-data-table .n-button {
  text-decoration: underline;
}

.n-form {
  width: 100%;
}

.n-space {
  width: 100%;
}

.n-upload {
  width: 100%;
}

.n-upload-trigger {
  width: 100%;
}

.n-upload-file-list {
  justify-content: center;
}

/* 添加新的样式来限制扩展内容的高度并添加滚动条 */
.n-data-table .extend-content {
  max-height: 100px;
  overflow-y: auto;
}

.query-card {
  padding: 8px 16px; /* 添加一些上下内边距 */
  margin-bottom: 16px;
}

.query-card :deep(.n-form) {
  display: flex;
  align-items: center;
  height: 100%;
}

.query-card :deep(.n-form-item) {
  display: flex;
  align-items: center;
  margin-bottom: 0;
}

.query-card :deep(.n-form-item-label) {
  height: auto;
  padding: 0 8px 0 0;
  line-height: normal;
}

.query-card :deep(.n-form-item-blank) {
  display: flex;
  align-items: center;
}

.query-card :deep(.n-button-group) {
  display: flex;
}

.query-card :deep(.n-button-group .n-button) {
  margin-right: 0;
}

.n-data-table {
  flex: 1;
  overflow: auto; /* 添加这行来使表格内容可滚动 */
}

.upload-container {
  position: relative;
  width: 100%;
}

.upload-container :deep(.n-upload-trigger) {
  position: relative;
  overflow: hidden;
}

.upload-progress {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 1;
}
</style>
