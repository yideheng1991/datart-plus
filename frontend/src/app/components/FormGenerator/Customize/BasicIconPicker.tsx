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
import * as AntDesignIcons from '@ant-design/icons';
import { Button } from 'antd';
import IconSelectModal from 'app/components/IconSelectModal';
import { ChartStyleConfig } from 'app/types/ChartConfig';
import React, { FC, memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components/macro';
import { ItemLayoutProps } from '../types';
import { itemLayoutComparer } from '../utils';
import { BW } from '../Basic/components/BasicWrapper';

const BasicIconPicker: FC<ItemLayoutProps<ChartStyleConfig>> = memo(
  ({ ancestors, translate: t = title => title, data, onChange }) => {
    const { t: tr } = useTranslation();
    const [modalOpen, setModalOpen] = useState(false);
    const currentValue = data?.value;
    const disabled = data?.disabled;

    const handleOpenModal = () => {
      if (disabled) return;
      setModalOpen(true);
    };

    const handleConfirm = (iconName: string) => {
      onChange?.(ancestors, iconName);
      setModalOpen(false);
    };

    const handleCancel = () => {
      setModalOpen(false);
    };

    const renderCurrentIcon = () => {
      if (!currentValue) return null;
      const IconComponent = (AntDesignIcons as any)[currentValue];
      if (!IconComponent) return null;
      return <IconComponent style={{ marginRight: 8 }} />;
    };

    return (
      <BW label={t(data?.label, true)}>
        <StyledIconPicker>
          <Button
            block
            size="middle"
            disabled={disabled}
            onClick={handleOpenModal}
            icon={renderCurrentIcon()}
          >
            {currentValue || tr('components.iconSelectModal.selectIcon')}
          </Button>
          <IconSelectModal
            visible={modalOpen}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
            initialValue={currentValue}
          />
        </StyledIconPicker>
      </BW>
    );
  },
  itemLayoutComparer,
);

export default BasicIconPicker;

const StyledIconPicker = styled.div`
  width: 100%;

  .ant-btn {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    text-align: left;
  }
`;
