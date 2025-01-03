export namespace ComponentApi {
  /** 组件记录 */
  export interface ComponentRecord {
    id: number;
    tenantId: string;
    componentCode: string;
    componentName: string;
    componentType: 'CONTAINER' | 'FORM' | 'DISPLAY' | 'ACTION';
    category: string;
    icon?: string;
    isContainer: boolean;
    propsSchema: Record<string, any>;
    defaultProps: Record<string, any>;
    remark?: string;
    status: 0 | 1;
  }
} 
