/**
 * MultiStylePanel - 批量样式配置面板
 * 
 * 当选中多个 widget 时，显示它们的共有样式字段，
 * 支持修改后批量写入所有选中组件，且支持 undo/redo。
 */

import { Collapse } from 'antd';
import { CollapseHeader } from 'app/components/FormGenerator';
import { FormGroupLayoutMode } from 'app/components/FormGenerator/constants';
import GroupLayout from 'app/components/FormGenerator/Layout/GroupLayout';
import { Widget } from 'app/pages/DashBoardPage/types/widgetTypes';
import { ChartStyleConfig } from 'app/types/ChartConfig';
import { CloneValueDeep } from 'utils/object';
import { FC, memo, useCallback, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { editBoardStackActions } from '../../slice';
import {
  getCommonStyleSchema,
  flattenStyleConfig,
  resolveSchemaLabels,
  StyleKeyValue,
} from '../../../../utils/styleUtils';
import widgetManagerInstance from '../../../../components/WidgetManager';

const { Panel } = Collapse;

/**
 * 为批量编辑渲染注入混合值标记
 * 深度克隆 schema，对混合值的字段设置 value = undefined
 */
function injectMixedValueMeta(
  schema: ChartStyleConfig[],
  widgetStyleMaps: Array<Map<string, StyleKeyValue>>,
): ChartStyleConfig[] {
  return schema.map(config => {
    if (config.comType === 'group' && config.rows) {
      return {
        ...config,
        rows: injectMixedValueMeta(config.rows, widgetStyleMaps),
      };
    }

    const key = config.key;
    let allSame = true;
    let firstValue: any;
    let hasAnyValue = false;

    for (const styleMap of widgetStyleMaps) {
      const item = styleMap.get(key);
      if (!item) {
        allSame = false;
        break;
      }
      const curValue = item.config.value;
      hasAnyValue = true;
      if (firstValue === undefined) {
        firstValue = curValue;
      } else {
        if (
          typeof firstValue === 'object' &&
          firstValue !== null
        ) {
          if (JSON.stringify(firstValue) !== JSON.stringify(curValue)) {
            allSame = false;
            break;
          }
        } else if (firstValue !== curValue) {
          allSame = false;
          break;
        }
      }
    }

    if (!allSame) {
      // 混合值：value 设 undefined，保留 isMixed 标记
      return {
        ...config,
        value: undefined,
        options: {
          ...(config.options || {}),
          __isMixed: true,
        },
      };
    }

    return {
      ...config,
      value: CloneValueDeep(firstValue),
    };
  });
}

export const MultiStylePanel: FC<{
  selectedWidgets: Widget[];
}> = memo(({ selectedWidgets }) => {
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();

  // 获取第一个 widget 的国际化配置（用于翻译样式标签）
  const i18ns = useMemo(() => {
    if (selectedWidgets.length === 0) return [];
    const firstWidget = selectedWidgets[0];
    const widgetTypeId = firstWidget.config.originalType;
    return widgetManagerInstance.meta(widgetTypeId).i18ns || [];
  }, [selectedWidgets]);

  // 计算共有样式 schema
  const commonSchema = useMemo(
    () => getCommonStyleSchema(selectedWidgets),
    [selectedWidgets],
  );

  // 预翻译 schema 中所有 label
  const translatedSchema = useMemo(
    () => resolveSchemaLabels(commonSchema, i18ns, i18n.language, t),
    [commonSchema, i18ns, i18n.language, t],
  );

  // 为所有选中的 widget 构建样式扁平化 Map
  const widgetStyleMaps = useMemo(() => {
    return selectedWidgets.map(w => {
      const map = new Map<string, StyleKeyValue>();
      const props = w.config.customConfig.props || [];
      flattenStyleConfig(props).forEach(item => {
        map.set(item.key, item);
      });
      return map;
    });
  }, [selectedWidgets]);

  // 注入混合值标记
  const displaySchema = useMemo(
    () => injectMixedValueMeta(translatedSchema, widgetStyleMaps),
    [translatedSchema, widgetStyleMaps],
  );

  // 批量更新处理：基于 key 更新所有选中组件
  const handleStyleChange = useCallback(
    (
      ancestors: number[],
      configItem: ChartStyleConfig,
      needRefresh?: boolean,
    ) => {
      const widgetIds = selectedWidgets.map(w => w.id);

      // 只对实际有 key 的叶子配置项进行批量更新
      if (configItem.key && configItem.comType !== 'group') {
        dispatch(
          editBoardStackActions.batchUpdateWidgetStyle({
            widgetIds,
            updates: [{ key: configItem.key, value: configItem.value }],
          }),
        );
      }
    },
    [dispatch, selectedWidgets],
  );

  // 翻译函数：优先使用全局 i18n，预翻译的 label 找不到 key 时会原样返回
  const translate = useCallback(
    (label: string, disablePrefix?: boolean) => {
      // 对于 @global@ 前缀的 key，去掉前缀后查找
      if (label.includes('@global@')) {
        const cleanKey = label.replace('@global@.', '');
        return t(cleanKey);
      }
      return disablePrefix ? t(label) : t(`viz.board.setting.${label}`);
    },
    [t],
  );

  return (
    <StyledWrapper onClick={e => e.stopPropagation()}>
      <h3 style={{ textAlign: 'center', padding: '8px 0' }}>
        {t('viz.board.setting.batchStyle')} ({selectedWidgets.length}{' '}
        {t('viz.board.setting.selected')})
      </h3>
      <Collapse className="" ghost>
        {displaySchema
          ?.filter(c => !Boolean(c.hidden))
          .map((c, index) => (
            <Panel
              header={<CollapseHeader title={c.label} />}
              key={c.key}
            >
              <GroupLayout
                ancestors={[index]}
                mode={
                  c.comType === 'group'
                    ? FormGroupLayoutMode.INNER
                    : FormGroupLayoutMode.OUTER
                }
                data={c}
                translate={translate}
                dataConfigs={[]}
                onChange={handleStyleChange}
              />
            </Panel>
          ))}
      </Collapse>
    </StyledWrapper>
  );
});

const StyledWrapper = styled.div`
  width: 100%;
  min-height: 0;
  overflow-y: auto;
`;