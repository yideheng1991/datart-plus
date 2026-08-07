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
import { Empty, Input, Modal, Pagination, Tabs } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

const { TabPane } = Tabs;

const ICONS_PER_PAGE = 20;

const DATA_ICONS = [
  'AreaChartOutlined',
  'BarChartOutlined',
  'BarcodeOutlined',
  'BorderlessTableOutlined',
  'BoxPlotOutlined',
  'CandleChartOutlined',
  'ColumnHeightOutlined',
  'ColumnWidthOutlined',
  'ConsoleSqlOutlined',
  'DatabaseFilled',
  'DatabaseOutlined',
  'FundFilled',
  'FundOutlined',
  'LineChartOutlined',
  'PieChartFilled',
  'PieChartOutlined',
  'RadarChartOutlined',
  'RiseOutlined',
  'FallOutlined',
  'StockOutlined',
  'TableOutlined',
  'FieldNumberOutlined',
  'FieldTimeOutlined',
  'FieldStringOutlined',
  'FieldBinaryOutlined',
  'FieldIndexOutlined',
  'FieldKeyOutlined',
  'FieldMarkOutlined',
  'FieldProfileOutlined',
  'FieldValueOutlined',
  'PartitionOutlined',
  'SolutionOutlined',
];

const getGeneralIcons = () => {
  const allExports = Object.keys(AntDesignIcons).filter(
    k => k !== 'default' && k[0] === k[0].toUpperCase(),
  );
  const dataSet = new Set(DATA_ICONS);
  return allExports.filter(name => !dataSet.has(name));
};

interface IconSelectModalProps {
  visible: boolean;
  onConfirm: (iconName: string) => void;
  onCancel: () => void;
  initialValue?: string;
}

const IconSelectModal: React.FC<IconSelectModalProps> = ({
  visible,
  onConfirm,
  onCancel,
  initialValue,
}) => {
  const { t } = useTranslation();
  const [selectedIcon, setSelectedIcon] = useState<string | undefined>(
    initialValue,
  );
  const [activeTab, setActiveTab] = useState<string>('data');
  const [dataPage, setDataPage] = useState(1);
  const [generalPage, setGeneralPage] = useState(1);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    if (visible) {
      setSelectedIcon(initialValue);
      const isDataIcon = initialValue && DATA_ICONS.includes(initialValue);
      setActiveTab(initialValue ? (isDataIcon ? 'data' : 'general') : 'data');
      setDataPage(1);
      setGeneralPage(1);
      setSearchText('');
    }
  }, [visible, initialValue]);

  const generalIcons = useMemo(() => getGeneralIcons(), []);

  const filteredDataIcons = useMemo(() => {
    if (!searchText) return DATA_ICONS;
    const lower = searchText.toLowerCase();
    return DATA_ICONS.filter(name => name.toLowerCase().includes(lower));
  }, [searchText]);

  const filteredGeneralIcons = useMemo(() => {
    if (!searchText) return generalIcons;
    const lower = searchText.toLowerCase();
    return generalIcons.filter(name => name.toLowerCase().includes(lower));
  }, [searchText, generalIcons]);

  const dataPageCount = Math.max(
    1,
    Math.ceil(filteredDataIcons.length / ICONS_PER_PAGE),
  );
  const generalPageCount = Math.max(
    1,
    Math.ceil(filteredGeneralIcons.length / ICONS_PER_PAGE),
  );

  const handleConfirm = () => {
    if (selectedIcon) {
      onConfirm(selectedIcon);
    }
  };

  const handleCancel = () => {
    setSelectedIcon(undefined);
    onCancel();
  };

  const renderIconGrid = (icons: string[]) => {
    if (!icons.length) {
      return <Empty description={t('components.iconSelectModal.noIcon')} />;
    }

    return (
      <IconGrid>
        {icons.map(iconName => {
          const IconComponent = (AntDesignIcons as any)[iconName];
          if (!IconComponent) return null;
          const isSelected = selectedIcon === iconName;
          return (
            <IconCell
              key={iconName}
              selected={isSelected}
              onClick={() => setSelectedIcon(iconName)}
            >
              <IconComponent style={{ fontSize: 24 }} />
              <IconName>{iconName}</IconName>
            </IconCell>
          );
        })}
      </IconGrid>
    );
  };

  const paginateIcons = (icons: string[], page: number) => {
    const start = (page - 1) * ICONS_PER_PAGE;
    return icons.slice(start, start + ICONS_PER_PAGE);
  };

  const renderPagination = (
    current: number,
    total: number,
    onChange: (page: number) => void,
  ) => {
    if (total <= 1) return null;
    return (
      <PaginationWrapper>
        <Pagination
          size="small"
          current={current}
          total={total * ICONS_PER_PAGE}
          pageSize={ICONS_PER_PAGE}
          showSizeChanger={false}
          onChange={onChange}
        />
      </PaginationWrapper>
    );
  };

  const handleSearchChange = (value: string) => {
    setSearchText(value);
    setDataPage(1);
    setGeneralPage(1);
  };

  return (
    <Modal
      title={t('components.iconSelectModal.title')}
      visible={visible}
      onOk={handleConfirm}
      onCancel={handleCancel}
      okText={t('components.iconSelectModal.confirm')}
      cancelText={t('components.iconSelectModal.cancel')}
      width={644}
      centered
      destroyOnClose
      maskClosable={false}
      bodyStyle={{ maxHeight: '60vh', overflowY: 'auto' }}
    >
      <SearchWrapper>
        <Input.Search
          placeholder={t('components.iconSelectModal.searchPlaceholder')}
          allowClear
          value={searchText}
          onChange={e => handleSearchChange(e.target.value)}
          onSearch={handleSearchChange}
        />
      </SearchWrapper>
      <TabWrapper>
        <Tabs activeKey={activeTab} onChange={setActiveTab} size="small">
          <TabPane
            tab={t('components.iconSelectModal.dataCategory')}
            key="data"
          >
            {renderIconGrid(paginateIcons(filteredDataIcons, dataPage))}
            {renderPagination(dataPage, dataPageCount, setDataPage)}
          </TabPane>
          <TabPane
            tab={t('components.iconSelectModal.generalCategory')}
            key="general"
          >
            {renderIconGrid(paginateIcons(filteredGeneralIcons, generalPage))}
            {renderPagination(generalPage, generalPageCount, setGeneralPage)}
          </TabPane>
        </Tabs>
      </TabWrapper>
    </Modal>
  );
};

export default IconSelectModal;

const SearchWrapper = styled.div`
  margin-bottom: 12px;
`;

const TabWrapper = styled.div`
  .ant-tabs-nav {
    margin-bottom: 12px;
  }
`;

const IconGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  padding: 4px;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
`;

const IconCell = styled.div<{ selected: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 4px;
  cursor: pointer;
  background-color: ${p => (p.selected ? '#e6f7ff' : 'transparent')};
  border: 1px solid ${p => (p.selected ? '#1890ff' : 'transparent')};
  border-radius: 4px;
  transition: all 0.2s;

  &:hover {
    background-color: ${p => (p.selected ? '#e6f7ff' : '#f5f5f5')};
    border-color: ${p => (p.selected ? '#1890ff' : '#d9d9d9')};
  }

  > span {
    color: ${p => (p.selected ? '#1890ff' : 'inherit')};
  }
`;

const IconName = styled.span`
  max-width: 100%;
  margin-top: 4px;
  overflow: hidden;
  font-size: 10px;
  color: #8c8c8c;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const PaginationWrapper = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 12px;
`;
