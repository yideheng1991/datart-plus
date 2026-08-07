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

import { Col, InputNumber, Row, Typography } from 'antd';
import { ChartDataSectionType } from 'app/constants';
import { ChartStyleConfig } from 'app/types/ChartConfig';
import {
  getColumnRenderName,
  getValueByColumnKey,
} from 'app/utils/chartHelper';
import { FC, memo } from 'react';
import styled from 'styled-components';
import { BW } from '../Basic/components/BasicWrapper';
import { ItemLayoutProps } from '../types';
import { itemLayoutComparer } from '../utils';

type RadarIndicatorMaxValue = {
  key: string;
  max: number;
};

const RadarIndicatorPanel: FC<ItemLayoutProps<ChartStyleConfig>> = memo(
  ({
    ancestors,
    translate: t = title => title,
    data,
    dataConfigs,
    onChange,
  }) => {
    const aggregateFields = (dataConfigs || [])
      .filter(config => config.type === ChartDataSectionType.Aggregate)
      .flatMap(config => config.rows || []);
    const maxValues: RadarIndicatorMaxValue[] = Array.isArray(data.value)
      ? data.value
      : [];

    const handleMaxChange = (
      fieldKey: string,
      value: number | string | null | undefined,
    ) => {
      const nextMaxValues = maxValues.filter(item => item.key !== fieldKey);
      const max = Number(value);

      if (Number.isFinite(max) && max > 0) {
        nextMaxValues.push({ key: fieldKey, max });
      }
      onChange?.(ancestors, nextMaxValues);
    };

    return (
      <BW label={t(data.label, true)}>
        <StyledRadarIndicatorPanel>
          {!aggregateFields.length && (
            <Typography.Text type="secondary">
              {t('radarAxis.noMetrics', true)}
            </Typography.Text>
          )}
          {aggregateFields.map(field => {
            const fieldKey = getValueByColumnKey(field);
            const fieldName = getColumnRenderName(field);
            const configuredMax = maxValues.find(
              item => item.key === fieldKey,
            )?.max;

            return (
              <Row key={fieldKey} gutter={8} align="middle">
                <Col span={13}>
                  <Typography.Text
                    ellipsis={{ tooltip: fieldName }}
                    style={{ width: '100%' }}
                  >
                    {fieldName}
                  </Typography.Text>
                </Col>
                <Col span={11}>
                  <InputNumber
                    className="datart-ant-input-number"
                    disabled={data.disabled}
                    min={0}
                    placeholder={t('radarAxis.autoMax', true)}
                    value={configuredMax}
                    onChange={value => handleMaxChange(fieldKey, value)}
                  />
                </Col>
              </Row>
            );
          })}
        </StyledRadarIndicatorPanel>
      </BW>
    );
  },
  itemLayoutComparer,
);

export default RadarIndicatorPanel;

const StyledRadarIndicatorPanel = styled.div`
  width: 100%;

  .ant-row + .ant-row {
    margin-top: 8px;
  }

  .datart-ant-input-number {
    width: 100%;
  }
`;
