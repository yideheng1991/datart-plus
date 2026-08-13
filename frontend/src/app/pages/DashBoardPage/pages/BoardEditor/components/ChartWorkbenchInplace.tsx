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

// 原位配置复用 workbench 的「数据源面板 + 图表配置面板」整套（去掉预览区 ChartPresentWrapper）。
// 直接复用 ChartOperationPanel，仅用 inplace layout 去掉 PRESENT 节点，
// 并通过 workbench 的 context 注入 dashboard 当前视图 / 数据，使字段拖拽与配置框互通。

import { Button } from 'antd';
import ChartAggregationContext from 'app/pages/ChartWorkbenchPage/contexts/ChartAggregationContext';
import ChartDataViewContext from 'app/pages/ChartWorkbenchPage/contexts/ChartDataViewContext';
import ChartDatasetContext from 'app/pages/ChartWorkbenchPage/contexts/ChartDatasetContext';
import ChartI18NContext from 'app/pages/ChartWorkbenchPage/contexts/Chart18NContext';
import TimeConfigContext from 'app/pages/ChartWorkbenchPage/contexts/TimeConfigContext';
import ChartDrillContext from 'app/contexts/ChartDrillContext';
import ChartOperationPanel from 'app/pages/ChartWorkbenchPage/components/ChartOperationPanel/ChartOperationPanel';
import ChartIcon from 'app/pages/ChartWorkbenchPage/components/ChartOperationPanel/components/ChartGraphIcon/ChartIcon';
import {
  currentDataViewSelector,
  dateFormatSelector,
  languageSelector,
  selectAvailableSourceFunctions,
} from 'app/pages/ChartWorkbenchPage/slice/selectors';
import {
  fetchAvailableSourceFunctionsForChart,
  fetchDataViewsAction,
  fetchViewDetailAction,
} from 'app/pages/ChartWorkbenchPage/slice/thunks';
import { boardActions } from 'app/pages/DashBoardPage/pages/Board/slice';
import { selectOrgId } from 'app/pages/MainPage/slice/selectors';
import { IChart } from 'app/types/Chart';
import { ChartConfig } from 'app/types/ChartConfig';
import { ChartConfigReducerActionType } from 'app/pages/ChartWorkbenchPage/slice/constant';
import ChartDataSetDTO from 'app/types/ChartDataSet';
import ChartDataView from 'app/types/ChartDataView';
import { FC, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { SPACE_XS } from 'styles/StyleConstants';
import useI18NPrefix from 'app/hooks/useI18NPrefix';
import ChartWorkbenchInplaceLayout from './ChartOperationPanelInplaceLayout';

export interface ChartWorkbenchInplaceProps {
  chart?: IChart;
  chartConfig?: ChartConfig;
  dataView?: ChartDataView;
  dataset?: ChartDataSetDTO;
  aggregation?: boolean;
  allowQuery?: boolean;
  // 当前 widget 绑定的视图 id；变化时主动拉取该视图详情（含字段 meta）以保证字段显示
  defaultViewId?: string;
  // 插槽：渲染在 ChartTypeBar 最右侧（如收起按钮）
  toolbarRight?: React.ReactNode;
  onChartConfigChange: (
    type:
      | typeof ChartConfigReducerActionType.DATA
      | typeof ChartConfigReducerActionType.STYLE
      | typeof ChartConfigReducerActionType.SETTING
      | typeof ChartConfigReducerActionType.INTERACTION,
    payload: any,
  ) => void;
  onOpenChangeChart?: () => void;
  onDataViewChange?: (clear?: boolean) => void;
  onRefreshDataset?: () => void;
}

const ChartWorkbenchInplace: FC<ChartWorkbenchInplaceProps> = ({
  chart,
  chartConfig,
  dataView,
  dataset,
  aggregation,
  allowQuery,
  defaultViewId,
  toolbarRight,
  onChartConfigChange,
  onOpenChangeChart,
  onDataViewChange,
  onRefreshDataset,
}) => {
  const dispatch = useDispatch();
  const language = useSelector(languageSelector);
  const dateFormat = useSelector(dateFormatSelector);
  const orgId = useSelector(selectOrgId);
  // workbench 当前视图（fetchViewDetailAction 填充，含完整 meta 字段）
  const currentDataView = useSelector(currentDataViewSelector);
  // 当前数据源支持的聚合/日期层级函数；为空会导致日期字段的子字段（年/季/月/日）无法生成
  const availableSourceFunctions = useSelector(selectAvailableSourceFunctions);

  // 拉取组织全量视图列表到 workbench store，使数据源（视图）下拉框显示完整
  useEffect(() => {
    if (orgId) {
      dispatch(fetchDataViewsAction({ orgId }));
    }
  }, [orgId, dispatch]);

  // 当前绑定视图变化（含选中新数据源）时，主动拉取该视图详情，确保字段列表显示。
  // 不经过 ChartDataViewPanel 内部的「清空/保留」确认框逻辑，原位配置下直接生效。
  useEffect(() => {
    if (defaultViewId) {
      dispatch(fetchViewDetailAction({ viewId: defaultViewId }));
    }
  }, [defaultViewId, dispatch]);

  // 将已拉详情的当前视图（含完整字段 meta）同步进 dashboard 的 viewMap，
  // 使画布实时计算 (getEditChartWidgetDataAsync) 与「编辑图表」进入 workbench
  // 时 (viewMap[viewId]) 都能拿到带 meta 的视图，避免数据源/计算为空。
  // 同时依赖 computedFields：保存/新增计算字段后，需把最新视图计算字段同步进
  // viewMap，否则 getDataChartRequestParams 请求里不含新计算字段，刷新数据会失败。
  useEffect(() => {
    if (currentDataView?.id && currentDataView?.meta) {
      dispatch(boardActions.updateViewMap([currentDataView]));
    }
  }, [
    currentDataView?.id,
    currentDataView?.meta,
    currentDataView?.computedFields,
    dispatch,
  ]);

  const layout = useMemo(() => ChartWorkbenchInplaceLayout, []);

  // 优先用 workbench 已拉详情的 currentDataView（字段完整），否则用 dashboard 传入的视图兜底。
  // 原位配置场景下，currentDataView 即当前选中视图的详情（含完整字段 meta）。
  // 这里不比较 currentDataView.id 与 defaultViewId 是否一致：
  // 当 dataChart.viewId 未回流（为 undefined）时，defaultViewId 也可能为空，
  // 若严格比较会导致错误回退到无 meta 的 dataView。
  // （注意：currentDataView 可能残留上次 workbench 的视图，需依赖上层传入的
  //  defaultViewId 触发 fetchViewDetailAction 来刷新为当前绑定视图。）
  const effectiveDataView = currentDataView?.id
    ? currentDataView
    : dataView;

  // 拉取当前数据源支持的函数（含日期层级 AGG_DATE_*），
  // 否则 availableSourceFunctions 为空，日期父字段的子字段（年/季/月/日）将无法生成。
  const sourceId = effectiveDataView?.sourceId;
  useEffect(() => {
    if (sourceId) {
      dispatch(fetchAvailableSourceFunctionsForChart(sourceId));
    }
  }, [sourceId, dispatch]);

  const { i18n } = useTranslation();
  const tSetting = useI18NPrefix(`viz.board.setting`);

  // 当前图表名称（如 viz.palette.graph.names.scoreChart）存于全局 i18n 资源，
  // 用 i18n.t 翻译；fallback 到 meta.name 本身。
  const chartName = chart?.meta?.name ? i18n.t(chart.meta.name) : '';

  return (
    <StyledChartWorkbench>
      <ChartTypeBar>
        <ChartTypeLeft>
          <span>{tSetting('chartType')}:</span>
          <ChartIcon
            iconStr={chart?.meta?.icon}
            isMatchRequirement
            size={18}
          />
          <span>{chartName}</span>
          <ChangeChartBtn type="link" onClick={onOpenChangeChart}>
            {tSetting('changeChart')}
          </ChangeChartBtn>
        </ChartTypeLeft>
        {toolbarRight}
      </ChartTypeBar>
      <WorkbenchBody>
        <ChartAggregationContext.Provider
          value={{ aggregation, onChangeAggregation: undefined }}
        >
      <ChartDrillContext.Provider
        value={{
          drillOption: undefined,
          onDrillOptionChange: undefined,
          availableSourceFunctions,
          onDateLevelChange: undefined,
        }}
      >
        <ChartDatasetContext.Provider
          value={{ dataset, onRefreshDataset }}
        >
          <ChartDataViewContext.Provider
            value={{
              dataView: effectiveDataView,
              availableSourceFunctions,
              expensiveQuery: false,
            }}
          >
            <TimeConfigContext.Provider
              value={{ locale: language, format: dateFormat }}
            >
              <ChartI18NContext.Provider
                value={{ i18NConfigs: chartConfig?.i18ns }}
              >
                <ChartOperationPanel
                  layout={layout}
                  chart={chart}
                  chartConfig={chartConfig}
                  defaultViewId={defaultViewId}
                  allowQuery={!!allowQuery}
                  onChartChange={() => undefined}
                  onChartConfigChange={onChartConfigChange}
                  onDataViewChange={onDataViewChange}
                />
              </ChartI18NContext.Provider>
            </TimeConfigContext.Provider>
          </ChartDataViewContext.Provider>
        </ChartDatasetContext.Provider>
      </ChartDrillContext.Provider>
        </ChartAggregationContext.Provider>
      </WorkbenchBody>
    </StyledChartWorkbench>
  );
};

const StyledChartWorkbench = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
`;

const WorkbenchBody = styled.div`
  position: relative;
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
`;

const ChartTypeBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
  padding: 4px 0;
  margin-bottom: ${SPACE_XS};
  border-bottom: 1px solid ${p => p.theme.borderColorSplit};
`;

const ChartTypeLeft = styled.span`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const ChangeChartBtn = styled(Button)`
  padding-left: 0;
  margin-left: 8px;
`;

export default ChartWorkbenchInplace;
