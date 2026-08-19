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

import { Select } from 'antd';
import { AggregateFieldActionType, DataViewFieldType } from 'app/constants';
import useI18NPrefix from 'app/hooks/useI18NPrefix';
import { ChartDataSectionField } from 'app/types/ChartConfig';
import { FC, memo } from 'react';

const FilterAggregateConfiguration: FC<{
  config: ChartDataSectionField;
  aggregate?: string;
  onChange: (aggregate: string) => void;
}> = memo(({ config, aggregate, onChange }) => {
  const t = useI18NPrefix('viz.common.enum.aggregateTypes');

  // 同环比(YOY/MOM)属于度量对比聚合方式，不应作为过滤器字段的聚合选项，
  // 因此数值型字段在过滤器聚合下拉中需排除这两种类型
  const comparisonAggregateTypes = [
    AggregateFieldActionType.Yoy,
    AggregateFieldActionType.Mom,
  ];

  const getAggregateByModelType = () => {
    switch (config?.type) {
      case DataViewFieldType.STRING:
      case DataViewFieldType.DATE:
        return [AggregateFieldActionType.None, AggregateFieldActionType.Count];
      case DataViewFieldType.NUMERIC:
        return Object.values(AggregateFieldActionType).filter(
          agg => !comparisonAggregateTypes.includes(agg),
        );
      default:
        return [AggregateFieldActionType.None];
    }
  };

  return (
    <Select value={aggregate} onChange={onChange}>
      {getAggregateByModelType().map(agg => (
        <Select.Option key={agg} value={agg}>
          {t(agg)}
        </Select.Option>
      ))}
    </Select>
  );
});

export default FilterAggregateConfiguration;
