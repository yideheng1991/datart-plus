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

import { Button, Col, InputNumber, Modal, Row, Switch, Typography } from 'antd';
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

export type PivotColumnSetting = {
  key: string;
  width?: number;
  totals?: boolean;
};

type PivotColumnSettingsMode = 'width' | 'totals';

const PivotColumnSettings: FC<ItemLayoutProps<ChartStyleConfig>> = memo(
  ({
    ancestors,
    translate: t = title => title,
    data,
    dataConfigs,
    onChange,
  }) => {
    const mode: PivotColumnSettingsMode =
      (data.options as any)?.mode || 'width';
    const aggregateFields = (dataConfigs || [])
      .filter(config => config.type === ChartDataSectionType.Aggregate)
      .flatMap(config => config.rows || []);
    const list: PivotColumnSetting[] = Array.isArray(data.value)
      ? data.value
      : [];
    const [visible, setVisible] = useState(false);
    const [tempList, setTempList] = useState<PivotColumnSetting[]>([]);

    const open = () => {
      setTempList(list.map(item => ({ ...item })));
      setVisible(true);
    };

    const handleOk = () => {
      onChange?.(ancestors, tempList);
      setVisible(false);
    };

    const handleFieldChange = (
      fieldKey: string,
      patch: Partial<PivotColumnSetting>,
    ) => {
      const current =
        tempList.find(item => item.key === fieldKey) || { key: fieldKey };
      const next = { ...current, ...patch };
      if (next.width === undefined || next.width === null) {
        delete next.width;
      }
      if (next.totals === undefined || next.totals === null) {
        delete next.totals;
      }
      setTempList([...tempList.filter(item => item.key !== fieldKey), next]);
    };

    return (
      <StyledPivotColumnSettings
        label={t(data.label, true)}
        labelCol={{ span: 20 }}
        wrapperCol={{ span: 4 }}
      >
        <Button size="small" onClick={open}>
          {t('pivot.column.configure', true)}
          {list.length > 0 ? ` (${list.length})` : ''}
        </Button>
        <PivotColumnSettingsModalGlobalStyle />
        <Modal
          className="pivot-column-settings-modal"
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
            const item: PivotColumnSetting =
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
                <Col span={mode === 'width' ? 12 : 16}>
                  <Typography.Text
                    ellipsis={{ tooltip: fieldName }}
                    style={{ width: '100%' }}
                  >
                    {fieldName}
                  </Typography.Text>
                </Col>
                {mode === 'width' ? (
                  <Col span={8}>
                    <InputNumber
                      className="datart-ant-input-number"
                      min={40}
                      placeholder={t(
                        'pivot.column.widthPlaceholder',
                        true,
                      )}
                      value={item.width}
                      onChange={value => {
                        const width = Number(value);
                        handleFieldChange(fieldKey, {
                          width:
                            Number.isFinite(width) && width > 0
                              ? width
                              : undefined,
                        });
                      }}
                    />
                  </Col>
                ) : (
                  <Col span={6} className="pivot-column-totals">
                    <Switch
                      size="small"
                      checked={item.totals !== false}
                      onChange={checked =>
                        handleFieldChange(fieldKey, {
                          totals: checked,
                        })
                      }
                    />
                  </Col>
                )}
              </Row>
            );
          })}
        </Modal>
      </StyledPivotColumnSettings>
    );
  },
  itemLayoutComparer,
);

export default PivotColumnSettings;

const StyledPivotColumnSettings = styled(BW)`
  flex-direction: row;
  margin-bottom: 0;

  .ant-form-item-control {
    display: flex;
    align-items: center;
    justify-content: flex-start;
  }

  .datart-ant-input-number {
    width: 100%;
  }

  .pivot-column-totals {
    display: flex;
    gap: 4px;
    align-items: center;
    font-size: 12px;
    white-space: nowrap;
  }
`;

const PivotColumnSettingsModalGlobalStyle = createGlobalStyle`
  .pivot-column-settings-modal .pivot-column-row {
    padding: 4px 0;
  }

  .pivot-column-settings-modal .pivot-column-row + .pivot-column-row {
    margin-top: 8px;
    border-top: 1px solid rgba(0, 0, 0, 0.08);
  }
`;
