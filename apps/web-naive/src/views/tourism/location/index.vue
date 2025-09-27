<script setup lang="ts">
import type { FormInst, FormRules, UploadFileInfo } from 'naive-ui';

import type { CascaderOption } from 'naive-ui';

import { h, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  NButton,
  NButtonGroup,
  NCard,
  NCol,
  NDataTable,
  NDatePicker,
  NForm,
  NFormItem,
  NInput,
  NModal,
  NPagination,
  NRow,
  NSelect,
  NSpace,
  NUpload,
  useDialog,
  useMessage,
} from 'naive-ui';

import { useDynamicHeight } from '#/utils/heightUtils';

const message = useMessage();
const dialog = useDialog();

// 查询条件
const queryForm = reactive({
  title: undefined,
  startTimeBegin: undefined,
  startTimeEnd: undefined,
  status: undefined,
});

// 表格数据
const tableData = ref([]);
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

// 图片上传相关
const imageFileList = ref<UploadFileInfo[]>([]);
const uploadProgress = ref(0);
const isUploading = ref(false);

// 省市区级联相关
const provinceOptions = ref<CascaderOption[]>([]);
const cityOptions = ref<CascaderOption[]>([]);
const districtOptions = ref<CascaderOption[]>([]);
const townOptions = ref<CascaderOption[]>([]);
const selectedProvince = ref<string | null>(null);
const selectedCity = ref<string | null>(null);
const selectedDistrict = ref<string | null>(null);
const selectedTown = ref<string | null>(null);

const editingRecord = ref({
  id: undefined,
  province: '',
  provinceCode: '',
  city: '',
  cityCode: '',
  district: '',
  districtCode: '',
  town: '',
  townCode: '',
  state: 'INIT',
  imageUrl: '',
  sortOrder: 999,
});

// 表单规则
const rules: FormRules = {
  provinceCode: { message: '请选择省份', required: true, trigger: 'change' },
  cityCode: { message: '请选择城市', required: true, trigger: 'change' },
  districtCode: { message: '请选择区域', required: true, trigger: 'change' },
  townCode: { message: '请选择乡镇', required: true, trigger: 'change' },
  state: { message: '请选择状态', required: true, trigger: 'change' },
  sortOrder: { message: '请输入排序', required: true, type: 'number', trigger: 'blur' },
};

const formRef = ref<FormInst | null>(null);

// 添加新的 loading 状态
const editLoading = ref(false);
const deleteLoading = ref(false);
const saveLoading = ref(false);

// 格式化日期时间
const formatDate = (date: string | number | Date | null): string => {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// 查询数据
const fetchData = async () => {
  loading.value = true;
  try {
    // 这里需要替换为实际的API调用
    // const result = await queryLocationList({
    //   page: {
    //     current: pagination.page,
    //     size: pagination.pageSize,
    //   },
    //   queryBody: queryForm,
    // });
    
    // 模拟数据
    const result = {
      records: [
        {
          id: '1',
          province: '广东省',
          provinceCode: '440000',
          city: '深圳市',
          cityCode: '440300',
          district: '南山区',
          districtCode: '440305',
          town: '粤海街道',
          townCode: '440305001',
          state: 'FINISHED',
          imageUrl: '',
          sortOrder: 1,
          gmtCreate: '2023-01-01 12:00:00',
          gmtModified: '2023-01-01 12:00:00',
        }
      ],
      total: 1,
      size: 10,
    };
    
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
    key: 'province',
    title: '省',
    width: 120,
  },
  {
    key: 'city',
    title: '市',
    width: 120,
  },
  {
    key: 'district',
    title: '区',
    width: 120,
  },
  {
    key: 'town',
    title: '镇',
    width: 120,
  },
  {
    key: 'state',
    render: (row: any) => {
      const stateMap = {
        INIT: '未开放',
        PROCESSING: '收集中',
        FINISHED: '已完成',
      };
      return stateMap[row.state as keyof typeof stateMap] || '未知';
    },
    title: '状态',
    width: 120,
  },
  {
    key: 'sortOrder',
    title: '排序',
    width: 80,
  },
  {
    key: 'gmtCreate',
    title: '创建时间',
    width: 180,
  },
  {
    fixed: 'right',
    key: 'actions',
    render: (row: any) => {
      return h(
        NButtonGroup,
        { size: 'small' },
        {
          default: () => [
            h(
              NButton,
              {
                loading: editLoading.value,
                onClick: () => handleEdit(row),
                type: 'primary',
              },
              { default: () => '编辑' },
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
            h(
              NButton,
              {
                onClick: () => handleToggleStatus(row),
                type: row.state === 'FINISHED' ? 'warning' : 'success',
              },
              { default: () => (row.state === 'FINISHED' ? '下架' : '启用') },
            ),
          ],
        },
      );
    },
    title: '操作',
    width: 200,
  },
];

// 处理查询
const handleSearch = () => {
  pagination.page = 1;
  fetchData();
};

// 处理重置
const handleReset = () => {
  queryForm.title = undefined;
  queryForm.startTimeBegin = undefined;
  queryForm.startTimeEnd = undefined;
  queryForm.status = undefined;
  handleSearch();
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
  modalTitle.value = '新增地点';
  editingRecord.value = {
    id: undefined,
    province: '',
    provinceCode: '',
    city: '',
    cityCode: '',
    district: '',
    districtCode: '',
    town: '',
    townCode: '',
    state: 'INIT',
    imageUrl: '',
    sortOrder: 999,
  };

  // 重置省市区选择
  selectedProvince.value = null;
  selectedCity.value = null;
  selectedDistrict.value = null;
  selectedTown.value = null;
  cityOptions.value = [];
  districtOptions.value = [];
  townOptions.value = [];

  // 重置图片文件列表
  imageFileList.value = [];

  showModal.value = true;
};

// 修改 handleEdit 函数
const handleEdit = async (row: any) => {
  editLoading.value = true;
  try {
    modalTitle.value = '编辑地点';

    // 这里需要替换为实际的API调用
    // const detail = await getLocationDetail(row.id);
    
    // 模拟数据
    const detail = {
      id: row.id,
      province: row.province,
      provinceCode: row.provinceCode,
      city: row.city,
      cityCode: row.cityCode,
      district: row.district,
      districtCode: row.districtCode,
      town: row.town,
      townCode: row.townCode,
      state: row.state,
      imageUrl: row.imageUrl,
      sortOrder: row.sortOrder,
    };

    editingRecord.value = { ...detail };

    // 设置省市区选择
    selectedProvince.value = null;
    selectedCity.value = null;
    selectedDistrict.value = null;
    selectedTown.value = null;
    cityOptions.value = [];
    districtOptions.value = [];
    townOptions.value = [];

    // 如果有省份信息，尝试查找对应的adcode
    if (detail.province) {
      // 确保省份数据已加载
      if (provinceOptions.value.length === 0) {
        await fetchProvinces();
      }

      const provinceOption = provinceOptions.value.find(option => option.label === detail.province);
      if (provinceOption) {
        selectedProvince.value = provinceOption.value as string;
        // 获取城市数据
        await fetchCities(provinceOption.value as string);

        // 如果有城市信息，尝试查找对应的adcode
        if (detail.city) {
          const cityOption = cityOptions.value.find(option => option.label === detail.city);
          if (cityOption) {
            selectedCity.value = cityOption.value as string;
            // 获取区域数据
            await fetchDistricts(cityOption.value as string);

            // 如果有区域信息，尝试查找对应的adcode
            if (detail.district) {
              const districtOption = districtOptions.value.find(option => option.label === detail.district);
              if (districtOption) {
                selectedDistrict.value = districtOption.value as string;
                // 获取乡镇数据
                await fetchTowns(districtOption.value as string);

                // 如果有乡镇信息，尝试查找对应的adcode
                if (detail.town) {
                  const townOption = townOptions.value.find(option => option.label === detail.town);
                  if (townOption) {
                    selectedTown.value = townOption.value as string;
                  }
                }
              }
            }
          }
        }
      }
    }

    // 设置图片文件列表
    if (detail.imageUrl) {
      imageFileList.value = [{
        id: 'location',
        name: 'location.jpg',
        status: 'finished',
        url: detail.imageUrl,
      }];
    } else {
      imageFileList.value = [];
    }

    showModal.value = true;
  } catch (error) {
    console.error('获取详情失败:', error);
    message.error('获取详情失败');
  } finally {
    editLoading.value = false;
  }
};

// 修改 handleDelete 函数
const handleDelete = async (row: any) => {
  // 添加二次确认
  dialog.warning({
    title: '确认删除',
    content: `确定要删除地点 "${row.province}${row.city}${row.district}${row.town}" 吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      deleteLoading.value = true;
      try {
        // 这里需要替换为实际的API调用
        // await deleteLocations([row.id]);
        message.success('删除成功');
        fetchData();
      } catch {
        message.error('删除失败');
      } finally {
        deleteLoading.value = false;
      }
    },
  });
};

// 处理启用/禁用
const handleToggleStatus = async (row: any) => {
  // 添加二次确认
  const action = row.state === 'FINISHED' ? '下架' : '启用';
  dialog.warning({
    title: `确认${action}`,
    content: `确定要${action}地点 "${row.province}${row.city}${row.district}${row.town}" 吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const newState = row.state === 'FINISHED' ? 'INIT' : 'FINISHED'; // 切换状态
        // 这里需要替换为实际的API调用
        // await updateLocationStatus({
        //   id: row.id,
        //   state: newState,
        // });
        message.success(`${newState === 'FINISHED' ? '启用' : '下架'}成功`);
        fetchData();
      } catch {
        message.error('操作失败');
      }
    },
  });
};

// 文件上传前的验证
const beforeUpload = (data: { file: UploadFileInfo }) => {
  const { file } = data;
  const isImage = file.type?.startsWith('image/');
  if (!isImage) {
    message.error('只能上传图片文件');
    return false;
  }
  return true;
};

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
      // 这里需要替换为实际的API调用
      // const result = await uploadFile(formData, (progress) => {
      //   uploadProgress.value = progress;
      // });

      // 模拟上传结果
      const result = { fileUrl: 'https://example.com/image.jpg' };

      // 更新图片URL
      editingRecord.value.imageUrl = result.fileUrl;

      // 更新文件列表
      imageFileList.value.splice(0, imageFileList.value.length);
      imageFileList.value.push({
        id: Date.now().toString(),
        name: file.name,
        status: 'finished',
        url: result.fileUrl,
      });

      message.success('文件上传成功');
    } catch (error) {
      console.error('文件上传失败:', error);
      message.error('文件上传失败');
    } finally {
      isUploading.value = false;
    }
  }
};

// 处理文件删除
const handleFileRemove = () => {
  // 清除图片URL
  editingRecord.value.imageUrl = '';
  // 清空文件列表
  imageFileList.value.splice(0, imageFileList.value.length);
  return true;
};

// 修改 handleSave 函数
const handleSave = async () => {
  if (!formRef.value) return;
  saveLoading.value = true;
  try {
    await formRef.value.validate();

    // 这里需要替换为实际的API调用
    // await saveOrUpdateLocation(editingRecord.value);
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

// 获取省份数据
const fetchProvinces = async () => {
  try {
    // 这里需要替换为实际的API调用
    // const provinces = await getCityDataByPid('0');
    
    // 模拟数据
    const provinces = [
      { id: '440000', extName: '广东省' },
      { id: '310000', extName: '上海市' },
    ];
    
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
    // 这里需要替换为实际的API调用
    // const cities = await getCityDataByPid(provinceId);
    
    // 模拟数据
    const cities = provinceId === '440000' ? [
      { id: '440300', extName: '深圳市' },
      { id: '440100', extName: '广州市' },
    ] : [
      { id: '310100', extName: '上海市' },
    ];
    
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
    // 这里需要替换为实际的API调用
    // const districts = await getCityDataByPid(cityId);
    
    // 模拟数据
    const districts = cityId === '440300' ? [
      { id: '440305', extName: '南山区' },
      { id: '440306', extName: '宝安区' },
    ] : [
      { id: '310101', extName: '黄浦区' },
    ];
    
    districtOptions.value = districts.map(district => ({
      label: district.extName,
      value: district.id,
    }));
  } catch (error) {
    console.error('获取区域数据失败:', error);
    message.error('获取区域数据失败');
  }
};

// 获取乡镇数据
const fetchTowns = async (districtId: string) => {
  try {
    // 这里需要替换为实际的API调用
    // const towns = await getCityDataByPid(districtId);
    
    // 模拟数据
    const towns = districtId === '440305' ? [
      { id: '440305001', extName: '粤海街道' },
      { id: '440305002', extName: '桃源街道' },
    ] : [
      { id: '310101001', extName: '南京东路街道' },
    ];
    
    townOptions.value = towns.map(town => ({
      label: town.extName,
      value: town.id,
    }));
  } catch (error) {
    console.error('获取乡镇数据失败:', error);
    message.error('获取乡镇数据失败');
  }
};

// 处理省份选择变化
const handleProvinceChange = (value: string | number | null, option: CascaderOption | null) => {
  if (value && option) {
    // 清空城市、区域和乡镇选择
    selectedCity.value = null;
    selectedDistrict.value = null;
    selectedTown.value = null;
    cityOptions.value = [];
    districtOptions.value = [];
    townOptions.value = [];
    // 清空对应的编码字段
    editingRecord.value.cityCode = '';
    editingRecord.value.districtCode = '';
    editingRecord.value.townCode = '';
    // 获取城市数据
    fetchCities(value.toString());

    // 更新表单数据
    editingRecord.value.province = option.label as string;
  } else {
    // 清空所有下级选择和数据
    selectedCity.value = null;
    selectedDistrict.value = null;
    selectedTown.value = null;
    cityOptions.value = [];
    districtOptions.value = [];
    townOptions.value = [];

    editingRecord.value.province = '';
    editingRecord.value.provinceCode = '';
    editingRecord.value.city = '';
    editingRecord.value.cityCode = '';
    editingRecord.value.district = '';
    editingRecord.value.districtCode = '';
    editingRecord.value.town = '';
    editingRecord.value.townCode = '';
  }
};

// 处理城市选择变化
const handleCityChange = (value: string | number | null, option: CascaderOption | null) => {
  if (value && option) {
    // 清空区域和乡镇选择
    selectedDistrict.value = null;
    selectedTown.value = null;
    districtOptions.value = [];
    townOptions.value = [];

    // 清空对应的编码字段
    editingRecord.value.districtCode = '';
    editingRecord.value.townCode = '';

    // 获取区域数据
    fetchDistricts(value.toString());

    // 更新表单数据
    editingRecord.value.city = option.label as string;
  } else {
    // 清空下级选择和数据
    selectedDistrict.value = null;
    selectedTown.value = null;
    districtOptions.value = [];
    townOptions.value = [];

    editingRecord.value.city = '';
    editingRecord.value.cityCode = '';
    editingRecord.value.district = '';
    editingRecord.value.districtCode = '';
    editingRecord.value.town = '';
    editingRecord.value.townCode = '';
  }
};

// 处理区域选择变化
const handleDistrictChange = (value: string | number | null, option: CascaderOption | null) => {
  if (value && option) {
    // 清空乡镇选择
    selectedTown.value = null;
    townOptions.value = [];

    // 清空对应的编码字段
    editingRecord.value.townCode = '';

    // 获取乡镇数据
    fetchTowns(value.toString());

    // 更新表单数据
    editingRecord.value.district = option.label as string;
  } else {
    // 清空下级选择和数据
    selectedTown.value = null;
    townOptions.value = [];

    editingRecord.value.district = '';
    editingRecord.value.districtCode = '';
    editingRecord.value.town = '';
    editingRecord.value.townCode = '';
  }
};

// 处理乡镇选择变化
const handleTownChange = (value: string | number | null, option: CascaderOption | null) => {
  if (value && option) {
    // 更新表单数据
    editingRecord.value.town = option.label as string;
  } else {
    editingRecord.value.town = '';
    editingRecord.value.townCode = '';
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
  <Page description="管理系统中的地点信息" title="地点管理">
    <div ref="queryCardRef" class="w-full">
      <NCard class="query-card">
        <NForm :model="queryForm" inline>
          <div style="display: flex; flex-wrap: wrap; gap: 16px 24px; width: 100%; align-items: center;">
            <NFormItem label="标题" label-placement="left" style="margin-bottom: 0;">
              <NInput v-model:value="queryForm.title" style="width: 150px" />
            </NFormItem>
            <NFormItem label="有效时间" label-placement="left" style="margin-bottom: 0;">
              <NDatePicker
                v-model:value="queryForm.startTimeBegin"
                placeholder="开始时间"
                style="width: 150px"
                type="datetime"
                value-format="yyyy-MM-dd HH:mm:ss"
              />
              <span style="margin: 0 8px">-</span>
              <NDatePicker
                v-model:value="queryForm.startTimeEnd"
                placeholder="结束时间"
                style="width: 150px"
                type="datetime"
                value-format="yyyy-MM-dd HH:mm:ss"
              />
            </NFormItem>
            <NFormItem label="状态" label-placement="left" style="margin-bottom: 0;">
              <NSelect
                v-model:value="queryForm.status"
                :options="[
                  { label: '未开放', value: 'INIT' },
                  { label: '收集中', value: 'PROCESSING' },
                  { label: '已完成', value: 'FINISHED' },
                ]"
                clearable
                style="width: 120px"
              />
            </NFormItem>
            <div style="display: flex; gap: 16px; margin-left: auto;">
              <NButton type="primary" @click="handleSearch">搜索</NButton>
              <NButton @click="handleReset">重置</NButton>
              <NButton type="success" @click="handleAdd">新增地点</NButton>
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
        :scroll-x="1200"
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
        <NRow :gutter="24">
          <NCol :span="12">
            <NFormItem label="省" path="provinceCode">
              <NSelect
                v-model:value="editingRecord.provinceCode"
                :options="provinceOptions"
                clearable
                filterable
                placeholder="请选择省份"
                @update:value="handleProvinceChange"
              />
            </NFormItem>
          </NCol>
          <NCol :span="12">
            <NFormItem label="市" path="cityCode">
              <NSelect
                v-model:value="editingRecord.cityCode"
                :options="cityOptions"
                :disabled="!editingRecord.provinceCode"
                clearable
                filterable
                placeholder="请选择城市"
                @update:value="handleCityChange"
              />
            </NFormItem>
          </NCol>
        </NRow>

        <NRow :gutter="24">
          <NCol :span="12">
            <NFormItem label="区" path="districtCode">
              <NSelect
                v-model:value="editingRecord.districtCode"
                :options="districtOptions"
                :disabled="!editingRecord.cityCode"
                clearable
                filterable
                placeholder="请选择区域"
                @update:value="handleDistrictChange"
              />
            </NFormItem>
          </NCol>
          <NCol :span="12">
            <NFormItem label="镇" path="townCode">
              <NSelect
                v-model:value="editingRecord.townCode"
                :options="townOptions"
                :disabled="!editingRecord.districtCode"
                clearable
                filterable
                placeholder="请选择乡镇"
                @update:value="handleTownChange"
              />
            </NFormItem>
          </NCol>
        </NRow>

        <NRow :gutter="24">
          <NCol :span="12">
            <NFormItem label="状态" path="state">
              <NSelect
                v-model:value="editingRecord.state"
                :options="[
                  { label: '未开放', value: 'INIT' },
                  { label: '收集中', value: 'PROCESSING' },
                  { label: '已完成', value: 'FINISHED' },
                ]"
              />
            </NFormItem>
          </NCol>
          <NCol :span="12">
            <NFormItem label="排序" path="sortOrder">
              <NInput v-model:value="editingRecord.sortOrder" type="number" />
            </NFormItem>
          </NCol>
        </NRow>

        <NFormItem label="缩略图" path="imageUrl" style="margin-bottom: 20px;">
          <NUpload
            :before-upload="beforeUpload"
            :file-list="imageFileList"
            :max="1"
            list-type="image-card"
            @change="handleFileUpload"
            @remove="handleFileRemove"
          >
            上传图片
          </NUpload>
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showModal = false">取消</NButton>
          <NButton :loading="saveLoading" type="primary" @click="handleSave">
            保存
          </NButton>
        </NSpace>
      </template>
    </NModal>
  </Page>
</template>

<style scoped>
.query-card {
  padding: 8px 16px;
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
}
</style>