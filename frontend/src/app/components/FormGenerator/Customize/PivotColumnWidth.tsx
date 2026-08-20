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

import { Button, Col, InputNumber, Modal, Row, Typography } from 'antd';
import { ChartDataSectionType } from 'app/constants';
import { ChartStyleConfig } from 'app/types/ChartConfig';
import {
  getColumnRenderName,
  getValueByColumnKey,
} from 'app/utils/chartHelper';
import { FC, memo, useState } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { BW } from '../Basic/components/BasicWrapper';
import { ItemLayoutProps } from '../types';
import { itemLayoutComparer } from '../utils';

export type PivotColumnWidthSetting = {
  key: string;
  width?: number;
};

export type PivotColumnWidthValue = {
  width?: number;
  columnWidths?: PivotColumnWidthSetting[];
};

// 兼容旧配置：dataWidth 原为 number，现为 { width, columnWidths }
const normalizeValue = (value: unknown): PivotColumnWidthValue => {
  if (typeof value === 'number') {
    return { width: value, columnWidths: [] };
  }
  if (value && typeof value === 'object') {
    const obj = value as PivotColumnWidthValue;
    return {
      width: obj.width,
      columnWidths: Array.isArray(obj.columnWidths) ? obj.columnWidths : [],
    };
  }
  return {};
};

const PivotColumnWidth: FC<ItemLayoutProps<ChartStyleConfig>> = memo(
  ({
    ancestors,
    translate: t = title => title,
    data,
    dataConfigs,
    onChange,
  }) => {
    const value = normalizeValue(data.value);
    const list: PivotColumnWidthSetting[] = value.columnWidths || [];
    const aggregateFields = (dataConfigs || [])
      .filter(config => config.type === ChartDataSectionType.Aggregate)
      .flatMap(config => config.rows || []);
    const [visible, setVisible] = useState(false);
    const [tempList, setTempList] = useState<PivotColumnWidthSetting[]>([]);

    const open = () => {
      setTempList(list.map(item => ({ ...item })));
      setVisible(true);
    };

    const handleOk = () => {
      onChange?.(ancestors, { width: value.width, columnWidths: tempList });
      setVisible(false);
    };

    const handleFieldChange = (
      fieldKey: string,
      patch: Partial<PivotColumnWidthSetting>,
    ) => {
      const current =
        tempList.find(item => item.key === fieldKey) || { key: fieldKey };
      const next = { ...current, ...patch };
      if (next.width === undefined || next.width === null) {
        delete next.width;
      }
      setTempList([...tempList.filter(item => item.key !== fieldKey), next]);
    };

    return (
      <BW label={t(data.label, true)}>
        <StyledPivotColumnWidth>
          <InputNumber
            className="datart-ant-input-number"
            min={40}
            value={value.width}
            onChange={nextWidth => {
              const width = Number(nextWidth);
              onChange?.(ancestors, {
                width:
                  Number.isFinite(width) && width > 0 ? width : undefined,
                columnWidths: list,
              });
            }}
          />
          <Button size="small" onClick={open}>
            {t('pivot.column.configure', true)}
            {list.length > 0 ? ` (${list.length})` : ''}
          </Button>
          <PivotColumnWidthModalGlobalStyle />
          <Modal
            className="pivot-column-width-modal"
            title={t(data.label, true)}
            open={visible}
            onOk={handleOk}
            onCancel={() => setVisible(false)}
            width={520}
          >
            {!aggregateFields.length && (
              <Typography.Text type="secondary">
                {t('pivot.column.noMetrics', true)}
              </Typography.Text>
            )}
            {aggregateFields.map(field => {
              const fieldKey = getValueByColumnKey(field);
              const fieldName = getColumnRenderName(field);
              const item: PivotColumnWidthSetting =
                tempList.find(i => i.key === fieldKey) || {
                  key: fieldKey,
                };
              return (
                <Row
                  key={fieldKey}
                  gutter={8}
                  align="middle"
                  className="pivot-column-row"
                >
                  <Col span={14}>
                    <Typography.Text
                      ellipsis={{ tooltip: fieldName }}
                      style={{ width: '100%' }}
                    >
                      {fieldName}
                    </Typography.Text>
                  </Col>
                  <Col span={8}>
                    <InputNumber
                      className="datart-ant-input-number"
                      min={40}
                      placeholder={t('pivot.column.widthPlaceholder', true)}
                      value={item.width}
                      onChange={valueItem => {
                        const width = Number(valueItem);
                        handleFieldChange(fieldKey, {
                          width:
                            Number.isFinite(width) && width > 0
                              ? width
                              : undefined,
                        });
                      }}
                    />
                  </Col>
                </Row>
              );
            })}
          </Modal>
        </StyledPivotColumnWidth>
      </BW>
    );
  },
  itemLayoutComparer,
);

export default PivotColumnWidth;

const StyledPivotColumnWidth = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;

  .datart-ant-input-number {
    width: 100%;
  }
`;

const PivotColumnWidthModalGlobalStyle = createGlobalStyle`
  .pivot-column-width-modal .pivot-column-row {
    padding: 4px 0;
  }

  .pivot-column-width-modal .pivot-column-row + .pivot-column-row {
    margin-top: 8px;
    border-top: 1px solid rgba(0, 0, 0, 0.08);
  }
`;
