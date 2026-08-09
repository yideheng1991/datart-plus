/**
 * Datart
 *
 * Copyright 2021
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Widget } from 'app/pages/DashBoardPage/types/widgetTypes';
import { ChartStyleConfig } from 'app/types/ChartConfig';
import { DATART_TRANSLATE_HOLDER } from 'globalConstants';
import get from 'lodash/get';

/**
 * 获取样式配置的扁平化键值映射
 */
export interface StyleKeyValue {
  key: string;
  path: string[]; // 完整路径，如 ['backgroundGroup', 'color']
  config: ChartStyleConfig;
}

/**
 * 扁平化样式配置，将嵌套结构转换为扁平键值对
 */
export function flattenStyleConfig(
  configs: ChartStyleConfig[],
  parentPath: string[] = [],
): StyleKeyValue[] {
  const result: StyleKeyValue[] = [];

  configs.forEach((config, index) => {
    const currentPath = [...parentPath, config.key];

    // 如果是分组，递归处理子项
    if (config.comType === 'group' && config.rows) {
      result.push(...flattenStyleConfig(config.rows, currentPath));
    } else {
      // 叶子节点，添加到结果
      result.push({
        key: config.key,
        path: currentPath,
        config,
      });
    }
  });

  return result;
}

/**
 * 获取widget的样式配置扁平化映射
 */
export function getWidgetStyleMap(widget: Widget): Map<string, StyleKeyValue> {
  const styleMap = new Map<string, StyleKeyValue>();
  const props = widget.config.customConfig.props || [];

  flattenStyleConfig(props).forEach(item => {
    styleMap.set(item.key, item);
  });

  return styleMap;
}

/**
 * 获取选中widget的共有样式schema
 * 返回所有widget都支持的样式字段
 */
export function getCommonStyleSchema(widgets: Widget[]): ChartStyleConfig[] {
  if (widgets.length === 0) return [];
  if (widgets.length === 1) {
    // 单个widget，返回其所有样式配置
    return widgets[0].config.customConfig.props || [];
  }

  // 获取第一个widget的样式映射作为基准
  const baseStyleMap = getWidgetStyleMap(widgets[0]);
  const commonKeys = new Set<string>(baseStyleMap.keys());

  // 与其他widget比较，取交集
  for (let i = 1; i < widgets.length; i++) {
    const currentStyleMap = getWidgetStyleMap(widgets[i]);
    const currentKeys = new Set<string>(currentStyleMap.keys());

    // 取交集
    for (const key of commonKeys) {
      if (!currentKeys.has(key)) {
        commonKeys.delete(key);
      }
    }
  }

  // 根据共有key重建样式配置结构
  const baseProps = widgets[0].config.customConfig.props || [];
  return rebuildStyleConfigByKeys(baseProps, Array.from(commonKeys));
}

/**
 * 根据key列表重建样式配置结构
 */
function rebuildStyleConfigByKeys(
  baseConfigs: ChartStyleConfig[],
  keys: string[],
): ChartStyleConfig[] {
  const keySet = new Set(keys);

  return baseConfigs
    .map(config => {
      if (config.comType === 'group' && config.rows) {
        // 处理分组
        const filteredRows = rebuildStyleConfigByKeys(config.rows, keys);
        if (filteredRows.length === 0) {
          return null;
        }
        return {
          ...config,
          rows: filteredRows,
        };
      } else {
        // 叶子节点，检查是否在key集合中
        return keySet.has(config.key) ? config : null;
      }
    })
    .filter(Boolean) as ChartStyleConfig[];
}

/**
 * 获取选中widget在指定路径的共有样式值
 * 支持混合值状态：
 * - 如果所有widget的值相同，返回该值
 * - 如果值不同，返回特殊标记表示混合状态
 * - 如果某个widget没有该字段，返回未设置状态
 */
export function getCommonStyleValue(
  widgets: Widget[],
  path: string[],
): {
  value: any;
  isMixed: boolean;
  isUnset: boolean;
} {
  if (widgets.length === 0) {
    return { value: undefined, isMixed: false, isUnset: true };
  }

  const values: any[] = [];
  let hasUnset = false;

  // 收集所有widget在该路径的值
  for (const widget of widgets) {
    const value = getStyleValueByPath(widget, path);
    if (value === undefined) {
      hasUnset = true;
    } else {
      values.push(value);
    }
  }

  // 处理混合状态
  if (hasUnset && values.length === 0) {
    // 所有widget都没有设置该值
    return { value: undefined, isMixed: false, isUnset: true };
  } else if (hasUnset) {
    // 部分widget没有设置该值
    return { value: undefined, isMixed: true, isUnset: false };
  }

  // 检查所有值是否相同
  const firstValue = values[0];
  const allSame = values.every(value => {
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value) === JSON.stringify(firstValue);
    }
    return value === firstValue;
  });

  if (allSame) {
    return { value: firstValue, isMixed: false, isUnset: false };
  } else {
    return { value: undefined, isMixed: true, isUnset: false };
  }
}

/**
 * 根据路径获取widget的样式值
 */
function getStyleValueByPath(widget: Widget, path: string[]): any {
  let currentConfigs: ChartStyleConfig[] =
    widget.config.customConfig.props || [];

  for (let i = 0; i < path.length; i++) {
    const key = path[i];
    const config = currentConfigs.find(c => c.key === key);

    if (!config) {
      return undefined;
    }

    if (i === path.length - 1) {
      // 到达目标路径，返回值
      return config.value;
    }

    if (config.comType === 'group' && config.rows) {
      // 继续向下查找
      currentConfigs = config.rows;
    } else {
      return undefined;
    }
  }

  return undefined;
}

/**
 * 批量更新widget样式
 * 返回更新后的widget配置
 */
export function batchUpdateWidgetStyle(
  widgets: Widget[],
  updates: Array<{
    path: string[];
    value: any;
  }>,
): Widget[] {
  return widgets.map(widget => {
    let newProps = [...(widget.config.customConfig.props || [])];

    updates.forEach(({ path, value }) => {
      newProps = updateStyleConfigByPath(newProps, path, value);
    });

    return {
      ...widget,
      config: {
        ...widget.config,
        customConfig: {
          ...widget.config.customConfig,
          props: newProps,
        },
      },
    };
  });
}

/**
 * 根据路径更新样式配置
 */
function updateStyleConfigByPath(
  configs: ChartStyleConfig[],
  path: string[],
  value: any,
): ChartStyleConfig[] {
  return configs.map(config => {
    if (config.key === path[0]) {
      if (path.length === 1) {
        // 更新当前配置
        return {
          ...config,
          value,
        };
      } else if (config.comType === 'group' && config.rows) {
        // 递归更新子配置
        return {
          ...config,
          rows: updateStyleConfigByPath(config.rows, path.slice(1), value),
        };
      }
    }
    return config;
  });
}

/**
 * 检查widget是否支持指定的样式字段
 */
export function hasStyleField(widget: Widget, path: string[]): boolean {
  return getStyleValueByPath(widget, path) !== undefined;
}

/**
 * 获取支持批量更新的样式字段
 * 排除标题名称等不支持批量设置的字段
 */
export function getBatchableStyleFields(widgets: Widget[]): string[] {
  const commonSchema = getCommonStyleSchema(widgets);
  const flattened = flattenStyleConfig(commonSchema);

  // 排除标题名称等不支持批量设置的字段
  return flattened
    .filter(item => {
      // 排除标题名称字段
      if (item.path.includes('name') && item.path.includes('title')) {
        return false;
      }
      // 可以根据需要添加其他排除规则
      return true;
    })
    .map(item => item.key);
}

/**
 * 用 widget 的 i18ns 配置预翻译 schema 中所有 label
 * 支持 @global@ 前缀的 label（去掉前缀后查找）
 * 返回翻译后的新 schema（immutable）
 */
export function resolveSchemaLabels(
  schema: ChartStyleConfig[],
  i18ns: Array<{ lang: string; translation: any }>,
  language: string = 'zh-CN',
  globalTranslate?: (key: string) => string,
): ChartStyleConfig[] {
  const langTrans = i18ns?.find(c => c.lang.includes(language))?.translation;

  const resolveLabel = (label: string): string => {
    if (!langTrans) return label;

    // 如果包含 @global@ 前缀，去掉前缀后直接查找
    if (label.includes(DATART_TRANSLATE_HOLDER)) {
      const cleanKey = label.replace(`${DATART_TRANSLATE_HOLDER}.`, '');
      const trans = get(langTrans, cleanKey);
      if (trans) return trans;
      if (globalTranslate) return globalTranslate(cleanKey);
      return label;
    }

    // 直接在 langTrans 中查找（支持点号分隔的嵌套 key）
    const trans = get(langTrans, label);
    if (trans) return trans;

    // 回退：使用全局翻译
    if (globalTranslate) return globalTranslate(label);

    return label;
  };

  const resolveNode = (config: ChartStyleConfig): ChartStyleConfig => {
    const resolvedLabel = config.label
      ? resolveLabel(config.label)
      : config.label;

    if (config.comType === 'group' && config.rows) {
      return {
        ...config,
        label: resolvedLabel,
        rows: config.rows.map(resolveNode),
      };
    }

    // 处理叶子节点的 options.items 中的 label
    let resolvedOptions = config.options;
    if (config.options?.items) {
      resolvedOptions = {
        ...config.options,
        items: config.options.items.map((item: any) => ({
          ...item,
          label: item.label ? resolveLabel(item.label) : item.label,
        })),
      };
    }

    return {
      ...config,
      label: resolvedLabel,
      options: resolvedOptions,
    };
  };

  return schema.map(resolveNode);
}
