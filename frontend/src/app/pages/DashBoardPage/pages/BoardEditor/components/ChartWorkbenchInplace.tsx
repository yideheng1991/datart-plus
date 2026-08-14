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
  backendChartSelector,
} from 'app/pages/ChartWorkbenchPage/slice/selectors';
import workbenchSlice from 'app/pages/ChartWorkbenchPage/slice';
import {
  fetchAvailableSourceFunctionsForChart,
  fetchDataViewsAction,
  fetchViewDetailAction,
} from 'app/pages/ChartWorkbenchPage/slice/thunks';
import { mergeChartAndViewComputedField } from 'app/utils/chartHelper';
import { boardActions } from 'app/pages/DashBoardPage/pages/Board/slice';
import { selectOrgId } from 'app/pages/MainPage/slice/selectors';
import { IChart } from 'app/types/Chart';
import { DataChart } from 'app/pages/DashBoardPage/pages/Board/slice/types';
import { ChartConfig } from 'app/types/ChartConfig';
import { ChartConfigReducerActionType } from 'app/pages/ChartWorkbenchPage/slice/constant';
import ChartDataSetDTO from 'app/types/ChartDataSet';
import ChartDataView from 'app/types/ChartDataView';
import { ChartDataViewMeta } from 'app/types/ChartDataViewMeta';
import { FC, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { SPACE_XS } from 'styles/StyleConstants';
import useI18NPrefix from 'app/hooks/useI18NPrefix';
import ChartWorkbenchInplaceLayout from './ChartOperationPanelInplaceLayout';

export interface ChartWorkbenchInplaceProps {
  chart?: IChart;
  chartConfig?: ChartConfig;
  // 当前 widget 绑定的数据图表（DataChart），其 config.computedFields 即为「图表级计算字段」。
  // 原位配置场景下必须传入，否则图表级计算字段无法加载（导致其显示为空并在数据请求时解构报错）。
  dataChart?: DataChart;
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
  /** 在原位面板内新建/编辑/删除图表级计算字段后，把最新的「图表级」字段列表
   *  回传上层，由上层同步进 dataChart.config.computedFields 并持久化；否则这些字段
   *  仅存在于 workbench 内存（currentDataView），关闭/刷新后丢失，且数据请求参数
   *  （computedFields）也不会包含它们。 */
  onChartComputedFieldsChange?: (chartLevelFields: ChartDataViewMeta[]) => void;
}

const ChartWorkbenchInplace: FC<ChartWorkbenchInplaceProps> = ({
  chart,
  chartConfig,
  dataChart,
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
  onChartComputedFieldsChange,
}) => {
  const dispatch = useDispatch();
  const language = useSelector(languageSelector);
  const dateFormat = useSelector(dateFormatSelector);
  const orgId = useSelector(selectOrgId);
  // workbench 当前视图（fetchViewDetailAction 填充，含完整 meta 字段）
  const currentDataView = useSelector(currentDataViewSelector);
  // 全局 workbench 是否加载了 backendChart（即「编辑图表」ChartEditor 场景）。
  // 有值时表示 ChartEditor 正在接管 workbench state，此时要避免 Inplace 逻辑
  //（比如 fetchViewDetailAction）与 ChartEditor 自身的 fetchChartAction 竞争，
  // 防止两个 action 交替覆盖 currentDataView 冲掉图表级计算字段。
  const backendChart = useSelector(backendChartSelector);
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
  //
  // 额外监听 currentDataView.id 变化：当 ChartEditor（编辑图表弹窗）关闭时会执行
  // resetWorkbenchState 清空 currentDataView，即使 defaultViewId 没变（视图没换），
  // 也需主动重新拉取该视图详情，否则 currentDataView 长期处于「无 id/无 meta」状态：
  // （1）updateViewMap effect 因 id 缺失无法同步最新 computedFields 到 viewMap；
  // （2）后续 dispatch(updateCurrentDataViewComputedFields) 生成的 currentDataView
  //     只有 computedFields 属性，id/meta 缺失导致若干依赖这些属性的逻辑静默退化。
  //
  // 重要限制：仅当 backendChart 为 falsy（纯 Inplace 场景，ChartEditor 未接管 workbench）
  // 时才执行主动拉取。有 backendChart 时（ChartEditor 打开中），fetchChartAction 已经
  // 负责填充 currentDataView（含完整合并后的 computedFields），若此处再触发
  // fetchViewDetailAction 会与其竞争写同一份 store，交替覆盖导致图表级字段丢失。
  const prevDefaultViewIdRef = useRef<string | undefined>(undefined);
  const prevHasCurrentDataViewRef = useRef<boolean>(false);
  useEffect(() => {
    if (backendChart) {
      // ChartEditor 接管阶段，任何情况都不主动拉视图，避免竞争
      prevDefaultViewIdRef.current = defaultViewId;
      prevHasCurrentDataViewRef.current = Boolean(currentDataView?.id);
      return;
    }
    const hasCurrentId = Boolean(currentDataView?.id);
    const defaultViewIdChanged = prevDefaultViewIdRef.current !== defaultViewId;
    const currentViewCleared =
      prevHasCurrentDataViewRef.current && !hasCurrentId;
    if (defaultViewId && (defaultViewIdChanged || currentViewCleared)) {
      dispatch(fetchViewDetailAction({ viewId: defaultViewId }));
    }
    prevDefaultViewIdRef.current = defaultViewId;
    prevHasCurrentDataViewRef.current = hasCurrentId;
  }, [defaultViewId, currentDataView?.id, dispatch, backendChart]);

  // 将图表级计算字段（dataChart.config.computedFields）合并进 currentDataView.computedFields。
  // 原位配置场景下 backendChart 未被加载，fetchViewDetailAction.fulfilled 只能填充视图级计算字段，
  // 导致图表级计算字段加载不到：字段面板不显示，且数据请求里引用了这些字段却找不到定义，
  // 解析响应时解构失败（Cannot destructure property 'data' ...）。
  //
  // 核心1：只「补全」尚未加载过的图表级字段，绝不在用户删除后复活字段。
  // 用 mergedChartFieldNamesRef 记录「曾经合并过」的图表级字段名：
  //   - 初始化/视图切换时，把 dataChart 中尚未加载的图表级字段并入（一次性）；
  //   - 用户新建某字段后，它已不在 dataChart 的「未加载」集合之外，也不会重复触发。
  //
  // 核心2（自愈逻辑）：若字段 f 满足「dataChart 里有（图表级） + currentDataView 里没有 +
  //   names 里记录过」，说明 f 从 currentDataView 里消失了——这有两种可能：
  //     A) 用户主动删除 → Effect2 会在本帧内把 f 从 dataChart.config.computedFields 移除，
  //        下一轮 Effect1 执行时 dataChart 里就没有 f 了，自然不会再合并。
  //     B) currentDataView 被外部覆盖（fetchViewDetailAction.fulfilled 重写了视图、
  //        或 resetWorkbenchState 清空后重拉），f 无辜丢失。
  //   本轮先把 f 从 names 集合中 delete（但不加入 toAdd）：
  //     - 情况 A 下一轮 dataChart 里就没 f，不会再合并（防复活仍生效）。
  //     - 情况 B 下一轮 dataChart 里仍有 f，names 里已没有 → 正常合并。
  //   从而在不破坏「防删除复活」的前提下，修复了 ref 记录与实际状态脱节导致图表级字段
  //   永久加载失败的回归。
  //
  // 视图标识：使用 defaultViewId（组件绑定的稳定视图 id）而不是 currentDataView.id，
  // 因为 ChartEditor 关闭时 resetWorkbenchState 会清空 currentDataView，避免视图切换
  // 判断或 id 缺失提前 return 导致字段合并不了。
  const mergedChartFieldNamesRef = useRef<{
    viewId?: string;
    names: Set<string>;
  }>({ names: new Set() });
  // 跟踪上一次的 currentDataView.id / meta 引用，用于区分：
  //   - 外部重置：id 或 meta 引用变化（fetchViewDetailAction 覆盖、resetWorkbenchState 清空重拉等）
  //   - 用户局部编辑：id 和 meta 引用都未变，仅 computedFields 变化（新建/删除/编辑计算字段）
  // Effect1 和 Effect2 各用一组 ref，避免在同一轮 render 内 Effect1 先更新 ref 导致 Effect2 判断错误。
  const effect1PrevDVIdRef = useRef<string | undefined>(undefined);
  const effect1PrevDVMetaRef = useRef<ChartDataViewMeta[] | undefined>(undefined);
  useEffect(() => {
    const curId = currentDataView?.id;
    const curMeta = currentDataView?.meta;
    const isExternalReset =
      effect1PrevDVIdRef.current !== curId ||
      effect1PrevDVMetaRef.current !== curMeta;
    // 视图切换或外部重置时重置/清空 names 记录，让该视图对应的图表级字段重新合并
    const viewIdentity = defaultViewId || currentDataView?.id;
    if (mergedChartFieldNamesRef.current.viewId !== viewIdentity) {
      mergedChartFieldNamesRef.current = {
        viewId: viewIdentity,
        names: new Set(),
      };
    } else if (isExternalReset) {
      mergedChartFieldNamesRef.current.names.clear();
    }
    const chartComputedFields: ChartDataViewMeta[] =
      dataChart?.config?.computedFields || [];
    const currentComputedNames = new Set(
      (currentDataView?.computedFields || []).map(f => f.name),
    );
    const toAdd: ChartDataViewMeta[] = [];
    for (const f of chartComputedFields) {
      if (f.isViewComputedFields) {
        continue;
      }
      // currentDataView 里已经有这个字段了 → 无论如何都不需要处理
      if (currentComputedNames.has(f.name)) {
        continue;
      }
      const wasMergedBefore = mergedChartFieldNamesRef.current.names.has(f.name);
      if (!wasMergedBefore) {
        // 从未合并过 → 本轮合并
        mergedChartFieldNamesRef.current.names.add(f.name);
        toAdd.push(f);
      }
      // 注意：用户删除时（非外部重置）不再把字段从 names 中除名。
      // 之前的「自愈除名」是根因：它会和 Effect2 写 dataChart 之间形成窗口期，
      // 若此时 currentDataView 恰好被外部重置，字段因 names 中已除名被误判为新字段而复活。
      // 现在正确的分界是：
      //   - 用户删除：names 里仍有该字段 → 不会误合并；下一轮 Effect2 会把字段从 dataChart 移除，
      //     之后 chartComputedFields 里就没它了，names 中的旧记录不会造成影响。
      //   - 外部重置：本帧开头就清空了 names → 所有 dataChart 里仍存在的图表级字段都会正常重新合并。
    }
    effect1PrevDVIdRef.current = curId;
    effect1PrevDVMetaRef.current = curMeta;
    if (toAdd.length === 0) {
      return;
    }
    const baseComputedFields = currentDataView?.computedFields || [];
    const merged = mergeChartAndViewComputedField(
      baseComputedFields,
      toAdd,
    );
    dispatch(
      workbenchSlice.actions.updateCurrentDataViewComputedFields(merged),
    );
  }, [
    defaultViewId,
    currentDataView?.id,
    currentDataView?.meta,
    currentDataView?.computedFields,
    dataChart?.config?.computedFields,
    dispatch,
  ]);

  // 把原位面板内新建/编辑/删除的「图表级」计算字段回写进 dataChart.config.computedFields。
  // 上方 effect 仅把 dataChart 的图表级字段并入 currentDataView 用于展示；
  // 但新建的图表级字段只存在于 currentDataView（workbench 内存），若不回写：
  //   - 关闭/刷新后字段丢失（未持久化）；
  //   - 数据请求参数 computedFields 不含新字段，引用它时会解构报错。
  // 这里提取 currentDataView 中非视图级的字段（!isViewComputedFields）作为最新图表级集合，
  // 仅在相对 dataChart 已有图表级字段有增/删/改时才通知上层，避免无效循环。
  //
  // 注意：不要求 currentDataView.id 存在——ChartEditor 关闭后 resetWorkbenchState
  // 会清空 currentDataView，用户随即在 Inplace 内新建/删除字段时，currentDataView
  // 只有 computedFields 属性没有 id，但此时仍需立即把字段变更回写到 dataChart，
  // 否则数据请求参数里不含新字段（关闭面板重新进入才有值，与用户报告的现象一致）。
  const effect2PrevDVIdRef = useRef<string | undefined>(undefined);
  const effect2PrevDVMetaRef = useRef<ChartDataViewMeta[] | undefined>(undefined);
  useEffect(() => {
    if (!onChartComputedFieldsChange || !currentDataView?.computedFields) {
      effect2PrevDVIdRef.current = currentDataView?.id;
      effect2PrevDVMetaRef.current = currentDataView?.meta;
      return;
    }
    const curId = currentDataView?.id;
    const curMeta = currentDataView?.meta;
    const isExternalReset =
      effect2PrevDVIdRef.current !== curId ||
      effect2PrevDVMetaRef.current !== curMeta;
    effect2PrevDVIdRef.current = curId;
    effect2PrevDVMetaRef.current = curMeta;
    // 外部重置（id 或 meta 引用变化）时跳过回写：
    // 此时 computedFields 里缺失的图表级字段是因为 currentDataView 被覆盖还未合并回来，
    // 不是用户主动删除。若本帧仍强行回写会把 dataChart.config.computedFields 清空，
    // 反而破坏数据一致性。
    if (isExternalReset) {
      return;
    }
    const chartLevelFields: ChartDataViewMeta[] = (
      currentDataView.computedFields || []
    ).filter(f => !f.isViewComputedFields);
    const prevChartLevel = (dataChart?.config?.computedFields || []).filter(
      f => !f.isViewComputedFields,
    );
    const changed =
      chartLevelFields.length !== prevChartLevel.length ||
      chartLevelFields.some(
        c => !prevChartLevel.some(p => p.name === c.name),
      ) ||
      prevChartLevel.some(p => !chartLevelFields.some(c => c.name === p.name));
    if (changed) {
      onChartComputedFieldsChange(chartLevelFields);
    }
  }, [
    currentDataView?.id,
    currentDataView?.meta,
    currentDataView?.computedFields,
    dataChart?.config?.computedFields,
    onChartComputedFieldsChange,
    dispatch,
  ]);

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
  //
  // 关键修复：基础属性（id、meta 等）二选一，但 computedFields 始终优先取
  // currentDataView.computedFields（如果存在）——即使 currentDataView 只有 computedFields
  // 没有 id（典型场景：ChartEditor 关闭时 resetWorkbenchState 清空 currentDataView，
  // 随后用户在 Inplace 内新建字段，dispatch updateCurrentDataViewComputedFields 后
  // currentDataView 仅含 { computedFields }）。若此时仍按 id 有无二选一，会回退到
  // dataView.computedFields（旧值），导致字段列表看不到新建字段；关闭再打开面板
  // 又能看到（因为重新挂载走完整流程），正是用户报告的现象。
  const effectiveDataView = useMemo(() => {
    const baseDataView = currentDataView?.id ? currentDataView : dataView;
    if (!baseDataView) {
      return undefined;
    }
    if (
      currentDataView?.computedFields &&
      currentDataView.computedFields !== baseDataView.computedFields
    ) {
      return {
        ...baseDataView,
        computedFields: currentDataView.computedFields,
      };
    }
    return baseDataView;
  }, [currentDataView, dataView]);

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
