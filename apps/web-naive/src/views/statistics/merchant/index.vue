<script setup lang="ts">
import type { FormInst, FormRules, UploadFileInfo } from 'naive-ui';

import type { MerchantApi } from '#/api/system/merchant.types';
import type { CityData } from '#/api/core/cityData';
import type { CascaderOption } from 'naive-ui';

import { h, onMounted, reactive, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';

import {
  NButton,
  NButtonGroup,
  NCascader,
  NCard,
  NRadio,
  NRadioGroup,
  NCol,
  NDataTable,
  NForm,
  NFormItem,
  NInput,
  NModal,
  NPagination,
  NRow,
  NSelect,
  NSpace,
  NUpload,
  useMessage,
} from 'naive-ui';

import {
  auditMerchant,
  deleteMerchants,
  getMerchantDetail,
  queryMerchantList,
  saveOrUpdateMerchant,
  updateMerchantStatus,
} from '#/api/system/merchant';
import { getCityDataByPid } from '#/api/core/cityData';
import { uploadFile } from '#/api/core/file';
import { useDynamicHeight } from '#/utils/heightUtils';

const message = useMessage();

// 查询条件
const queryForm = reactive<MerchantApi.QueryParams['queryBody']>({
  name: undefined,
  merchantCode: undefined,
  status: undefined,
  auditStatus: undefined,
  available: undefined,
  gmtApproveBegin: undefined,
  gmtApproveEnd: undefined,
});

// 表格数据
const tableData = ref<MerchantApi.MerchantRecord[]>([]);
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
const isAuditModal = ref(false);

// 图片上传相关
const logoFileList = ref<UploadFileInfo[]>([]);
const businessLicenseFileList = ref<UploadFileInfo[]>([]);
const idCardFrontFileList = ref<UploadFileInfo[]>([]);
const idCardBackFileList = ref<UploadFileInfo[]>([]);

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

const editingRecord = ref<MerchantApi.MerchantSaveReq>({
  name: '',
  shortName: '',
  type: 1, // 默认选择企业类型
  contactName: '',
  contactPhone: '',
  province: '',
  provinceCode: '',
  city: '',
  cityCode: '',
  district: '',
  districtCode: '',
  town: '',
  townCode: '',
  address: '',
});

// 表单规则
const rules: FormRules = {
  name: { message: '请输入商户名称', required: true, trigger: 'blur' },
  shortName: { message: '请输入商户简称', required: true, trigger: 'blur' },
  type: { message: '请选择商户类型', required: true, type: 'number', trigger: 'change' },
  contactName: { message: '请输入联系人姓名', required: true, trigger: 'blur' },
  contactPhone: { message: '请输入联系电话', required: true, trigger: 'blur' },
  provinceCode: { message: '请选择省份', required: true, trigger: 'change' },
  cityCode: { message: '请选择城市', required: true, trigger: 'change' },
  townCode: { message: '请选择乡镇', required: true, trigger: 'change' },
  districtCode: { message: '请选择区域', required: true, trigger: 'change' },
  address: { message: '请输入详细地址', required: true, trigger: 'blur' },
};

const formRef = ref<FormInst | null>(null);

// 添加新的 loading 状态
const editLoading = ref(false);
const deleteLoading = ref(false);
const saveLoading = ref(false);
const auditLoading = ref(false);

// 审核相关
const auditForm = reactive({
  id: '',
  auditStatus: 1,
  auditOpinion: '',
});
const auditFormRef = ref<FormInst | null>(null);

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

// 获取乡镇数据
const fetchTowns = async (districtId: string) => {
  try {
    const towns = await getCityDataByPid(districtId);
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

// 查询数据
const fetchData = async () => {
  loading.value = true;
  try {
    const result = await queryMerchantList({
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
  { key: 'merchantCode', title: '商户编码', width: 150 },
  { key: 'name', title: '商户名称', width: 150 },
  { key: 'shortName', title: '商户简称', width: 120 },
  {
    key: 'type',
    render: (row: MerchantApi.MerchantRecord) => {
      const typeMap = {
        1: '企业',
        2: '个体',
        3: '个人',
      };
      return typeMap[row.type as keyof typeof typeMap] || '未知';
    },
    title: '商户类型',
    width: 100,
  },
  { key: 'contactName', title: '联系人', width: 120 },
  { key: 'contactPhone', title: '联系电话', width: 120 },
  {
    key: 'status',
    render: (row: MerchantApi.MerchantRecord) => {
      const statusMap = {
        0: '未激活',
        1: '正常',
        2: '禁用',
        3: '注销',
      };
      return statusMap[row.status as keyof typeof statusMap] || '未知';
    },
    title: '状态',
    width: 100,
  },
  {
    key: 'auditStatus',
    render: (row: MerchantApi.MerchantRecord) => {
      const auditStatusMap = {
        0: '待审核',
        1: '审核通过',
        2: '审核驳回',
      };
      return auditStatusMap[row.auditStatus as keyof typeof auditStatusMap] || '未知';
    },
    title: '审核状态',
    width: 100,
  },
  {
    key: 'available',
    render: (row: MerchantApi.MerchantRecord) => {
      return row.available === 1 ? '可接单' : '暂停';
    },
    title: '接单状态',
    width: 100,
  },
  {
    key: 'gmtCreate',
    title: '创建时间',
    width: 180,
  },
  {
    fixed: 'right',
    key: 'actions',
    render: (row: MerchantApi.MerchantRecord) => {
      // 审核通过的商户不显示审核按钮
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

      // 只有非审核通过的商户才显示审核按钮
      if (row.auditStatus !== 1) {
        buttons.push(
          h(
            NButton,
            {
              onClick: () => handleAudit(row),
              type: 'info',
            },
            { default: () => '审核' },
          )
        );
      }

      buttons.push(
        h(
          NButton,
          {
            onClick: () => handleToggleStatus(row),
            type: row.status === 1 ? 'warning' : 'success',
          },
          { default: () => (row.status === 1 ? '禁用' : '启用') },
        )
      );

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
  queryForm.name = undefined;
  queryForm.merchantCode = undefined;
  queryForm.status = undefined;
  queryForm.auditStatus = undefined;
  queryForm.available = undefined;
  queryForm.gmtApproveBegin = undefined;
  queryForm.gmtApproveEnd = undefined;
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
  modalTitle.value = '新增商户';
  editingRecord.value = {
    name: '',
    shortName: '',
    type: 1, // 默认选择企业类型
    contactName: '',
    contactPhone: '',
    province: '',
    provinceCode: '',
    city: '',
    cityCode: '',
    district: '',
    districtCode: '',
    town: '',
    townCode: '',
    address: '',
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
  logoFileList.value = [];
  businessLicenseFileList.value = [];
  idCardFrontFileList.value = [];
  idCardBackFileList.value = [];

  showModal.value = true;
};

// 修改 handleEdit 函数
const handleEdit = async (row: MerchantApi.MerchantRecord) => {
  editLoading.value = true;
  try {
    modalTitle.value = '编辑商户';
    const detail = await getMerchantDetail(row.id);

    editingRecord.value = {
      id: detail.id,
      merchantCode: detail.merchantCode,
      userId: detail.userId,
      name: detail.name,
      shortName: detail.shortName,
      type: detail.type,
      status: detail.status,
      auditStatus: detail.auditStatus,
      auditOpinion: detail.auditOpinion,
      level: detail.level,
      logoUrl: detail.logoUrl,
      industryId: detail.industryId,
      contactName: detail.contactName,
      contactPhone: detail.contactPhone,
      wchat: detail.wchat,
      contactEmail: detail.contactEmail,
      province: detail.province,
      provinceCode: detail.provinceCode,
      city: detail.city,
      cityCode: detail.cityCode,
      district: detail.district,
      districtCode: detail.districtCode,
      town: detail.town,
      townCode: detail.townCode,
      address: detail.address,
      longitude: detail.longitude,
      latitude: detail.latitude,
      businessLicenseNo: detail.businessLicenseNo,
      businessLicenseImg: detail.businessLicenseImg,
      legalPerson: detail.legalPerson,
      legalPersonIdCard: detail.legalPersonIdCard,
      legalPersonIdCardFront: detail.legalPersonIdCardFront,
      legalPersonIdCardBack: detail.legalPersonIdCardBack,
      introduction: detail.introduction,
      businessHours: detail.businessHours,
      available: detail.available,
      gmtApprove: detail.gmtApprove,
    };

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
        selectedProvince.value = provinceOption.value;
        // 获取城市数据
        await fetchCities(provinceOption.value.toString());

        // 如果有城市信息，尝试查找对应的adcode
        if (detail.city) {
          const cityOption = cityOptions.value.find(option => option.label === detail.city);
          if (cityOption) {
            selectedCity.value = cityOption.value;
            // 获取区域数据
            await fetchDistricts(cityOption.value.toString());

            // 如果有区域信息，尝试查找对应的adcode
            if (detail.district) {
              const districtOption = districtOptions.value.find(option => option.label === detail.district);
              if (districtOption) {
                selectedDistrict.value = districtOption.value;
                // 获取乡镇数据
                await fetchTowns(districtOption.value.toString());

                // 如果有乡镇信息，尝试查找对应的adcode
                if (detail.town) {
                  const townOption = townOptions.value.find(option => option.label === detail.town);
                  if (townOption) {
                    selectedTown.value = townOption.value;
                  }
                }
              }
            }
          }
        }
      }
    }

    // 设置图片文件列表
    if (detail.logoUrl) {
      logoFileList.value = [{
        id: 'logo',
        name: 'logo.jpg',
        status: 'finished',
        url: detail.logoUrl,
      }];
    } else {
      logoFileList.value = [];
    }

    if (detail.businessLicenseImg) {
      businessLicenseFileList.value = [{
        id: 'license',
        name: 'license.jpg',
        status: 'finished',
        url: detail.businessLicenseImg,
      }];
    } else {
      businessLicenseFileList.value = [];
    }

    if (detail.legalPersonIdCardFront) {
      idCardFrontFileList.value = [{
        id: 'front',
        name: 'idcard_front.jpg',
        status: 'finished',
        url: detail.legalPersonIdCardFront,
      }];
    } else {
      idCardFrontFileList.value = [];
    }

    if (detail.legalPersonIdCardBack) {
      idCardBackFileList.value = [{
        id: 'back',
        name: 'idcard_back.jpg',
        status: 'finished',
        url: detail.legalPersonIdCardBack,
      }];
    } else {
      idCardBackFileList.value = [];
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
const handleDelete = async (row: MerchantApi.MerchantRecord) => {
  deleteLoading.value = true;
  try {
    await deleteMerchants([row.id]);
    message.success('删除成功');
    fetchData();
  } catch {
    message.error('删除失败');
  } finally {
    deleteLoading.value = false;
  }
};

// 处理审核
const handleAudit = (row: MerchantApi.MerchantRecord) => {
  auditForm.id = row.id;
  auditForm.auditStatus = row.auditStatus === 1 ? 2 : 1; // 切换审核状态
  auditForm.auditOpinion = row.auditOpinion || '';
  isAuditModal.value = true;
};

// 执行审核
const handleAuditSubmit = async () => {
  if (!auditFormRef.value) return;
  try {
    await auditFormRef.value.validate();
    auditLoading.value = true;
    await auditMerchant({
      id: auditForm.id,
      auditStatus: auditForm.auditStatus,
      auditOpinion: auditForm.auditOpinion,
    });
    message.success('审核操作成功');
    isAuditModal.value = false;
    fetchData();
  } catch (error) {
    console.error('审核失败:', error);
    message.error('审核失败');
  } finally {
    auditLoading.value = false;
  }
};

// 处理启用/禁用
const handleToggleStatus = async (row: MerchantApi.MerchantRecord) => {
  try {
    const newStatus = row.status === 1 ? 2 : 1; // 1:正常, 2:禁用
    await updateMerchantStatus({
      id: row.id,
      status: newStatus,
    });
    message.success(`${newStatus === 1 ? '启用' : '禁用'}成功`);
    fetchData();
  } catch {
    message.error('操作失败');
  }
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
}, fileList: UploadFileInfo[], field: string) => {
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

      // 更新对应的URL字段
      if (field === 'logoUrl') {
        editingRecord.value.logoUrl = result.fileUrl;
      } else if (field === 'businessLicenseImg') {
        editingRecord.value.businessLicenseImg = result.fileUrl;
      } else if (field === 'legalPersonIdCardFront') {
        editingRecord.value.legalPersonIdCardFront = result.fileUrl;
      } else if (field === 'legalPersonIdCardBack') {
        editingRecord.value.legalPersonIdCardBack = result.fileUrl;
      }

      // 更新文件列表
      fileList.splice(0, fileList.length);
      fileList.push({
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
const handleFileRemove = (fileList: UploadFileInfo[], field: string) => {
  // 清除对应的URL字段
  if (field === 'logoUrl') {
    editingRecord.value.logoUrl = undefined;
  } else if (field === 'businessLicenseImg') {
    editingRecord.value.businessLicenseImg = undefined;
  } else if (field === 'legalPersonIdCardFront') {
    editingRecord.value.legalPersonIdCardFront = undefined;
  } else if (field === 'legalPersonIdCardBack') {
    editingRecord.value.legalPersonIdCardBack = undefined;
  }

  // 清空文件列表
  fileList.splice(0, fileList.length);
  return true;
};

// 修改 handleSave 函数
const handleSave = async () => {
  if (!formRef.value) return;
  saveLoading.value = true;
  try {
    await formRef.value.validate();

    await saveOrUpdateMerchant(editingRecord.value);
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
  <Page description="管理系统中的商户信息" title="商户管理">
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
              <NFormItem label="商户名" label-placement="left">
                <NInput v-model:value="queryForm.name" style="width: 150px" />
              </NFormItem>
              <NFormItem label="商户编码" label-placement="left">
                <NInput v-model:value="queryForm.merchantCode" style="width: 150px" />
              </NFormItem>
              <NFormItem label="状态" label-placement="left">
                <NSelect
                  v-model:value="queryForm.status"
                  :options="[
                    { label: '未激活', value: 0 },
                    { label: '正常', value: 1 },
                    { label: '禁用', value: 2 },
                    { label: '注销', value: 3 },
                  ]"
                  clearable
                  style="width: 120px"
                />
              </NFormItem>
              <NFormItem label="审核状态" label-placement="left">
                <NSelect
                  v-model:value="queryForm.auditStatus"
                  :options="[
                    { label: '待审核', value: 0 },
                    { label: '审核通过', value: 1 },
                    { label: '审核驳回', value: 2 },
                  ]"
                  clearable
                  style="width: 120px"
                />
              </NFormItem>
              <NFormItem label="是否可接单" label-placement="left">
                <NSelect
                  v-model:value="queryForm.available"
                  :options="[
                    { label: '可接单', value: 1 },
                    { label: '暂停', value: 0 },
                  ]"
                  clearable
                  style="width: 120px"
                />
              </NFormItem>
            </NSpace>
            <NSpace>
              <NButton type="primary" @click="handleSearch">搜索</NButton>
              <NButton @click="handleReset">重置</NButton>
              <NButton type="success" @click="handleAdd">新增商户</NButton>
            </NSpace>
          </NSpace>
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
        :scroll-x="1800"
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
      style="width: 80vw; max-width: 1200px"
    >
      <NForm
        ref="formRef"
        :model="editingRecord"
        :rules="rules"
        label-placement="left"
        label-width="120px"
        require-mark-placement="right-hanging"
      >
        <NCard title="基本信息">
          <NRow :gutter="24">
            <NCol :span="12">
              <NFormItem label="商户名称" path="name">
                <NInput v-model:value="editingRecord.name" />
              </NFormItem>
            </NCol>
            <NCol :span="12">
              <NFormItem label="商户简称" path="shortName">
                <NInput v-model:value="editingRecord.shortName" />
              </NFormItem>
            </NCol>
          </NRow>

          <NRow :gutter="24">
            <NCol :span="12">
              <NFormItem label="商户类型" path="type">
                <NSelect
                  v-model:value="editingRecord.type"
                  :options="[
                    { label: '企业', value: 1 },
                    { label: '个体', value: 2 },
                    { label: '个人', value: 3 },
                  ]"
                />
              </NFormItem>
            </NCol>
            <NCol :span="12">
              <NFormItem label="商户等级" path="level">
                <NSelect
                  v-model:value="editingRecord.level"
                  :options="[
                    { label: '1级', value: 1 },
                    { label: '2级', value: 2 },
                    { label: '3级', value: 3 },
                    { label: '4级', value: 4 },
                    { label: '5级', value: 5 },
                  ]"
                  clearable
                />
              </NFormItem>
            </NCol>
          </NRow>

          <NRow :gutter="24">
            <NCol :span="12">
              <NFormItem label="联系人姓名" path="contactName">
                <NInput v-model:value="editingRecord.contactName" />
              </NFormItem>
            </NCol>
            <NCol :span="12">
              <NFormItem label="联系电话" path="contactPhone">
                <NInput v-model:value="editingRecord.contactPhone" />
              </NFormItem>
            </NCol>
          </NRow>

          <NRow :gutter="24">
            <NCol :span="12">
              <NFormItem label="微信号" path="wchat">
                <NInput v-model:value="editingRecord.wchat" />
              </NFormItem>
            </NCol>
            <NCol :span="12">
              <NFormItem label="联系邮箱" path="contactEmail">
                <NInput v-model:value="editingRecord.contactEmail" />
              </NFormItem>
            </NCol>
          </NRow>
        </NCard>

        <NCard title="地址信息" style="margin-top: 20px;">
          <NRow :gutter="24">
            <NCol :span="12">
              <NFormItem label="省" path="province">
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
              <NFormItem label="市" path="city">
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
              <NFormItem label="区" path="district">
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
              <NFormItem label="镇" path="town">
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
            <NCol :span="24">
              <NFormItem label="详细地址" path="address">
                <NInput v-model:value="editingRecord.address" type="textarea" />
              </NFormItem>
            </NCol>
          </NRow>
        </NCard>

        <NCard title="证件信息" style="margin-top: 20px;">
          <NRow :gutter="24">
            <NCol :span="12">
              <NFormItem label="营业执照号" path="businessLicenseNo">
                <NInput v-model:value="editingRecord.businessLicenseNo" />
              </NFormItem>
            </NCol>
            <NCol :span="12">
              <NFormItem label="法人姓名" path="legalPerson">
                <NInput v-model:value="editingRecord.legalPerson" />
              </NFormItem>
            </NCol>
          </NRow>

          <NRow :gutter="24">
            <NCol :span="12">
              <NFormItem label="法人身份证号" path="legalPersonIdCard">
                <NInput v-model:value="editingRecord.legalPersonIdCard" />
              </NFormItem>
            </NCol>
            <NCol :span="12">
              <NFormItem label="营业时间" path="businessHours">
                <NInput v-model:value="editingRecord.businessHours" />
              </NFormItem>
            </NCol>
          </NRow>

          <NRow :gutter="24">
            <NCol :span="12">
              <NFormItem label="商户Logo">
                <NUpload
                  :before-upload="beforeUpload"
                  :file-list="logoFileList"
                  :max="1"
                  list-type="image-card"
                  @change="(options) => handleFileUpload(options, logoFileList, 'logoUrl')"
                  @remove="() => handleFileRemove(logoFileList, 'logoUrl')"
                >
                  上传Logo
                </NUpload>
              </NFormItem>
            </NCol>
            <NCol :span="12">
              <NFormItem label="营业执照">
                <NUpload
                  :before-upload="beforeUpload"
                  :file-list="businessLicenseFileList"
                  :max="1"
                  list-type="image-card"
                  @change="(options) => handleFileUpload(options, businessLicenseFileList, 'businessLicenseImg')"
                  @remove="() => handleFileRemove(businessLicenseFileList, 'businessLicenseImg')"
                >
                  上传执照
                </NUpload>
              </NFormItem>
            </NCol>
          </NRow>
            <NRow :gutter="24">
            <NCol :span="12">
              <NFormItem label="身份证正面">
                <NUpload
                  :before-upload="beforeUpload"
                  :file-list="idCardFrontFileList"
                  :max="1"
                  list-type="image-card"
                  @change="(options) => handleFileUpload(options, idCardFrontFileList, 'legalPersonIdCardFront')"
                  @remove="() => handleFileRemove(idCardFrontFileList, 'legalPersonIdCardFront')"
                >
                  上传正面
                </NUpload>
              </NFormItem>
            </NCol>
            <NCol :span="12">
              <NFormItem label="身份证反面">
                <NUpload
                  :before-upload="beforeUpload"
                  :file-list="idCardBackFileList"
                  :max="1"
                  list-type="image-card"
                  @change="(options) => handleFileUpload(options, idCardBackFileList, 'legalPersonIdCardBack')"
                  @remove="() => handleFileRemove(idCardBackFileList, 'legalPersonIdCardBack')"
                >
                  上传反面
                </NUpload>
              </NFormItem>
            </NCol>
          </NRow>
        </NCard>

        <NCard title="其他信息" style="margin-top: 20px;">
          <NRow :gutter="24">
            <NCol :span="24">
              <NFormItem label="商户介绍" path="introduction">
                <NInput v-model:value="editingRecord.introduction" type="textarea" />
              </NFormItem>
            </NCol>
          </NRow>
        </NCard>
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

    <!-- 审核模态框 -->
    <NModal
      v-model:show="isAuditModal"
      preset="card"
      title="商户审核"
      style="width: 500px"
    >
      <NForm
        ref="auditFormRef"
        :model="auditForm"
        label-placement="left"
        label-width="100px"
      >
        <NFormItem label="审核状态" path="auditStatus">
          <NRadioGroup v-model:value="auditForm.auditStatus">
            <NRadio :value="1">审核通过</NRadio>
            <NRadio :value="2">审核驳回</NRadio>
          </NRadioGroup>
        </NFormItem>
        <NFormItem v-show="auditForm.auditStatus === 2" label="审核意见" path="auditOpinion">
          <NInput v-model:value="auditForm.auditOpinion" type="textarea" />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="isAuditModal = false">取消</NButton>
          <NButton :loading="auditLoading" type="primary" @click="handleAuditSubmit">
            确认
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
