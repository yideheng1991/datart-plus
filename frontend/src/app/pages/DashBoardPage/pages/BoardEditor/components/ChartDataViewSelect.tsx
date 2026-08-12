/**
 * Datart
 *
 * Copyright 2021
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in the License at
 * www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Empty, Select } from 'antd';
import { FONT_WEIGHT_MEDIUM, SPACE_MD, SPACE_XS } from 'styles/StyleConstants';
import useI18NPrefix from 'app/hooks/useI18NPrefix';
import ChartDataView from 'app/types/ChartDataView';
import { ChartDataViewMeta, renderMataProps } from 'app/types/ChartDataViewMeta';
import ChartDataViewContext from 'app/pages/ChartWorkbenchPage/contexts/ChartDataViewContext';
import { ChartDraggableSourceGroupContainer } from 'app/pages/ChartWorkbenchPage/components/ChartOperationPanel/components/ChartDraggable';
import { FC, useMemo } from 'react';
import styled from 'styled-components';

export interface ChartDataViewSelectProps {
  viewMap: Record<string, ChartDataView>;
  currentViewId?: string;
  onChange: (viewId: string) => void;
}

/**
 * 可复用的数据源选择区块：数据源下拉 + 可拖拽字段列表。
 * 字段列表直接复用 workbench 的 ChartDraggableSourceGroupContainer（与 ChartDataViewPanel 同源），
 * 其拖拽协议与 ChartConfigPanel 的放置目标完全一致，可拖入维度/指标配置框。
 * 数据源列表来自全局 viewMap（仪表板编辑态已加载）。
 */
const ChartDataViewSelect: FC<ChartDataViewSelectProps> = ({
  viewMap,
  currentViewId,
  onChange,
}) => {
  const t = useI18NPrefix(`viz.board.action`);
  const tView = useI18NPrefix('view');

  const viewList = useMemo(
    () => Object.values(viewMap || {}),
    [viewMap],
  );
  const currentView = viewMap?.[currentViewId || ''];
  const fields = (currentView?.meta || []) as ChartDataViewMeta[];

  return (
    <>
      <Section>
        <SectionTitle>{tView('selectSource')}</SectionTitle>
        <Select
          style={{ width: '100%' }}
          placeholder={tView('selectSource')}
          value={currentViewId || undefined}
          onChange={onChange}
          options={viewList.map(v => ({
            label: v.name,
            value: v.id,
          }))}
        />
      </Section>

      <Section>
        <SectionTitle>{t('field')}</SectionTitle>
        {fields.length ? (
          <ChartDataViewContext.Provider
            value={{
              dataView: currentView,
              expensiveQuery: false,
              availableSourceFunctions: [],
            }}
          >
            <ChartDraggableSourceGroupContainer
              meta={fields as unknown as renderMataProps[]}
              onDeleteComputedField={() => undefined}
              onEditComputedField={() => undefined}
            />
          </ChartDataViewContext.Provider>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Section>
    </>
  );
};

export default ChartDataViewSelect;

const Section = styled.div`
  margin-bottom: ${SPACE_MD};
`;

const SectionTitle = styled.div`
  margin-bottom: ${SPACE_XS};
  font-weight: ${FONT_WEIGHT_MEDIUM};
  color: ${p => p.theme.textColorSnd};
`;
