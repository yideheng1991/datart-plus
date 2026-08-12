/**
 * Datart
 *
 * Copyright 2021
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import useI18NPrefix from 'app/hooks/useI18NPrefix';
import ChartGraphPanel from 'app/pages/ChartWorkbenchPage/components/ChartOperationPanel/components/ChartGraphPanel';
import { Drawer } from 'antd';
import { useState } from 'react';

export interface ChartSelectDrawerProps {
  visible: boolean;
  onSelectChart: (chartId: string) => void;
  onClose: () => void;
}

const ChartSelectDrawer: React.FC<ChartSelectDrawerProps> = ({
  visible,
  onSelectChart,
  onClose,
}) => {
  const t = useI18NPrefix(`viz.board.action`);
  const [layoutDirection, setLayoutDirection] = useState<'horizontal'>(
    'horizontal',
  );

  const handleChartChange = (chart: { meta: { id: string } }) => {
    onSelectChart(chart.meta.id);
  };

  return (
    <Drawer
      title={t('createDataChartInplace')}
      placement="right"
      width={420}
      closable
      onClose={onClose}
      visible={visible}
      destroyOnClose
    >
      <ChartGraphPanel
        layoutDirection={layoutDirection}
        onLayoutDirectionChange={setLayoutDirection}
        onChartChange={handleChartChange}
      />
    </Drawer>
  );
};

export default ChartSelectDrawer;
