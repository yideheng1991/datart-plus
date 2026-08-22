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

import { Button, Col, Modal, Row, Select, Typography } from 'antd';
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

export type ColumnAlignSetting = {
  key: string;
  align?: string;
};

export type ColumnAlignValue = {
  aligns?: ColumnAlignSetting[];
};

const normalizeValue = (value: unknown): ColumnAlignValue => {
  if (value && typeof value === 'object') {
    const obj = value as ColumnAlignValue;
    return {
      aligns: Array.isArray(obj.aligns) ? obj.aligns : [],
    };
  }
  return {};
};

const ColumnAlign: FC<ItemLayoutProps<ChartStyleConfig>> = memo(
  ({
    ancestors,
    translate: t = title => title,
    data,
    dataConfigs,
    onChange,
  }) => {
    const value = normalizeValue(data.value);
    const list: ColumnAlignSetting[] = value.aligns || [];
    const fields = (dataConfigs || [])
      .filter(config => {
        return (
          config.type === ChartDataSectionType.Aggregate ||
          config.type === ChartDataSectionType.Mixed ||
          config.type === ChartDataSectionType.Group
        );
      })
      .flatMap(config => config.rows || []);
    const [visible, setVisible] = useState(false);
    const [tempList, setTempList] = useState<ColumnAlignSetting[]>([]);

    const open = () => {
      setTempList(list.map(item => ({ ...item })));
      setVisible(true);
    };

    const handleOk = () => {
      onChange?.(ancestors, { aligns: tempList });
      setVisible(false);
    };

    const handleFieldChange = (fieldKey: string, align: string) => {
      const current = tempList.find(item => item.key === fieldKey) || {
        key: fieldKey,
      };
      const next = { ...current, align };
      setTempList([
        ...tempList.filter(item => item.key !== fieldKey),
        next,
      ]);
    };

    return (
      <StyledColumnAlign label={t(data.label, true)} labelCol={{ span: 20 }} wrapperCol={{ span: 4 }}>
        <Button size="small" onClick={open}>
          {t('columnAlign.configure', true)}
          {list.length > 0 ? ` (${list.length})` : ''}
        </Button>
        <Modal
          title={t(data.label, true)}
          open={visible}
          onOk={handleOk}
          onCancel={() => setVisible(false)}
          width={520}
          className="column-align-modal"
        >
          <ColumnAlignModalGlobalStyle />
          {!fields.length && (
            <Typography.Text type="secondary">
              {t('columnAlign.noFields', true)}
            </Typography.Text>
          )}
          {fields.map(field => {
            const fieldKey = getValueByColumnKey(field);
            const fieldName = getColumnRenderName(field);
            const item: ColumnAlignSetting =
              tempList.find(i => i.key === fieldKey) || {
                key: fieldKey,
              };
            return (
              <Row
                key={fieldKey}
                gutter={16}
                align="middle"
                className="column-align-row"
              >
                <Col span={16} className="column-align-label">
                  <Typography.Text
                    ellipsis={{ tooltip: fieldName }}
                    style={{ width: '100%' }}
                  >
                    {fieldName}
                  </Typography.Text>
                </Col>
                <Col span={6}>
                  <Select
                    className="datart-ant-select"
                    dropdownMatchSelectWidth
                    style={{ width: '100%' }}
                    value={item.align || 'center'}
                    onChange={nextAlign =>
                      handleFieldChange(fieldKey, nextAlign)
                    }
                    options={[
                      {
                        label: t('columnAlign.options.left', true),
                        value: 'left',
                      },
                      {
                        label: t('columnAlign.options.center', true),
                        value: 'center',
                      },
                      {
                        label: t('columnAlign.options.right', true),
                        value: 'right',
                      },
                    ]}
                  />
                </Col>
              </Row>
            );
          })}
        </Modal>
      </StyledColumnAlign>
    );
  },
  itemLayoutComparer,
);

export default ColumnAlign;

const ColumnAlignModalGlobalStyle = createGlobalStyle`
  .column-align-modal {
    .column-align-row {
      margin-bottom: 8px;
    }
    .column-align-label {
      text-align: left;
    }
  }
`;

const StyledColumnAlign = styled(BW)`
  flex-direction: row;
  margin-bottom: 0;

  .ant-form-item-control {
    display: flex;
    align-items: center;
    justify-content: flex-start;
  }
`;
