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
import { mergeToChartConfig } from 'app/utils/ChartDtoHelper';
import { transferChartConfigs } from 'app/utils/internalChartHelper';
import { clearRuntimeDateLevelFieldsInChartConfig, mergeChartAndViewComputedField } from 'app/utils/chartHelper';
import { updateCollectionByAction } from 'app/utils/mutation';
import { ChartDataViewMeta } from 'app/types/ChartDataViewMeta';
import { Widget } from 'app/pages/DashBoardPage/types/widgetTypes';
import useI18NPrefix from 'app/hooks/useI18NPrefix';
import { DataChart } from 'app/pages/DashBoardPage/pages/Board/slice/types';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { HistoryEditBoard } from '../slice/types';
import { RootState } from 'types';
import { migrateChartConfig } from 'app/migration';
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

  // 保存「最近一次有效完整配置」，作为切换图表时 transferChartConfigs 的数据迁移来源。
  // 与旧版 workbench 中 shadowChartConfig 的区别：
  // - 首次进入时为 null（此时用当前 dataChart.config.chartConfig 作为 source）
  // - handleChartConfigChange 每次字段/样式改动后都会把 shadow 刷新为最新配置
  //   （对应 workbench 的 updateShadowChartConfig(null) 语义）
  // - onChartTypeChange 切换图表时【不会】覆盖/清空 shadow，
  //   这样即使中间经过翻牌器等无 group/维度 section 的图表（会静默丢弃该字段），
  //   再切回条形图等支持维度的图表时，shadow 仍保留含维度的完整配置，维度即可恢复。
  const shadowChartConfigRef = useRef<any>(null);

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

  // 原位创建的 datachart 初始 config.computedFields 为空，
  // 数据请求时 getDataChartRequestParams 会从 view.computedFields 补充视图计算字段，
  // 此处不再需要合并 currentDataView.computedFields。
  const enrichComputedFields = useCallback(
    (dc: DataChart): DataChart => dc,
    [],
  );

  // 原位面板内新建/编辑/删除图表级计算字段后，把最新的「图表级」字段集合
  // 同步回 dataChart.config.computedFields 并写回 widget content，使其持久化，
  // 且数据请求参数（computedFields）包含新字段。
  const onChartComputedFieldsChange = useCallback(
    (chartLevelFields: ChartDataViewMeta[]) => {
      if (!dataChart) return;
      const existing = dataChart.config?.computedFields || [];
      // 保留已有的视图级字段，用最新图表级字段覆盖，按 name 去重
      const viewLevel = existing.filter(f => f.isViewComputedFields);
      const nextComputedFields = mergeChartAndViewComputedField(
        viewLevel,
        chartLevelFields,
      );
      const nextDataChart: DataChart = {
        ...dataChart,
        config: {
          ...dataChart.config,
          computedFields: nextComputedFields,
        },
      };
      dispatch(
        boardActions.setDataChartToMap({
          dashboardId: boardId,
          dataCharts: [nextDataChart],
        }),
      );
      syncWidgetContent(nextDataChart);
    },
    [dataChart, boardId, dispatch, syncWidgetContent],
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
      // 每次字段/样式改动后，把 shadow 刷新为最新配置（作为后续切换图表时的迁移源）。
      // 关键：transferChartConfigs(target, source) 会保留【target 的 section 骨架】并用
      // source 的 rows 填充。翻牌器（Scorecard）等图表没有 group/维度 section，nextChartConfig
      // 骨架里不含维度字段——若以 nextChartConfig 为 target，shadow 里的维度字段就会因
      // 找不到对应 section 被静默丢弃，再切回条形图等支持维度的图表时维度即永久丢失。
      // 因此必须以旧 shadow（含完整 section 集合）为 target、nextChartConfig 为 source：
      // 既保留 shadow 中当前图表不具备的 section（如维度），又吸收用户最新的字段/样式改动。
      // shadow 为空（首次）时回退到 nextChartConfig 本身，避免把 null 作为 target 导致崩溃。
      const shadowBase = shadowChartConfigRef.current ?? nextChartConfig;
      const mergedShadow = transferChartConfigs(shadowBase, nextChartConfig);
      shadowChartConfigRef.current = mergedShadow;
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
      // 用「最近一次有效完整配置」（shadow，随字段改动在 handleChartConfigChange
      // 持续刷新）作为迁移源。此处【不要】用「切换前当前配置」覆盖 shadow、也【不要】清空：
      // 翻牌器（Scorecard）等图表没有 group/维度 section，transferChartConfigs
      // 遇到目标无对应 section 会静默丢弃该字段；若在此用当前配置覆盖 shadow，
      // 「柱状图→翻牌器→条形图」这类跨类型切换会让维度在序列中永久丢失。
      // 保留 shadow 为含完整 section 的上一次配置，即可保证切回条形图时维度恢复。
      const sourceChartConfig =
        shadowChartConfigRef.current || dataChart.config.chartConfig;
      // 切换后立即把「切换前的完整配置」存回 shadow：
      // shadow 必须始终是「最近一次有效、含完整 section 集合的配置」，
      // 否则当用户从未在翻牌器内拖拽字段（handleChartConfigChange 不被触发、
      // shadow 始终为初始 null）时，下一次切换会回退到当前的翻牌器 config，
      // 而翻牌器单个 Mixed 受 limit 限制只保留 1 个指标，其余维度/指标在
      // transferChartConfigs 中因目标无对应 section 被静默丢弃，导致切回透视表时只剩 1 个字段。
      // 存下切换前的 source（含全部字段），即可在后续「翻牌器→透视表」时完整迁回。
      shadowChartConfigRef.current = sourceChartConfig;
      // 将旧的维度/指标等数据配置迁移到新图表模板中
      const targetChartConfig = JSON.parse(JSON.stringify(chart?.config || {}));
      const mergedChartConfig = clearRuntimeDateLevelFieldsInChartConfig(
        transferChartConfigs(targetChartConfig, sourceChartConfig),
      );
      const nextDataChart: DataChart = enrichComputedFields({
        ...dataChart,
        viewId: dataChart.viewId || currentDataViewRef.current?.id || '',
        config: {
          ...dataChart.config,
          chartGraphId,
          chartConfig: mergedChartConfig,
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

  // 将 chart 模板的默认配置与 dataChart 中已保存的配置合并，
  // 确保样式配置面板中各项控件的 value 从 default 字段正确填充。
  // 这与 DataChartWidgetCore 中画布渲染时的处理逻辑一致。
  const mergedChartConfig = useMemo(() => {
    if (!chart?.config) return dataChart.config.chartConfig;
    const target = JSON.parse(JSON.stringify(chart.config));
    const source = JSON.parse(JSON.stringify(dataChart.config));
    migrateChartConfig(source);
    return mergeToChartConfig(target, source);
  }, [chart?.config, dataChart.config]);

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
            chartConfig={mergedChartConfig}
            dataChart={dataChart}
            dataView={currentView}
            dataset={dataset}
            aggregation={dataChart.config.aggregation}
            defaultViewId={currentViewId}
            onChartComputedFieldsChange={onChartComputedFieldsChange}
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
// 直接复用 workbench 中已验证的 updateCollectionByAction，保持行为一致。
function produceChartConfig(
  chartConfig: any,
  type: string,
  payload: ChartConfigPayloadType,
): any {
  const configKey = configKeyMap[type];
  if (!configKey || !chartConfig?.[configKey]) {
    return chartConfig;
  }
  const next = { ...chartConfig };
  next[configKey] = updateCollectionByAction(next[configKey], {
    ancestors: payload.ancestors || [],
    value: payload.value,
  });
  return next;
}

const configKeyMap: Record<string, string> = {
  [ChartConfigReducerActionType.DATA]: 'datas',
  [ChartConfigReducerActionType.STYLE]: 'styles',
  [ChartConfigReducerActionType.SETTING]: 'settings',
  [ChartConfigReducerActionType.INTERACTION]: 'interactions',
};

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
