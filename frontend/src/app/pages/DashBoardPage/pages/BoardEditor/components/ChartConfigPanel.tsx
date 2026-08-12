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
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Button } from 'antd';
import { CloseOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import {
  PRIMARY,
  SPACE_MD,
} from 'styles/StyleConstants';
import ChartManager from 'app/models/ChartManager';
import { ChartConfigReducerActionType } from 'app/pages/ChartWorkbenchPage/slice/constant';
import { ChartConfigPayloadType } from 'app/pages/ChartWorkbenchPage/slice/types';
import {
  selectDataChartById,
  selectViewMap,
  selectWidgetDataById,
} from 'app/pages/DashBoardPage/pages/Board/slice/selector';
import {
  selectAllWidgetMap,
} from 'app/pages/DashBoardPage/pages/BoardEditor/slice/selectors';
import { currentDataViewSelector } from 'app/pages/ChartWorkbenchPage/slice/selectors';
import { editBoardStackActions } from 'app/pages/DashBoardPage/pages/BoardEditor/slice';
import { getEditChartWidgetDataAsync } from 'app/pages/DashBoardPage/pages/BoardEditor/slice/thunk';
import { boardActions } from 'app/pages/DashBoardPage/pages/Board/slice';
import { dispatchResize } from 'app/utils/dispatchResize';
import { mergeChartAndViewComputedField } from 'app/utils/chartHelper';
import { Widget } from 'app/pages/DashBoardPage/types/widgetTypes';
import useI18NPrefix from 'app/hooks/useI18NPrefix';
import { DataChart } from 'app/pages/DashBoardPage/pages/Board/slice/types';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { HistoryEditBoard } from '../slice/types';
import { RootState } from 'types';
import ChartWorkbenchInplace from './ChartWorkbenchInplace';
import ChartSelectDrawer from './BoardToolBar/AddChart/ChartSelectDrawer';

export const ChartConfigPanel: FC<{
  boardId: string;
  widgetId: string;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}> = ({ boardId, widgetId, onClose, collapsed, onToggleCollapse }) => {
  const dispatch = useDispatch();
  const t = useI18NPrefix(`viz.board.action`);

  const widgetRecord = useSelector((state: { editBoard: HistoryEditBoard }) =>
    selectAllWidgetMap(state),
  );
  const widget = widgetRecord[widgetId] as Widget;
  // workbench 当前视图（用户切换数据源后 fetchViewDetailAction 填充，id 即真实 viewId）
  const currentDataView = useSelector(currentDataViewSelector);
  // 用 ref 持有最新 currentDataView，避免写回 datachart 时被闭包旧值覆盖 viewId
  const currentDataViewRef = useRef(currentDataView);
  currentDataViewRef.current = currentDataView;
  const dataChartFromMap = useSelector((state: RootState) =>
    selectDataChartById(state, boardId, widget?.datachartId || ''),
  );
  // 优先用 widget 内嵌的 content.dataChart（原位新增时直接挂在 widget 上），
  // fallback 到全局 dataChartMap
  const dataChart = useMemo<DataChart | undefined>(
    () =>
      (widget?.config?.content?.dataChart as DataChart) ||
      dataChartFromMap ||
      undefined,
    [widget?.config?.content?.dataChart, dataChartFromMap],
  );
  const viewMap = useSelector(selectViewMap);
  const dataset = useSelector((state: RootState) =>
    selectWidgetDataById(state, widgetId),
  );

  const [changeChartVisible, setChangeChartVisible] = useState(false);

  // 用 ref 持有最新的 onChartTypeChange，避免与下方的 useCallback 形成 TDZ（暂时性死区）
  const onChartTypeChangeRef = useRef<(chartGraphId: string) => void>(
    () => undefined,
  );

  const openChangeChart = useCallback(
    () => setChangeChartVisible(true),
    [],
  );
  const onSelectChangeChart = useCallback((chartId: string) => {
    setChangeChartVisible(false);
    onChartTypeChangeRef.current(chartId);
  }, []);

  const currentViewId = dataChart?.viewId || widget?.viewIds?.[0];

  // 把最新的 dataChart 同步写回 widget.content.dataChart（画布实时渲染来源之一）
  const syncWidgetContent = useCallback(
    (nextDataChart: DataChart) => {
      if (!widget) return;
      const nextWidget: Widget = {
        ...widget,
        config: {
          ...widget.config,
          content: {
            ...widget.config.content,
            dataChart: nextDataChart,
          },
        },
      };
      dispatch(editBoardStackActions.updateWidget(nextWidget));
    },
    [widget, dispatch],
  );

  // 把视图级计算字段合并进 datachart.config.computedFields。
  // 原位创建的 datachart 未经过服务端 getDataChartsByServer 的合并，
  // 其 config.computedFields 为空，导致请求计算字段时后端 400；
  // 需把 currentDataView.computedFields（视图级）并入。
  const enrichComputedFields = useCallback(
    (dc: DataChart): DataChart => ({
      ...dc,
      config: {
        ...dc.config,
        computedFields: mergeChartAndViewComputedField(
          currentDataViewRef.current?.computedFields || [],
          dc.config.computedFields || [],
        ),
      },
    }),
    [],
  );

  // 把选中的视图 id 同步回 datachart / widget（供画布计算与进 workbench 使用）
  const syncViewToDataChart = useCallback(
    (viewId: string) => {
      if (!viewId || !dataChart) return;
      const nextDataChart: DataChart = enrichComputedFields({
        ...dataChart,
        viewId,
      });
      dispatch(
        boardActions.setDataChartToMap({
          dashboardId: boardId,
          dataCharts: [nextDataChart],
        }),
      );
      // 更新 widget 绑定的 viewIds
      if (widget) {
        const nextWidget: Widget = {
          ...widget,
          viewIds: [viewId],
        };
        dispatch(editBoardStackActions.updateWidget(nextWidget));
      }
      syncWidgetContent(nextDataChart);
      dispatch(getEditChartWidgetDataAsync({ widgetId }));
    },
    [dataChart, widget, boardId, widgetId, dispatch, syncWidgetContent],
  );

  // ChartDataViewPanel 切换数据源时，把真实 viewId 经 onDataViewChange 透出；
  // 但 workbench 该回调语义是 (clear?: boolean)，参数不可信，故仅标记「用户已切换」，
  // 等 workbench 的 currentDataView 真正就绪（id 即真实 viewId）后再自动同步，
  // 避免把布尔/undefined 误当作 viewId 写入 datachart。
  const pendingViewSyncRef = useRef(false);
  const onViewChange = useCallback(() => {
    pendingViewSyncRef.current = true;
  }, []);

  useEffect(() => {
    const vid = currentDataView?.id;
    if (pendingViewSyncRef.current && vid && vid !== dataChart?.viewId) {
      pendingViewSyncRef.current = false;
      syncViewToDataChart(vid);
    }
  }, [currentDataView?.id, dataChart?.viewId, syncViewToDataChart]);

  // 图表配置（字段/样式）变更 —— 实时写 store，画布即时重渲染
  const handleChartConfigChange = useCallback(
    (type: string, payload: ChartConfigPayloadType) => {
      if (!dataChart) return;
      const nextChartConfig = produceChartConfig(
        dataChart.config.chartConfig,
        type,
        payload,
      );
      const nextDataChart: DataChart = enrichComputedFields({
        ...dataChart,
        viewId: dataChart.viewId || currentDataViewRef.current?.id || '',
        config: {
          ...dataChart.config,
          chartConfig: nextChartConfig,
        },
      });
      dispatch(
        boardActions.setDataChartToMap({
          dashboardId: boardId,
          dataCharts: [nextDataChart],
        }),
      );
      syncWidgetContent(nextDataChart);
      if (payload.needRefresh) {
        dispatch(getEditChartWidgetDataAsync({ widgetId }));
      }
    },
    [dataChart, boardId, widgetId, dispatch, syncWidgetContent],
  );

  // 切换图表类型
  const onChartTypeChange = useCallback(
    (chartGraphId: string) => {
      if (!dataChart) return;
      const chart = ChartManager.instance().getById(chartGraphId);
      const nextDataChart: DataChart = enrichComputedFields({
        ...dataChart,
        viewId: dataChart.viewId || currentDataViewRef.current?.id || '',
        config: {
          ...dataChart.config,
          chartGraphId,
          chartConfig: chart?.config || dataChart.config.chartConfig,
        },
      });
      dispatch(
        boardActions.setDataChartToMap({
          dashboardId: boardId,
          dataCharts: [nextDataChart],
        }),
      );
      syncWidgetContent(nextDataChart);
      dispatch(getEditChartWidgetDataAsync({ widgetId }));
    },
    [dataChart, boardId, widgetId, dispatch, syncWidgetContent],
  );
  onChartTypeChangeRef.current = onChartTypeChange;

  // 监听面板自身宽度变化（如被 SplitPane 拖动改变），主动通知画布重算缩放，
  // 使画布在拖动 ChartConfigPanel 时能实时适应，无需依赖外部 dispatchResize。
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      requestAnimationFrame(() => dispatchResize());
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (!widget || !dataChart) {
    return null;
  }

  const currentView = viewMap?.[currentViewId || ''];
  const chart = ChartManager.instance().getById(
    dataChart.config.chartGraphId,
  );

  // 收起态：渲染固定在右侧的竖条
  if (collapsed) {
    return (
      <CollapsedBar onClick={onToggleCollapse}>
        <MenuUnfoldOutlined />
        <span>{t('createDataChartInplace')}</span>
      </CollapsedBar>
    );
  }

  return (
    <Panel ref={panelRef}>
      <PanelBody>
        {/* 复用 workbench 数据源面板 + 图表配置面板（去掉预览区） */}
        <DataSection>
          <ChartWorkbenchInplace
            chart={chart}
            chartConfig={dataChart.config.chartConfig}
            dataView={currentView}
            dataset={dataset}
            aggregation={dataChart.config.aggregation}
            defaultViewId={currentViewId}
            toolbarRight={
              <PanelToolbarRight>
                <CollapseBtn onClick={onToggleCollapse}>
                  <MenuFoldOutlined />
                </CollapseBtn>
                <CloseBtn
                  type="text"
                  icon={<CloseOutlined />}
                  onClick={onClose}
                />
              </PanelToolbarRight>
            }
            onChartConfigChange={handleChartConfigChange}
            onOpenChangeChart={openChangeChart}
            onDataViewChange={onViewChange}
            onRefreshDataset={() =>
              dispatch(getEditChartWidgetDataAsync({ widgetId }))
            }
          />
        </DataSection>
      </PanelBody>

      {/* 编辑时复用图表选择组件更换图表 */}
      <ChartSelectDrawer
        visible={changeChartVisible}
        onSelectChart={onSelectChangeChart}
        onClose={() => setChangeChartVisible(false)}
      />
    </Panel>
  );
};

// 局部 reducer：按 action 类型更新 chartConfig 的 datas/styles/settings/interactions
function produceChartConfig(
  chartConfig: any,
  type: string,
  payload: ChartConfigPayloadType,
): any {
  const next = JSON.parse(JSON.stringify(chartConfig || {}));
  switch (type) {
    case ChartConfigReducerActionType.DATA:
      next.datas = updateConfigByAncestors(
        next.datas,
        payload.ancestors,
        payload.value,
      );
      break;
    case ChartConfigReducerActionType.STYLE:
      next.styles = updateConfigByAncestors(
        next.styles,
        payload.ancestors,
        payload.value,
      );
      break;
    case ChartConfigReducerActionType.SETTING:
      next.settings = updateConfigByAncestors(
        next.settings,
        payload.ancestors,
        payload.value,
      );
      break;
    case ChartConfigReducerActionType.INTERACTION:
      next.interactions = updateConfigByAncestors(
        next.interactions,
        payload.ancestors,
        payload.value,
      );
      break;
    default:
      break;
  }
  return next;
}

function updateConfigByAncestors(
  list: any[] = [],
  ancestors: number[] = [],
  value: any,
): any[] {
  if (!ancestors?.length) return list;
  const next = [...list];
  let cursor = next;
  for (let i = 0; i < ancestors.length - 1; i++) {
    cursor = cursor[ancestors[i]].rows || cursor[ancestors[i]].children || [];
  }
  const last = ancestors[ancestors.length - 1];
  cursor[last] = value;
  return next;
}

export default ChartConfigPanel;

// 面板容器：作为右侧 SplitPane 的 pane，与 SlideSetting 平级
const Panel = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background-color: ${p => p.theme.componentBackground};
  border-left: 1px solid ${p => p.theme.borderColorBase};
`;

const CollapseBtn = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  font-size: 13px;
  color: ${p => p.theme.textColorSnd};
  cursor: pointer;
  border-radius: 4px;

  &:hover {
    color: ${PRIMARY};
    background-color: ${p => p.theme.bodyBackground};
  }
`;

// 整合到 ChartTypeBar 同一行的右侧工具区：收起按钮 + 关闭按钮
const PanelToolbarRight = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
`;

// 关闭按钮：默认灰色，hover 显示主题色
const CloseBtn = styled(Button)`
  color: ${p => p.theme.textColorSnd};

  &:hover,
  &:focus {
    color: ${PRIMARY} !important;
  }
`;

// Panel 主体：去掉 Tab 分页后，数据区 + 样式区上下排列
// PanelBody 作为 flex 容器，让「数据」section 内的 workbench 能 flex:1 拿到高度；
// 整体可滚动，避免样式区过长时挤压 workbench。
const PanelBody = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
`;

// 数据源 + 图表配置区：作为纵向 flex 容器，使 ChartWorkbenchInplace 的 flex:1 生效
const DataSection = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  min-height: 420px;
  padding: ${SPACE_MD};
  margin-bottom: ${SPACE_MD};
`;

// 收起态：固定在右侧的竖边栏，点击展开
const CollapsedBar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 13px;
  color: ${p => p.theme.textColorSnd};
  letter-spacing: 4px;
  cursor: pointer;
  user-select: none;
  background-color: ${p => p.theme.componentBackground};
  border-left: 1px solid ${p => p.theme.borderColorBase};
  writing-mode: vertical-lr;

  &:hover {
    color: ${PRIMARY};
    background-color: ${p => p.theme.bodyBackground};
  }
`;
