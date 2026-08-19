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

import { CheckOutlined } from '@ant-design/icons';
import { Divider, Menu, Radio, Select, Space } from 'antd';
import {
  AggregateFieldActionType,
  AggregateFieldSubAggregateType,
  ChartDataSectionFieldActionType,
  ChartDataViewFieldCategory,
  ComparisonReturnType,
  DataViewFieldType,
} from 'app/constants';
import useI18NPrefix from 'app/hooks/useI18NPrefix';
import { ChartDataSectionField } from 'app/types/ChartConfig';
import { updateBy } from 'app/utils/mutation';
import { FC, useState } from 'react';

const statisticalAggregateTypes: AggregateFieldActionType[] = [
  AggregateFieldActionType.Median,
  AggregateFieldActionType.Quartile1,
  AggregateFieldActionType.Quartile3,
];

const comparisonAggregateTypes: AggregateFieldActionType[] = [
  AggregateFieldActionType.Yoy,
  AggregateFieldActionType.Mom,
];

const AggregationAction: FC<{
  config: ChartDataSectionField;
  onConfigChange: (
    config: ChartDataSectionField,
    needRefresh?: boolean,
  ) => void;
  mode?: 'menu';
  // 图表所有字段，用于自动识别时间维度
  allFields?: ChartDataSectionField[];
}> = ({ config, onConfigChange, mode, allFields }) => {
  const t = useI18NPrefix(`viz.common.enum.aggregateTypes`);
  const tc = useI18NPrefix(`viz.common.enum.comparisonReturnTypes`);
  const actionNeedNewRequest = true;
  const [aggregate, setAggregate] = useState(config?.aggregate);

  const aggregateOptions = AggregateFieldSubAggregateType[
    ChartDataSectionFieldActionType.Aggregate
  ]?.filter(
    agg =>
      config.type === DataViewFieldType.NUMERIC ||
      (!statisticalAggregateTypes.includes(agg) &&
        !comparisonAggregateTypes.includes(agg)),
  );

  // 自动识别时间维度字段：优先日期粒度计算字段(内层实际按粒度聚合输出的字段)，
  // 其次 DATE 类型字段。粒度函数字段的 colName 是合成名(如 '统计日期@date_level_delimiter@AGG_DATE_MONTH')，
  // 只有用它才能与内层 GROUP BY 输出的周期列匹配。
  const timeDimension =
    allFields?.find(
      f => f.category === ChartDataViewFieldCategory.DateLevelComputedField,
    ) || allFields?.find(f => f.type === DataViewFieldType.DATE);

  const isComparisonSelected =
    aggregate === AggregateFieldActionType.Yoy ||
    aggregate === AggregateFieldActionType.Mom;

  const onChange = selectedValue => {
    const newConfig = updateBy(config, draft => {
      draft.aggregate = selectedValue;
      if (comparisonAggregateTypes.includes(selectedValue)) {
        // 对粒度函数字段(如 AGG_DATE_MONTH)，内层 GROUP BY 输出列名是合成名(如 '统计日期@date_level_delimiter@AGG_DATE_MONTH')，
        // 因此 compareColumn 必须用 colName才能与 group 的 column 匹配，不能用 field(原始列名)。
        const compareCol = timeDimension ? timeDimension.colName : undefined;
        draft.comparison = {
          // 默认返回增长率(GROWTH)
          returnType:
            draft.comparison?.returnType || ComparisonReturnType.Growth,
          compareColumn: draft.comparison?.compareColumn || compareCol,
          granularity:
            draft.comparison?.granularity ||
            parseGranularity(timeDimension?.expression),
          baseAggregator:
            draft.comparison?.baseAggregator || AggregateFieldActionType.Sum,
        };
      }
    });
    setAggregate(selectedValue);
    onConfigChange?.(newConfig, actionNeedNewRequest);
  };

  // 从时间维度表达式(如 AGG_DATE_MONTH(col))中解析粒度
  const parseGranularity = (
    expr,
  ): 'YEAR' | 'QUARTER' | 'MONTH' | 'WEEK' | 'DAY' | undefined => {
    if (!expr) {
      return undefined;
    }
    const match = String(expr).match(
      /AGG_DATE_(YEAR|QUARTER|MONTH|WEEK|DAY)/,
    );
    return match?.[1] as
      | 'YEAR'
      | 'QUARTER'
      | 'MONTH'
      | 'WEEK'
      | 'DAY'
      | undefined;
  };

  const onReturnTypeChange = returnType => {
    const newConfig = updateBy(config, draft => {
      draft.comparison = {
        ...(draft.comparison || {}),
        returnType,
      };
    });
    onConfigChange?.(newConfig, actionNeedNewRequest);
  };

  const renderReturnTypeConfig = () => {
    if (!isComparisonSelected || mode !== 'menu') {
      return null;
    }
    return (
      <Menu.Item key="comparison-return-type" disabled>
        <Divider style={{ margin: '4px 0' }} />
        <Space direction="vertical" style={{ width: '100%' }}>
          <span style={{ fontSize: 12, color: '#8F959E' }}>
            {tc('returnType')}
          </span>
          <Select
            size="small"
            style={{ width: '100%' }}
            value={config?.comparison?.returnType || ComparisonReturnType.Value}
            onChange={onReturnTypeChange}
          >
            {Object.values(ComparisonReturnType).map(rt => (
              <Select.Option key={rt} value={rt}>
                {tc(rt)}
              </Select.Option>
            ))}
          </Select>
        </Space>
      </Menu.Item>
    );
  };

  const renderOptions = mode => {
    if (mode === 'menu') {
      return (
        <>
          {aggregateOptions?.map(agg => {
            return (
              <Menu.Item
                key={agg}
                eventKey={agg}
                icon={aggregate === agg ? <CheckOutlined /> : ''}
                onClick={() => onChange(agg)}
              >
                {t(agg)}
              </Menu.Item>
            );
          })}
          {renderReturnTypeConfig()}
        </>
      );
    }

    return (
      <Radio.Group onChange={e => onChange(e.target?.value)} value={aggregate}>
        <Space direction="vertical">
          {aggregateOptions?.map(agg => {
            return (
              <Radio key={agg} value={agg}>
                {t(agg)}
              </Radio>
            );
          })}
        </Space>
      </Radio.Group>
    );
  };

  return renderOptions(mode);
};

export default AggregationAction;
