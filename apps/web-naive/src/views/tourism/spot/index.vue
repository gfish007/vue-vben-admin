<script setup lang="ts">
import type { FormInst, FormRules, UploadFileInfo } from 'naive-ui';

import type { SpotApi } from '#/api/core/spot.types';
import type { SpotCategory } from '#/api/core/spotCategory';
import type { CascaderOption } from 'naive-ui';
import type { RegionApi } from '#/api/core/region.types';
import type { CityData } from '#/api/core/cityData';

import { computed, h, onMounted, reactive, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';

import {
  NAutoComplete,
  NButton,
  NButtonGroup,
  NCascader,
  NCard,
  NCol,
  NDataTable,
  NDynamicTags,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NModal,
  NPagination,
  NRow,
  NSelect,
  NSpace,
  NTag,
  NUpload,
  useMessage,
} from 'naive-ui';

import {
  deleteSpots,
  disableSpot,
  enableSpot,
  getSpotDetail,
  querySpotList,
  saveOrUpdateSpot,
} from '#/api/core/spot';
import { queryRegionList } from '#/api/core/region';
import { getAllSpotCategories } from '#/api/core/spotCategory';
import { uploadFile } from '#/api/core/file';
import { getCityDataByPid } from '#/api/core/cityData';
import LocationMap from '#/components/LocationMap.vue';
import TEditor from '#/components/TEditor.vue';
import { useDynamicHeight } from '#/utils/heightUtils';

const message = useMessage();

// 区域选项
const regionOptions = ref<Array<{ label: string; value: number }>>([]);

// 省市区级联相关
const areaCascaderOptions = ref<CascaderOption[]>([]);
const selectedAreaCascaderValue = ref<Array<string | number>>([]);

// 镇选项
const townOptions = ref<Array<{ label: string; value: number }>>([]);

// 查询条件
const queryForm = reactive<SpotApi.QueryParams['queryBody'] & { regionId?: number; enableStatus?: number }>({
  adcode: undefined,
  spotType: undefined,
  title: '',
  townCode: undefined,
  handleFlag: undefined,
  address: '',
  regionId: undefined,
  enableStatus: undefined,
});

// 表格数据
const tableData = ref<SpotApi.SpotRecord[]>([]);
const loading = ref(false);
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
  itemCount: 0,
  showSizePicker: true,
  showQuickJumper: true,
  pageSizes: [1, 10, 20, 50],
});

// 模态框相关
const showModal = ref(false);
const modalTitle = ref('');

// 分类数据
const categoryOptions = ref<SpotCategory[]>([]);
const cascaderOptions = ref<CascaderOption[]>([]);
const selectedCategoryPath = ref<string[]>(['购物服务', '超级市场', '北京华联']);

// 图片上传相关
const imageFileList = ref<UploadFileInfo[]>([]);
const uploadProgress = ref(0);
const isUploading = ref(false);

const editingRecord = ref<SpotApi.SpotSaveReq & {
  tagList?: string[];
  description?: string;
  regionId?: number;
  bestView?: {
    tide?: string;
    weather?: string;
    astronomy?: string;
    time?: string;
  };
  note?: string;
  website?: string;
  tel2?: string;
  otherConnect?: string;
  locationInfo?: Record<string, any>; // 添加locationInfo字段
}>({
  adcode: 0,
  pcode: 0,
  townCode: 0,
  townName: '',
  sortNo: 999,
  score: '',
  spotType: 'ATTRACTION',
  title: '',
  address: '',
  tel: '',
  category: '',
  type: '',
  location: {
    lat: 0,
    lng: 0,
  },
  // 移除adInfo字段
  businessInfo: {
    tel: '',
    rating: '',
    cost: '',
    opentimeWeek: '',
  },
  imageUrls: [],
  tagList: [],
  description: '',
  regionId: undefined,
  bestView: {
    tide: undefined,
    weather: undefined,
    astronomy: undefined,
    time: undefined,
  },
  note: '',
  website: '',
  tel2: '',
  otherConnect: '',
  locationInfo: {}, // 添加locationInfo字段
});

// 表单规则
const rules: FormRules = {
  title: { message: '请输入标题', required: true, trigger: 'blur' },
  spotType: { message: '请选择地点类型', required: true, trigger: 'change' },
  address: { message: '请输入地址', required: true, trigger: 'blur' },
  category: { message: '请选择分类', required: true, trigger: 'change' },
  regionId: { message: '请选择关联区域', required: false, trigger: 'change' },
  score: {
    max: 5,
    message: '评分必须在0-5之间',
    min: 0,
    trigger: ['blur', 'change'],
    type: 'number',
  },
};

const formRef = ref<FormInst | null>(null);

// 添加新的 loading 状态
const editLoading = ref(false);
const deleteLoading = ref(false);
const saveLoading = ref(false);
const enableLoading = ref(false);
const disableLoading = ref(false);

// 获取分类数据
const fetchCategories = async () => {
  try {
    const categories = await getAllSpotCategories();
    categoryOptions.value = categories;

    // 构建级联选择器选项
    const cascaderData: CascaderOption[] = [];

    // 按一级分类分组
    const bigGroups = Array.from(new Set(categories.map(item => item.big)));

    bigGroups.forEach(big => {
      const bigItem: CascaderOption = {
        label: big,
        value: big,
        children: []
      };

      // 获取该一级分类下的所有二级分类
      const middleGroups = Array.from(new Set(categories.filter(item => item.big === big).map(item => item.middle)));

      middleGroups.forEach(middle => {
        const middleItem: CascaderOption = {
          label: middle,
          value: middle,
          children: []
        };

        // 获取该二级分类下的所有三级分类
        const subItems = categories
          .filter(item => item.big === big && item.middle === middle)
          .map(item => ({
            label: item.sub,
            value: item.sub,
            // 添加code和id属性，确保与后端数据一致
            code: item.code,
            id: item.id
          }));

        middleItem.children = subItems;
        bigItem.children!.push(middleItem);
      });

      cascaderData.push(bigItem);
    });

    cascaderOptions.value = cascaderData;

  } catch (error) {
    console.error('获取分类数据失败:', error);
    message.error('获取分类数据失败');
  }
};

// 获取区域列表（用于关联区域下拉框）
const fetchRegionList = async () => {
  try {
    const result = await queryRegionList({
      page: {
        current: 1,
        size: 1000, // 获取所有区域
      },
      queryBody: {},
    });
    regionOptions.value = result.records.map(region => ({
      label: region.title,
      value: region.id,
    }));
  } catch (error) {
    console.error('获取区域列表失败:', error);
    message.error('获取区域列表失败');
  }
};

// 获取级联选择器数据（异步加载）
const loadAreaCascaderData = (node: CascaderOption) => {
  console.log('Loading cascader data for node:', node);

  return new Promise<void>((resolve) => {
    const { depth, value } = node;
    // 根据层级获取数据
    console.log('Fetching data with value:', value, 'for depth:', depth);

    getCityDataByPid(value)
      .then(data => {
        console.log('Received data from API:', data);
        // 转换数据格式
        const options = data.map(item => ({
          label: item.extName,
          value: item.id,
          depth: depth + 1 ,
          isLeaf: depth + 1 >= 3 , // 第三级（区县）为叶子节点
        }));

        console.log('Loaded cascader options:', options);
        // 直接修改node的children属性
        node.children = options;
        resolve();
      })
      .catch(error => {
        console.error('获取级联数据失败:', error);
        message.error('获取级联数据失败');
        // 出错时也resolve，避免组件卡死
        resolve();
      });
  });
};

// 初始化级联选择器数据
const initAreaCascaderData = async () => {
  try {
    console.log('Initializing cascader data');
    // 获取省份数据作为初始选项
    const provinces = await getCityDataByPid('0');
    console.log('Received provinces data:', provinces);
    areaCascaderOptions.value = provinces.map(item => ({
      label: item.extName,
      value: item.id,
      depth: 1, // 第一级depth为1
      isLeaf: false, // 省份不是叶子节点
    }));
    console.log('Initialized cascader options:', areaCascaderOptions.value);
  } catch (error) {
    console.error('初始化级联数据失败:', error);
    message.error('初始化级联数据失败');
  }
};

// 获取镇数据
const loadTownData = async (adcode: number | undefined) => {
  // 清空之前的镇选项
  townOptions.value = [];

  if (!adcode) {
    return;
  }

  try {
    console.log('Loading town data for adcode:', adcode);
    // 获取镇数据
    const towns = await getCityDataByPid(adcode.toString());
    townOptions.value = towns.map(town => ({
      label: town.extName,
      value: town.id // 保持为 number 类型
    }));
    console.log('Loaded town options:', townOptions.value);
  } catch (error) {
    console.error('获取镇数据失败:', error);
    message.error('获取镇数据失败');
  }
};

// 处理级联选择器更新
const handleCascaderUpdate = (value: Array<string>, option: CascaderOption, pathValues: Array<CascaderOption | null>) => {
  // 将选中的路径值拼接后赋给记录的category
  if (pathValues && pathValues.length === 3) {
    editingRecord.value.category = pathValues.map(item => item?.label).join(';');
  } else {
    editingRecord.value.category = '';
  }
};

// 处理级联选择器值变化
const handleCascaderChange = (value: number | undefined) => {
  console.log('Cascader value changed to:', value);
  // 当级联选择器的值变化时，确保清除镇的选择
  if (queryForm.townCode !== undefined) {
    queryForm.townCode = undefined;
  }
};

// 修改 handleEdit 函数
const handleEdit = async (row: SpotApi.SpotRecord) => {
  editLoading.value = true;
  try {
    modalTitle.value = '编辑地点';
    const detail = await getSpotDetail(row.id);

    // 处理locationInfo，确保正确显示在位置搜索栏中
    const locationInfo = 
      typeof detail.locationInfo === 'string'
        ? JSON.parse(detail.locationInfo)
        : detail.locationInfo || {};
    
    const address = locationInfo.address?.formattedAddress || detail.address || '';
    
    // 处理location数据格式转换
    const processedDetail = {
      ...detail,
      location: {
        lat: typeof detail.location.lat === 'string' ? parseFloat(detail.location.lat) : detail.location.lat,
        lng: typeof detail.location.lng === 'string' ? parseFloat(detail.location.lng) : detail.location.lng,
      }
    };

    editingRecord.value = {
      ...processedDetail,
      tagList: Array.isArray(detail.tagList) ? detail.tagList : [],
      description: detail.description ?? '',
      regionId: detail.regionId ?? undefined,
      score: detail.score ?? '',
      bestView: detail.bestView ?? {
        tide: undefined,
        weather: undefined,
        astronomy: undefined,
        time: undefined,
      },
      note: detail.note ?? '',
      website: detail.website ?? '',
      tel2: detail.tel2 ?? '',
      otherConnect: detail.otherConnect ?? '',
      address: address, // 使用formattedAddress作为位置搜索栏的值
      locationInfo: locationInfo,
    };

    // 设置图片文件列表
    imageFileList.value = detail.imageUrls.map((url, index) => ({
      id: index.toString(),
      name: `image_${index}.jpg`,
      status: 'finished',
      url,
    }));

    showModal.value = true;

    // 设置分类
    // 从category字段中解析出三级分类
    if (detail.category) {
      const categories = detail.category.split(';');
      if (categories.length === 3) {
        selectedCategoryPath.value = categories[2]
      }
    }
  } catch (error) {
    console.error('获取详情失败:', error);
    message.error('获取详情失败');
  } finally {
    editLoading.value = false;
  }
};

// 修改 handleDelete 函数
const handleDelete = async (row: SpotApi.SpotRecord) => {
  deleteLoading.value = true;
  try {
    await deleteSpots([row.id]);
    message.success('删除成功');
    fetchData();
  } catch {
    message.error('删除失败');
  } finally {
    deleteLoading.value = false;
  }
};

// 启用地点
const handleEnable = async (row: SpotApi.SpotRecord) => {
  enableLoading.value = true;
  try {
    await enableSpot(row.id);
    message.success('启用成功');
    fetchData();
  } catch {
    message.error('启用失败');
  } finally {
    enableLoading.value = false;
  }
};

// 禁用地点
const handleDisable = async (row: SpotApi.SpotRecord) => {
  disableLoading.value = true;
  try {
    await disableSpot(row.id);
    message.success('禁用成功');
    fetchData();
  } catch {
    message.error('禁用失败');
  } finally {
    disableLoading.value = false;
  }
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
      const result = await uploadFile(formData, (progress) => {
        uploadProgress.value = progress;
      });

      // 更新图片URL列表
      editingRecord.value.imageUrls.push(result.fileUrl);

      // 更新文件列表
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
const handleFileRemove = (file: UploadFileInfo) => {
  // 从imageUrls中移除对应的URL
  const index = imageFileList.value.findIndex((item) => item.id === file.id);
  if (index !== -1) {
    editingRecord.value.imageUrls.splice(index, 1);
    imageFileList.value.splice(index, 1);
  }
  return true;
};

// 文件上传前的验证
const beforeUpload = (data: { file: UploadFileInfo }) => {
  const { file } = data;
  const isImage = file.type?.startsWith('image/');
  if (!isImage) {
    message.error('只能上传图片文件');
    return false;
  }

  // 检查文件数量限制
  if (imageFileList.value.length >= 6) {
    message.error('最多只能上传6张图片');
    return false;
  }

  return true;
};

// 修改 handleSave 函数
const handleSave = async () => {
  if (!formRef.value) return;
  saveLoading.value = true;
  try {
    await formRef.value.validate();
    // 检查分类是否已选择
    if (!editingRecord.value.category) {
      message.error('请选择分类');
      saveLoading.value = false;
      return;
    }

    // 设置图片URL
    editingRecord.value.imageUrls = imageFileList.value
      .filter((file) => file.status === 'finished' && file.url)
      .map((file) => file.url || '');

    // 处理位置信息，与svc服务保持一致
    const submitData = {
      ...editingRecord.value,
      locationInfo:
        typeof editingRecord.value.locationInfo === 'string'
          ? JSON.parse(editingRecord.value.locationInfo)
          : editingRecord.value.locationInfo,
    };

    await saveOrUpdateSpot(submitData);
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
    const result = await querySpotList({
      page: {
        current: pagination.page,
        size: pagination.pageSize,
      },
      queryBody: queryForm,
    });
    console.log("111111");
    tableData.value = result.records;
    pagination.total = result.total;
    pagination.itemCount = result.total;
    // pagination.page = result.current; // 不从结果中获取当前页，保持前端设置的页码
    pagination.pageSize = result.size;
    // 确保页码不会超过总页数
    const totalPages = Math.ceil(result.total / pagination.pageSize);
    if (pagination.page > totalPages && totalPages > 0) {
      pagination.page = totalPages;
    }

    // 调试日志
    console.log('Pagination debug info:', {
      total: result.total,
      size: result.size,
      current: result.current,
      pages: result.pages,
      pagination: pagination
    });
  } catch {
    message.error('获取数据失败');
  } finally {
    loading.value = false;
  }
};

// 表格列定义
const columns = [
  {
    key: 'title',
    title: '标题',
    width: 150,
  },
  {
    key: 'spotType',
    render: (row: SpotApi.SpotRecord) => {
      const typeMap = {
        FOOD: '美食',
        ACTIVITY: '活动',
        HOTEL: '酒店',
        ATTRACTION: '景点',
      };
      return typeMap[row.spotType] || '未知';
    },
    title: '类型',
    width: 100,
  },
  {
    key: 'address',
    title: '地址',
    width: 200,
  },
  {
    key: 'score',
    title: '评分',
    width: 80,
  },
  {
    key: 'townName',
    title: '城镇',
    width: 120,
  },
  {
    key: 'businessInfo',
    render: (row: SpotApi.SpotRecord) => {
      return row.businessInfo?.tel || '无';
    },
    title: '联系电话',
    width: 120,
  },
  {
    key: 'enableStatus',
    render: (row: SpotApi.SpotRecord) => {
      return h(
        NTag,
        { type: row.enableStatus ? 'success' : 'error' },
        { default: () => (row.enableStatus ? '启用' : '禁用') },
      );
    },
    title: '状态',
    width: 100,
  },
  {
    fixed: 'right',
    key: 'actions',
    render: (row: SpotApi.SpotRecord) => {
      const buttons = [
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
      ];

      // 根据启用状态添加启用或禁用按钮
      if (!row.enableStatus) {
        buttons.push(
          h(
            NButton,
            {
              loading: enableLoading.value,
              onClick: (e: Event) => {
                e.stopPropagation();
                handleEnable(row);
              },
              type: 'success',
            },
            { default: () => '启用' },
          )
        );
      } else if (row.enableStatus) {
        buttons.push(
          h(
            NButton,
            {
              loading: disableLoading.value,
              onClick: (e: Event) => {
                e.stopPropagation();
                handleDisable(row);
              },
              type: 'warning',
            },
            { default: () => '禁用' },
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
  queryForm.adcode = undefined;
  queryForm.spotType = undefined;
  queryForm.title = '';
  queryForm.townCode = undefined;
  queryForm.handleFlag = undefined;
  queryForm.address = '';
  queryForm.regionId = undefined;
  queryForm.enableStatus = undefined;
  // 重置级联选择器
  selectedAreaCascaderValue.value = [];
  // 重置镇选项
  townOptions.value = [];
  handleSearch();
};

// 处理分页变化
const handlePageChange = (page: number) => {
  console.log('Page changed to:', page);
  pagination.page = page;
  fetchData();
};

// 处理分页大小变化
const handlePageSizeChange = (pageSize: number) => {
  console.log('Page size changed to:', pageSize);
  pagination.pageSize = pageSize;
  pagination.page = 1; // 重置到第一页
  fetchData();
};

// 处理新增
const handleAdd = () => {
  modalTitle.value = '新增地点';
  editingRecord.value = {
    adcode: 0,
    pcode: 0,
    townCode: 0,
    townName: '',
    sortNo: 999,
    score: '',
    spotType: 'ATTRACTION',
    title: '',
    address: '',
    tel: '',
    category: '',
    type: '',
    location: {
      lat: 0,
      lng: 0,
    },
    // 移除adInfo字段
    businessInfo: {
      tel: '',
      rating: '',
      cost: '',
      opentimeWeek: '',
    },
    imageUrls: [],
    tagList: [],
    description: '',
    regionId: undefined,
    bestView: {
      tide: undefined,
      weather: undefined,
      astronomy: undefined,
      time: undefined,
    },
    note: '',
    website: '',
    tel2: '',
    otherConnect: '',
    locationInfo: {}, // 添加locationInfo字段
  };

  // 重置分类
  selectedCategoryPath.value.splice(0, selectedCategoryPath.value.length);

  // 重置图片文件列表
  imageFileList.value = [];

  showModal.value = true;
};

// 初始加载数据
fetchData();
fetchCategories();
fetchRegionList();
initAreaCascaderData();

// 添加一个计算属性来动态计算表格高度
const queryCardRef = ref<HTMLElement | null>(null);
const { queryCardHeight, tableHeight } = useDynamicHeight(queryCardRef);

// 监听省市区选择变化，加载对应的镇数据
watch(() => queryForm.adcode, (newAdcode, oldAdcode) => {
  console.log('Adcode changed from:', oldAdcode, 'to:', newAdcode);
  console.log('Adcode changed from:', queryForm.townCode, queryForm);
  // 当省市区切换时，清除之前选择的镇
  if (oldAdcode !== newAdcode) {
    queryForm.townCode = undefined;
  }
  loadTownData(newAdcode);
}, { immediate: true });

onMounted(() => {
  if (queryCardRef.value) {
    queryCardHeight.value = queryCardRef.value.offsetHeight;
  }
  console.log('Component mounted, cascader options:', areaCascaderOptions.value);
  // 重新初始化级联数据
  initAreaCascaderData();
  // 添加一个定时器来检查数据更新
  setTimeout(() => {
    console.log('Cascader options after timeout:', areaCascaderOptions.value);
  }, 1000);
});
</script>

<template>
  <Page description="管理系统中的地点信息" title="地点管理">
    <div ref="queryCardRef" class="w-full">
      <NCard class="query-card">
        <NForm :model="queryForm" inline>
          <NSpace
            :size="[24, 0]"
            align="center"
            justify="space-between"
            style="width: 100%"
          >
            <NSpace :size="24" align="center">
              <NFormItem label="地点类型" label-placement="left">
                <NSelect
                  v-model:value="queryForm.spotType"
                  :options="[
                    { label: '美食', value: 'FOOD' },
                    { label: '活动', value: 'ACTIVITY' },
                    { label: '酒店', value: 'HOTEL' },
                    { label: '景点', value: 'ATTRACTION' },
                  ]"
                  clearable
                  style="width: 120px"
                />
              </NFormItem>
              <NFormItem label="标题" label-placement="left">
                <NInput v-model:value="queryForm.title" style="width: 200px" />
              </NFormItem>
              <NFormItem label="手动维护" label-placement="left">
                <NSelect
                  v-model:value="queryForm.handleFlag"
                  :options="[
                    { label: '是', value: 'Y' },
                    { label: '否', value: 'N' },
                  ]"
                  clearable
                  style="width: 120px"
                />
              </NFormItem>
              <NFormItem label="地址" label-placement="left">
                <NInput v-model:value="queryForm.address" style="width: 200px" />
              </NFormItem>
              <NFormItem label="省市区" label-placement="left">
                <NCascader
                  v-model:value="queryForm.adcode"
                  placeholder="请选择具体的县"
                  :options="areaCascaderOptions"
                  check-strategy="child"
                  show-path
                  :on-load="loadAreaCascaderData"
                  remote
                  :leaf-field="'isLeaf'"
                  :children-field="'children'"
                  :value-field="'value'"
                  :label-field="'label'"
                  style="width: 200px"
                  @update:value="handleCascaderChange"
                />
              </NFormItem>
              <NFormItem label="镇" label-placement="left">
                <NSelect
                  v-model:value="queryForm.townCode"
                  :disabled="!queryForm.adcode"
                  :options="townOptions"
                  clearable
                  filterable
                  placeholder="请先选择区县"
                  style="width: 120px"
                />
              </NFormItem>
              <NFormItem label="关联区域" label-placement="left">
                <NSelect
                  v-model:value="queryForm.regionId"
                  :options="regionOptions"
                  clearable
                  filterable
                  placeholder="请选择关联区域"
                  style="width: 150px"
                />
              </NFormItem>
              <NFormItem label="状态" label-placement="left">
                <NSelect
                  v-model:value="queryForm.enableStatus"
                  :options="[
                    { label: '启用', value: 1 },
                    { label: '禁用', value: 0 },
                  ]"
                  clearable
                  style="width: 120px"
                />
              </NFormItem>
            </NSpace>
          </NSpace>
          <!-- 将按钮组移到查询条件后面 -->
          <div style="width: 100%; margin-top: 16px; display: flex; justify-content: flex-end;">
            <NSpace>
              <NButton type="primary" @click="handleSearch">搜索</NButton>
              <NButton @click="handleReset">重置</NButton>
              <NButton type="success" @click="handleAdd">新增地点</NButton>
            </NSpace>
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
        :scroll-x="1000"
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
        <NFormItem label="图片" path="imageUrls" style="margin-bottom: 20px;">
          <NUpload
            :before-upload="beforeUpload"
            :file-list="imageFileList"
            :max="6"
            list-type="image-card"
            @change="handleFileUpload"
            @remove="handleFileRemove"
          >
            上传图片
          </NUpload>
        </NFormItem>

        <NRow :gutter="24">
          <NCol :span="12">
            <NFormItem label="标题" path="title">
              <NInput v-model:value="editingRecord.title" />
            </NFormItem>
          </NCol>
          <NCol :span="12">
            <NFormItem label="地点类型" path="spotType">
              <NSelect
                v-model:value="editingRecord.spotType"
                :options="[
                  { label: '美食', value: 'FOOD' },
                  { label: '休闲', value: 'ACTIVITY' },
                  { label: '住宿', value: 'HOTEL' },
                  { label: '景点', value: 'ATTRACTION' },
                ]"
              />
            </NFormItem>
          </NCol>
        </NRow>

        <NRow :gutter="24">
          <NCol :span="12">
            <NFormItem label="分类" path="category">
              <NCascader
                v-model:value="selectedCategoryPath"
                :options="cascaderOptions"
                check-strategy="child"
                clearable
                placeholder="请选择分类"
                @update:value="handleCascaderUpdate"
              />
            </NFormItem>
          </NCol>
          <NCol :span="12">
            <NFormItem label="关联区域" path="regionId">
              <NSelect
                v-model:value="editingRecord.regionId"
                :options="regionOptions"
                clearable
                filterable
                placeholder="请选择关联区域"
              />
            </NFormItem>
          </NCol>
        </NRow>

        <NRow :gutter="24">
          <NCol :span="12">
            <NFormItem label="标签列表" path="tagList">
              <NDynamicTags v-model:value="editingRecord.tagList" />
            </NFormItem>
          </NCol>
          <NCol :span="12">
            <NFormItem label="地点评分" path="score">
              <NInputNumber
                v-model:value="editingRecord.score"
                :max="5"
                :min="0"
                :precision="1"
                :step="0.1"
                placeholder="请输入评分（0-5）"
              />
            </NFormItem>
          </NCol>
        </NRow>

        <NFormItem label="地址" path="address">
          <NInput
            v-model:value="editingRecord.address"
            type="textarea"
          />
        </NFormItem>

        <NFormItem label="描述" path="description">
          <TEditor v-model="editingRecord.description" />
        </NFormItem>

        <NCard title="观看时机" style="margin-bottom: 20px;">
          <NRow :gutter="24">
            <NCol :span="12">
              <NFormItem label="潮汐" path="bestView.tide">
                <NSelect
                  v-model:value="editingRecord.bestView.tide"
                  :options="[
                    { label: '高潮', value: '高潮' },
                    { label: '低潮', value: '低潮' },
                    { label: '大潮高潮', value: '大潮高潮' },
                    { label: '大潮低潮', value: '大潮低潮' },
                    { label: '平潮', value: '平潮' },
                  ]"
                  clearable
                  placeholder="请选择潮汐"
                />
              </NFormItem>
            </NCol>
            <NCol :span="12">
              <NFormItem label="天气" path="bestView.weather">
                <NSelect
                  v-model:value="editingRecord.bestView.weather"
                  :options="[
                    { label: '晴天', value: '晴天' },
                    { label: '多云', value: '多云' },
                    { label: '小雨', value: '小雨' },
                    { label: '中雨', value: '中雨' },
                    { label: '大雨', value: '大雨' },
                    { label: '暴雨', value: '暴雨' },
                    { label: '台风', value: '台风' },
                    { label: '下雪', value: '下雪' },
                    { label: '大风', value: '大风' },
                  ]"
                  clearable
                  placeholder="请选择天气"
                />
              </NFormItem>
            </NCol>
          </NRow>
          <NRow :gutter="24">
            <NCol :span="12">
              <NFormItem label="天象" path="bestView.astronomy">
                <NSelect
                  v-model:value="editingRecord.bestView.astronomy"
                  :options="[
                    { label: '日出', value: '日出' },
                    { label: '日落', value: '日落' },
                    { label: '月升', value: '月升' },
                    { label: '月落', value: '月落' },
                    { label: '满月', value: '满月' },
                  ]"
                  clearable
                  placeholder="请选择天象"
                />
              </NFormItem>
            </NCol>
            <NCol :span="12">
              <NFormItem label="时间" path="bestView.time">
                <NSelect
                  v-model:value="editingRecord.bestView.time"
                  :options="[
                    { label: '白天', value: '白天' },
                    { label: '黑夜', value: '黑夜' },
                  ]"
                  clearable
                  placeholder="请选择时间"
                />
              </NFormItem>
            </NCol>
          </NRow>
        </NCard>

        <div style="margin-bottom: 20px;">
          <NCard title="经营信息">
            <NRow :gutter="24">
              <NCol :span="12">
                <NFormItem label="人均消费" path="businessInfo.cost">
                  <NInput v-model:value="editingRecord.businessInfo.cost" />
                </NFormItem>
              </NCol>
              <NCol :span="12">
                <NFormItem label="评分" path="businessInfo.rating">
                  <NInput v-model:value="editingRecord.businessInfo.rating" />
                </NFormItem>
              </NCol>
            </NRow>

            <NRow :gutter="24">
              <NCol :span="12">
                <NFormItem label="联系电话" path="businessInfo.tel">
                  <NInput v-model:value="editingRecord.businessInfo.tel" />
                </NFormItem>
              </NCol>
              <NCol :span="12">
                <NFormItem label="经营时间" path="businessInfo.opentimeWeek">
                  <NInput v-model:value="editingRecord.businessInfo.opentimeWeek" />
                </NFormItem>
              </NCol>
            </NRow>

            <NRow :gutter="24">
              <NCol :span="24">
                <NFormItem label="注意事项" path="note">
                  <NInput
                    v-model:value="editingRecord.note"
                    :maxlength="100"
                    placeholder="请输入注意事项（最多100个字）"
                    type="textarea"
                  />
                </NFormItem>
              </NCol>
            </NRow>
            <NRow :gutter="24">
              <NCol :span="12">
                <NFormItem label="官网" path="website">
                  <NInput
                    v-model:value="editingRecord.website"
                    placeholder="请输入官网地址"
                  />
                </NFormItem>
              </NCol>
              <NCol :span="12">
                <NFormItem label="备用电话" path="tel2">
                  <NInput
                    v-model:value="editingRecord.tel2"
                    placeholder="请输入备用电话"
                  />
                </NFormItem>
              </NCol>
            </NRow>
            <NRow :gutter="24">
              <NCol :span="24">
                <NFormItem label="其他联系方式" path="otherConnect">
                  <NInput
                    v-model:value="editingRecord.otherConnect"
                    placeholder="请输入其他联系方式"
                  />
                </NFormItem>
              </NCol>
            </NRow>
          </NCard>
        </div>

        <NFormItem label="位置信息" path="location" style="width: 100%">
          <LocationMap
            v-model:location="editingRecord.address"
            v-model:location-info="editingRecord.locationInfo"
          />
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
  flex-direction: column;
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

/* 确保按钮组正确右对齐 */
.query-card :deep(.n-form > div) {
  width: 100%;
}

.n-data-table {
  flex: 1;
}
</style>


