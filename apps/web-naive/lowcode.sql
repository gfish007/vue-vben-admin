-- 1. 页面相关表
-- ------------------------------------

-- 页面配置表
CREATE TABLE `lc_page_config` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `tenant_id` varchar(32) NOT NULL COMMENT '租户ID',
  `page_code` varchar(50) NOT NULL COMMENT '页面编码',
  `page_name` varchar(100) NOT NULL COMMENT '页面名称',
  `page_type` varchar(20) NOT NULL COMMENT '页面类型：FORM/LIST/DETAIL',
  `layout_config` json COMMENT '页面布局配置',
  `events` json COMMENT '页面事件配置',
  `data_sources` json COMMENT '页面关联的数据源配置',
  `remark` varchar(255) COMMENT '备注',
  `status` tinyint NOT NULL DEFAULT '1' COMMENT '状态：0-禁用，1-启用',
  `creator` varchar(50) NOT NULL COMMENT '创建人',
  `updater` varchar(50) COMMENT '更新人',
  `delete_flag` tinyint(1) NOT NULL DEFAULT '0' COMMENT '删除标识1是0否',
  `gmt_create` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `gmt_modified` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tenant_page` (`tenant_id`, `page_code`, `delete_flag`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='页面配置表';

-- 页面版本表
CREATE TABLE `lc_page_version` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `tenant_id` varchar(32) NOT NULL COMMENT '租户ID',
  `page_code` varchar(50) NOT NULL COMMENT '页面编码',
  `version` varchar(32) NOT NULL COMMENT '版本号',
  `description` varchar(255) COMMENT '版本描述',
  `is_published` tinyint NOT NULL DEFAULT '0' COMMENT '是否发布：0-否，1-是',
  `creator` varchar(50) NOT NULL COMMENT '创建人',
  `delete_flag` tinyint(1) NOT NULL DEFAULT '0' COMMENT '删除标识1是0否',
  `gmt_create` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `gmt_modified` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tenant_page_version` (`tenant_id`, `page_code`, `version`, `delete_flag`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='页面版本表';

-- 2. 组件相关表
-- ------------------------------------

-- 组件表
CREATE TABLE `lc_component` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `tenant_id` varchar(32) NOT NULL COMMENT '租户ID',
  `component_code` varchar(50) NOT NULL COMMENT '组件编码',
  `component_name` varchar(100) NOT NULL COMMENT '组件名称',
  `component_type` varchar(50) NOT NULL COMMENT '组件类型',
  `category` varchar(50) NOT NULL COMMENT '组件分类',
  `icon` varchar(100) COMMENT '组件图标',
  `is_container` tinyint NOT NULL DEFAULT '0' COMMENT '是否为容器组件：0-否，1-是',
  `props_schema` json COMMENT '组件属性定义',
  `default_props` json COMMENT '默认属性值',
  `remark` varchar(255) COMMENT '备注',
  `status` tinyint NOT NULL DEFAULT '1' COMMENT '状态：0-禁用，1-启用',
  `creator` varchar(50) NOT NULL COMMENT '创建人',
  `updater` varchar(50) COMMENT '更新人',
  `delete_flag` tinyint(1) NOT NULL DEFAULT '0' COMMENT '删除标识1是0否',
  `gmt_create` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `gmt_modified` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tenant_component` (`tenant_id`, `component_code`, `delete_flag`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='组件表';

-- 组件关系表
CREATE TABLE `lc_component_relation` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `tenant_id` varchar(32) NOT NULL COMMENT '租户ID',
  `page_code` varchar(50) NOT NULL COMMENT '页面编码',
  `version` varchar(32) NOT NULL COMMENT '版本号',
  `component_instance_id` varchar(50) NOT NULL COMMENT '组件实例ID',
  `parent_instance_id` varchar(50) COMMENT '父组件实例ID',
  `component_code` varchar(50) NOT NULL COMMENT '组件编码',
  `props` json COMMENT '组件属性配置',
  `style` json COMMENT '组件样式配置',
  `data_binding` json COMMENT '数据绑定配置',
  `events` json COMMENT '事件配置',
  `sort_order` int NOT NULL DEFAULT '0' COMMENT '同级排序号',
  `creator` varchar(50) NOT NULL COMMENT '创建人',
  `updater` varchar(50) COMMENT '更新人',
  `delete_flag` tinyint(1) NOT NULL DEFAULT '0' COMMENT '删除标识1是0否',
  `gmt_create` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `gmt_modified` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tenant_instance` (`tenant_id`, `component_instance_id`, `delete_flag`),
  KEY `idx_tenant_page_version` (`tenant_id`, `page_code`, `version`),
  KEY `idx_tenant_parent` (`tenant_id`, `parent_instance_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='组件关系表';

-- 3. 数据源相关表
-- ------------------------------------

-- 数据源表
CREATE TABLE `lc_datasource` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `tenant_id` varchar(32) NOT NULL COMMENT '租户ID',
  `ds_code` varchar(50) NOT NULL COMMENT '数据源编码',
  `ds_name` varchar(100) NOT NULL COMMENT '数据源名称',
  `ds_type` varchar(20) NOT NULL COMMENT '数据源类型：API/DATABASE/STATIC',
  `config` json COMMENT '数据源配置',
  `remark` varchar(255) COMMENT '备注',
  `status` tinyint NOT NULL DEFAULT '1' COMMENT '状态：0-禁用，1-启用',
  `creator` varchar(50) NOT NULL COMMENT '创建人',
  `updater` varchar(50) COMMENT '更新人',
  `delete_flag` tinyint(1) NOT NULL DEFAULT '0' COMMENT '删除标识1是0否',
  `gmt_create` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `gmt_modified` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tenant_ds` (`tenant_id`, `ds_code`, `delete_flag`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='数据源表';

-- 4. 字段相关表
-- ------------------------------------

-- 字段配置表
CREATE TABLE `lc_field_config` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `tenant_id` varchar(32) NOT NULL COMMENT '租户ID',
  `page_code` varchar(50) NOT NULL COMMENT '关联的页面编码',
  `version` varchar(32) NOT NULL COMMENT '版本号',
  `field_code` varchar(50) NOT NULL COMMENT '字段编码',
  `field_name` varchar(100) NOT NULL COMMENT '字段名称',
  `field_type` varchar(20) NOT NULL COMMENT '字段类型',
  `component_code` varchar(50) COMMENT '使用的组件编码',
  `validation_rules` json COMMENT '验证规则',
  `props` json COMMENT '组件属性配置',
  `data_binding` json COMMENT '数据绑定配置',
  `remark` varchar(255) COMMENT '备注',
  `sort_order` int NOT NULL DEFAULT '0' COMMENT '排序号',
  `status` tinyint NOT NULL DEFAULT '1' COMMENT '状态：0-禁用，1-启用',
  `creator` varchar(50) NOT NULL COMMENT '创建人',
  `updater` varchar(50) COMMENT '更新人',
  `delete_flag` tinyint(1) NOT NULL DEFAULT '0' COMMENT '删除标识1是0否',
  `gmt_create` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `gmt_modified` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tenant_field_version` (`tenant_id`, `page_code`, `version`, `field_code`, `delete_flag`),
  KEY `idx_tenant_page_version` (`tenant_id`, `page_code`, `version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='字段配置表';

-- 5. 事件相关表
-- ------------------------------------

-- 事件配置表
CREATE TABLE `lc_event_config` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `tenant_id` varchar(32) NOT NULL COMMENT '租户ID',
  `page_code` varchar(50) NOT NULL COMMENT '页面编码',
  `version` varchar(32) NOT NULL COMMENT '版本号',
  `source_instance_id` varchar(50) NOT NULL COMMENT '源组件实例ID',
  `event_type` varchar(50) NOT NULL COMMENT '事件类型',
  `target_instance_id` varchar(50) NOT NULL COMMENT '目标组件实例ID',
  `action_type` varchar(50) NOT NULL COMMENT '动作类型',
  `params` json COMMENT '参数配置',
  `remark` varchar(255) COMMENT '备注',
  `creator` varchar(50) NOT NULL COMMENT '创建人',
  `updater` varchar(50) COMMENT '更新人',
  `delete_flag` tinyint(1) NOT NULL DEFAULT '0' COMMENT '删除标识1是0否',
  `gmt_create` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `gmt_modified` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_tenant_page_version` (`tenant_id`, `page_code`, `version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='事件配置表';

-- 6. 模板相关表
-- ------------------------------------

-- 页面模板表
CREATE TABLE `lc_page_template` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `tenant_id` varchar(32) NOT NULL COMMENT '租户ID',
  `template_code` varchar(50) NOT NULL COMMENT '模板编码',
  `template_name` varchar(100) NOT NULL COMMENT '模板名称',
  `page_type` varchar(20) NOT NULL COMMENT '页面类型：FORM/LIST/DETAIL',
  `thumbnail` varchar(255) COMMENT '缩略图地址',
  `layout_config` json COMMENT '页面布局配置',
  `is_system` tinyint NOT NULL DEFAULT '0' COMMENT '是否系统模板：0-否，1-是',
  `remark` varchar(255) COMMENT '备注',
  `status` tinyint NOT NULL DEFAULT '1' COMMENT '状态：0-禁用，1-启用',
  `creator` varchar(50) NOT NULL COMMENT '创建人',
  `updater` varchar(50) COMMENT '更新人',
  `delete_flag` tinyint(1) NOT NULL DEFAULT '0' COMMENT '删除标识1是0否',
  `gmt_create` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `gmt_modified` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tenant_template` (`tenant_id`, `template_code`, `delete_flag`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='页面模板表';

-- 模板组件关系表
CREATE TABLE `lc_template_component` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `tenant_id` varchar(32) NOT NULL COMMENT '租户ID',
  `template_code` varchar(50) NOT NULL COMMENT '模板编码',
  `component_instance_id` varchar(50) NOT NULL COMMENT '组件实例ID',
  `parent_instance_id` varchar(50) COMMENT '父组件实例ID',
  `component_code` varchar(50) NOT NULL COMMENT '组件编码',
  `props` json COMMENT '组件属性配置',
  `sort_order` int NOT NULL DEFAULT '0' COMMENT '同级排序号',
  `creator` varchar(50) NOT NULL COMMENT '创建人',
  `updater` varchar(50) COMMENT '更新人',
  `delete_flag` tinyint(1) NOT NULL DEFAULT '0' COMMENT '删除标识1是0否',
  `gmt_create` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `gmt_modified` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tenant_template_instance` (`tenant_id`, `template_code`, `component_instance_id`, `delete_flag`),
  KEY `idx_tenant_template` (`tenant_id`, `template_code`),
  KEY `idx_tenant_parent` (`tenant_id`, `parent_instance_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='模板组件关系表';

-- 组件模板表
CREATE TABLE `lc_component_template` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `tenant_id` varchar(32) NOT NULL COMMENT '租户ID',
  `template_code` varchar(50) NOT NULL COMMENT '模板编码',
  `template_name` varchar(100) NOT NULL COMMENT '模板名称',
  `component_code` varchar(50) NOT NULL COMMENT '组件编码',
  `category` varchar(50) NOT NULL COMMENT '模板分类',
  `thumbnail` varchar(255) COMMENT '缩略图地址',
  `props` json COMMENT '组件属性配置',
  `is_system` tinyint NOT NULL DEFAULT '0' COMMENT '是否系统模板：0-否，1-是',
  `remark` varchar(255) COMMENT '备注',
  `status` tinyint NOT NULL DEFAULT '1' COMMENT '状态：0-禁用，1-启用',
  `creator` varchar(50) NOT NULL COMMENT '创建人',
  `updater` varchar(50) COMMENT '更新人',
  `delete_flag` tinyint(1) NOT NULL DEFAULT '0' COMMENT '删除标识1是0否',
  `gmt_create` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `gmt_modified` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tenant_template` (`tenant_id`, `template_code`, `delete_flag`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='组件模板表';
