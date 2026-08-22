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

import {
  BackgroundCondition,
  Conditions,
  CornerCell,
  Data,
  IntervalCondition,
  Meta,
  S2CellType,
  S2Style,
  S2Theme,
  SortParam,
  SpreadSheet,
  TargetCellInfo,
  TextCondition,
  ViewMeta,
} from '@antv/s2';
import {
  ChartDataSectionType,
  ChartInteractionEvent,
  SortActionType,
} from 'app/constants';
import { ChartDrillOption } from 'app/models/ChartDrillOption';
import ReactChart from 'app/models/ReactChart';
import {
  ChartConfig,
  ChartDataConfig,
  ChartDataSectionField,
  ChartStyleConfig,
  SelectedItem,
} from 'app/types/ChartConfig';
import { ChartCategory } from 'app/types/ChartMetadata';
import ChartDataSetDTO, { IChartDataSet } from 'app/types/ChartDataSet';
import { BrokerContext, BrokerOption } from 'app/types/ChartLifecycleBroker';
import {
  compareSelectedItems,
  getColumnRenderName,
  getStyles,
  toFormattedValue,
  transformToDataSet,
} from 'app/utils/chartHelper';
import { isUndefined } from 'utils/object';
import AntVS2Wrapper from './AntVS2Wrapper';
import Config from './config';
import { AndvS2Config } from './types';

const valueOrDefault = (value: any, defaultValue: any) =>
  value === undefined || value === null ? defaultValue : value;

const toPositiveNumber = (value: any, defaultValue: number) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : defaultValue;
};

const toNonNegativeInteger = (value: any) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : 0;
};

const toFiniteNumber = (value: any) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

class PivotSheetChart extends ReactChart {
  static icon = `<svg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' aria-hidden='true' role='img' width='1em' height='1em' preserveAspectRatio='xMidYMid meet' viewBox='0 0 24 24'><path d='M10 8h11V5c0-1.1-.9-2-2-2h-9v5zM3 8h5V3H5c-1.1 0-2 .9-2 2v3zm2 13h3V10H3v9c0 1.1.9 2 2 2zm8 1l-4-4l4-4zm1-9l4-4l4 4zm.58 6H13v-2h1.58c1.33 0 2.42-1.08 2.42-2.42V13h2v1.58c0 2.44-1.98 4.42-4.42 4.42z' fill='gray'/></svg>`;

  useIFrame = false;
  isISOContainer = 'piovt-sheet';
  config = Config;
  chart: null | SpreadSheet = null;
  private updateOptions: any = {};
  private lastRowsConfig: ChartDataSectionField[] = [];
  private hierarchyCollapse: boolean = true;
  private drillLevel: number = 0;
  private collapsedRows: Record<string, boolean> = {};
  private selectedItems: SelectedItem[] = [];
  // 拖拽调整后的宽高（会话内保持，用于重渲染时回填，避免被默认值重置）
  private resizedStyle: Record<string, number> = {};
  // 配置中每列列宽映射（S2 field key -> width）
  private columnWidthsMap: Map<string, { width?: number }> = new Map();
  // 配置中不参与汇总的列字段（S2 field key 集合）
  private noTotalsFieldKeys: Set<string> = new Set();

  constructor() {
    super(AntVS2Wrapper, {
      id: 'piovt-sheet', // TODO(Stephen): should fix typo pivot
      name: 'viz.palette.graph.names.pivotSheet',
      icon: PivotSheetChart.icon,
      category: ChartCategory.Table,
    });
    this.meta.requirements = [{}];
  }

  onUpdated(options: BrokerOption, context: BrokerContext): void {
    if (!this.isMatchRequirement(options.config)) {
      this.adapter?.unmount();
      return;
    }

    this.updateOptions = this.getOptions(
      context,
      options.dataset!,
      options.config!,
      options.drillOption!,
      options.selectedItems,
    );
    this.adapter?.updated(this.updateOptions);
  }

  onResize(options: BrokerOption, context: BrokerContext) {
    if (this.updateOptions?.options) {
      this.updateOptions.options = Object.assign(
        {
          ...this.updateOptions.options,
        },
        { width: context.width, height: context.height },
      );
      this.adapter?.updated(this.updateOptions);
    }
  }

  onUnMount(options: BrokerOption, context: BrokerContext): void {
    this.lastRowsConfig = [];
    this.hierarchyCollapse = true;
    this.drillLevel = 0;
    this.collapsedRows = {};
    this.adapter?.unmount();
  }

  getOptions(
    context,
    dataset: ChartDataSetDTO,
    config: ChartConfig,
    drillOption: ChartDrillOption,
    selectedItems?: SelectedItem[],
  ): AndvS2Config {
    if (!dataset || !config) {
      return {
        options: {},
      };
    }
    if (!selectedItems?.length && this.selectedItems.length && this.chart) {
      this.chart.interaction.reset();
    }

    const dataConfigs: ChartDataConfig[] = config.datas || [];
    const styleConfigs = config.styles || [];
    const settingConfigs = config.settings || [];
    const chartDataSet = transformToDataSet(
      dataset.rows,
      dataset.columns,
      dataConfigs,
    );

    const rowSectionConfigRows: ChartDataSectionField[] = dataConfigs
      .filter(c => c.type === ChartDataSectionType.Group)
      .filter(c => c.key === 'row')
      .flatMap(config => config.rows || []);

    const columnSectionConfigRows: ChartDataSectionField[] = dataConfigs
      .filter(c => c.type === ChartDataSectionType.Group)
      .filter(c => c.key === 'column')
      .flatMap(config => config.rows || []);

    const metricsSectionConfigRows: ChartDataSectionField[] = dataConfigs
      .filter(c => c.type === ChartDataSectionType.Aggregate)
      .flatMap(config => config.rows || []);

    const infoSectionConfigRows: ChartDataSectionField[] = dataConfigs
      .filter(c => c.type === ChartDataSectionType.Info)
      .flatMap(config => config.rows || []);

    const [
      hierarchyType,
      metricPlacement,
      widthType,
      cornerText,
      showSeriesNumber,
      emptyPlaceholder,
    ] = getStyles(
      styleConfigs,
      ['layout'],
      [
        'hierarchyType',
        'metricPlacement',
        'widthType',
        'cornerText',
        'showSeriesNumber',
        'emptyPlaceholder',
      ],
    );
    const [
      dataWidth,
      dataHeight,
      rowWidth,
      treeWidth,
      columnHeight,
      wordWrap,
      maxLines,
    ] = getStyles(
      styleConfigs,
      ['cell'],
      [
        'dataWidth',
        'dataHeight',
        'rowWidth',
        'treeWidth',
        'columnHeight',
        'wordWrap',
        'maxLines',
      ],
    );
    const [
      freezeRowHeader,
      frozenRows,
      frozenColumns,
      enableResize,
      enableCopy,
      copyWithHeader,
      hoverHighlight,
      selectedHighlight,
      brushSelection,
    ] = getStyles(
      styleConfigs,
      ['interaction'],
      [
        'freezeRowHeader',
        'frozenRows',
        'frozenColumns',
        'enableResize',
        'enableCopy',
        'copyWithHeader',
        'hoverHighlight',
        'selectedHighlight',
        'brushSelection',
      ],
    );
    const [
      aggregation,
      rowGrandTotal,
      rowSubTotal,
      rowTotalAtTop,
      columnGrandTotal,
      columnSubTotal,
      columnTotalAtLeft,
      rowTotalsSettings,
    ] = getStyles(
      styleConfigs,
      ['totals'],
      [
        'aggregation',
        'rowGrandTotal',
        'rowSubTotal',
        'rowTotalAtTop',
        'columnGrandTotal',
        'columnSubTotal',
        'columnTotalAtLeft',
        'rowTotalsSettings',
      ],
    );

    // ---- legacy config fallbacks (old style/summary settings) ----
    const [enableExpandRow] = getStyles(
      styleConfigs,
      ['style'],
      ['enableExpandRow'],
    );
    const [metricNameShowIn] = getStyles(
      styleConfigs,
      ['style'],
      ['metricNameShowIn'],
    );
    const [enableHoverHighlight, enableSelectedHighlight] = getStyles(
      styleConfigs,
      ['style'],
      ['enableHoverHighlight', 'enableSelectedHighlight'],
    );
    const [summaryAggregation] = getStyles(
      settingConfigs,
      ['summaryAggregation'],
      ['aggregation'],
    );
    const [calcSubAggregation] = getStyles(
      settingConfigs,
      ['calcSubAggregation'],
      ['aggregation'],
    );
    const [
      enableRowTotal,
      rowTotalPosition,
      enableRowSubTotal,
      rowSubTotalPosition,
    ] = getStyles(
      settingConfigs,
      ['rowSummary'],
      ['enableTotal', 'totalPosition', 'enableSubTotal', 'subTotalPosition'],
    );
    const [
      enableColTotal,
      colTotalPosition,
      enableColSubTotal,
      colSubTotalPosition,
    ] = getStyles(
      settingConfigs,
      ['colSummary'],
      ['enableTotal', 'totalPosition', 'enableSubTotal', 'subTotalPosition'],
    );

    const resolvedHierarchyType = valueOrDefault(
      hierarchyType,
      enableExpandRow ? 'tree' : 'grid',
    );
    const resolvedMetricPlacement = valueOrDefault(
      metricPlacement,
      metricNameShowIn === false ? 'rows' : 'columns',
    );
    const resolvedHoverHighlight = valueOrDefault(
      hoverHighlight,
      valueOrDefault(enableHoverHighlight, true),
    );
    const resolvedSelectedHighlight = valueOrDefault(
      selectedHighlight,
      valueOrDefault(enableSelectedHighlight, true),
    );
    const resolvedAggregation = valueOrDefault(
      aggregation,
      valueOrDefault(summaryAggregation, 'SUM'),
    );
    const resolvedWidthType = valueOrDefault(widthType, 'compact');

    const valueInCols = resolvedMetricPlacement !== 'rows';
    const rowKeys = rowSectionConfigRows.map(config =>
      chartDataSet.getFieldKey(config),
    );
    const columnKeys = columnSectionConfigRows.map(config =>
      chartDataSet.getFieldKey(config),
    );
    const metricKeys = metricsSectionConfigRows.map(config =>
      chartDataSet.getFieldKey(config),
    );
    // dataWidth 兼容两种结构：number（旧配置）或 { width, columnWidths }（新配置）
    const columnWidths =
      dataWidth && typeof dataWidth === 'object'
        ? (dataWidth as any).columnWidths || []
        : [];
    // per-column width settings keyed by S2 field key (case-insensitive)
    this.columnWidthsMap = new Map<string, { width?: number }>();
    (Array.isArray(columnWidths) ? columnWidths : []).forEach((item: any) => {
      if (item && item.key) {
        this.columnWidthsMap.set(String(item.key).toLowerCase(), item);
      }
    });
    // per-column totals settings keyed by S2 field key (case-insensitive)
    this.noTotalsFieldKeys = new Set(
      (Array.isArray(rowTotalsSettings) ? rowTotalsSettings : [])
        .filter((item: any) => item && item.key && item.totals === false)
        .map((item: any) => String(item.key).toLowerCase()),
    );
    const isTree =
      resolvedHierarchyType === 'tree' ||
      resolvedHierarchyType === 'grid-tree';

    if (isTree) {
      if (
        this.lastRowsConfig.map(lrc => lrc.uid).join('-') !==
        rowSectionConfigRows.map(lrc => lrc.uid).join('-')
      ) {
        this.drillLevel = 0;
        this.collapsedRows = {};
        this.getCollapsedRows(rowSectionConfigRows, chartDataSet, true);
        this.lastRowsConfig = rowSectionConfigRows;
      } else {
        this.getCollapsedRows(rowSectionConfigRows, chartDataSet);
      }
    } else {
      if (Object.keys(this.collapsedRows).length) {
        this.lastRowsConfig = [];
        this.hierarchyCollapse = true;
        this.drillLevel = 0;
        this.collapsedRows = {};
      }
    }

    return {
      options: {
        width: context?.width,
        height: context?.height,
        hierarchyType: resolvedHierarchyType,
        cornerText: cornerText ? String(cornerText) : '',
        cornerExtraFieldText: valueInCols
          ? context.translator('summary.number')
          : '',
        seriesNumber: {
          enable: valueOrDefault(showSeriesNumber, false),
        },
        placeholder: {
          cell: valueOrDefault(emptyPlaceholder, '-'),
        },
        frozen: {
          rowHeader: valueOrDefault(freezeRowHeader, true),
          rowCount: toNonNegativeInteger(frozenRows),
          colCount: toNonNegativeInteger(frozenColumns),
        },
        totals: {
          row: {
            showGrandTotals: valueOrDefault(
              rowGrandTotal,
              valueOrDefault(enableRowTotal, false),
            ),
            showSubTotals:
              rowKeys.length > 1 &&
              valueOrDefault(
                rowSubTotal,
                valueOrDefault(enableRowSubTotal, false),
              ),
            subTotalsDimensions: rowKeys.slice(0, -1),
            reverseGrandTotalsLayout: valueOrDefault(
              rowTotalAtTop,
              valueOrDefault(rowTotalPosition, true),
            ),
            reverseSubTotalsLayout: valueOrDefault(
              rowTotalAtTop,
              valueOrDefault(rowSubTotalPosition, true),
            ),
            calcGrandTotals: {
              aggregation: resolvedAggregation,
            },
            calcSubTotals: {
              aggregation: valueOrDefault(calcSubAggregation, resolvedAggregation),
            },
            grandTotalsLabel: context.translator('summary.total'),
            subTotalsLabel: context.translator('summary.subTotal'),
          },
          col: {
            showGrandTotals: valueOrDefault(
              columnGrandTotal,
              valueOrDefault(enableColTotal, false),
            ),
            showSubTotals:
              columnKeys.length > 1 &&
              valueOrDefault(
                columnSubTotal,
                valueOrDefault(enableColSubTotal, false),
              ),
            subTotalsDimensions: columnKeys.slice(0, -1),
            reverseGrandTotalsLayout: valueOrDefault(
              columnTotalAtLeft,
              valueOrDefault(colTotalPosition, true),
            ),
            reverseSubTotalsLayout: valueOrDefault(
              columnTotalAtLeft,
              valueOrDefault(colSubTotalPosition, true),
            ),
            calcGrandTotals: {
              aggregation: resolvedAggregation,
            },
            calcSubTotals: {
              aggregation: valueOrDefault(calcSubAggregation, resolvedAggregation),
            },
            grandTotalsLabel: context.translator('summary.total'),
            subTotalsLabel: context.translator('summary.subTotal'),
          },
        },
        conditions: this.getConditions(
          styleConfigs,
          metricsSectionConfigRows,
          chartDataSet,
        ),
        style: this.getCellStyle(
          styleConfigs,
          resolvedWidthType,
          isTree,
          this.collapsedRows,
          this.columnWidthsMap,
        ),
        interaction: {
          autoResetSheetStyle: false,
          hoverHighlight: resolvedHoverHighlight
            ? {
                rowHeader: true,
                colHeader: true,
                currentRow: true,
                currentCol: true,
              }
            : false,
          selectedCellHighlight: resolvedSelectedHighlight
            ? {
                rowHeader: true,
                colHeader: true,
                currentRow: true,
                currentCol: true,
              }
            : false,
          selectedCellsSpotlight: false,
          resize: valueOrDefault(enableResize, true)
            ? {
                rowCellVertical: true,
                cornerCellHorizontal: true,
                colCellHorizontal: true,
                colCellVertical: true,
                minCellWidth: 40,
                minCellHeight: 20,
              }
            : false,
          copy: {
            enable: valueOrDefault(enableCopy, true),
            withFormat: true,
            withHeader: valueOrDefault(copyWithHeader, true),
          },
          brushSelection: valueOrDefault(brushSelection, true),
          multiSelection: true,
          rangeSelection: true,
          selectedCellMove: true,
          overscrollBehavior: 'contain',
        },
        tooltip: {
          enable: true,
        },
        // 未参与汇总的列，其汇总单元格显示为 '-'（普通 facet 不触发 data-cell:render，故在此改 meta）
        layoutCellMeta: cellMeta => {
          if (
            cellMeta?.isTotals &&
            this.noTotalsFieldKeys.has(
              String(cellMeta.valueField).toLowerCase(),
            )
          ) {
            return { ...cellMeta, fieldValue: '-' };
          }
          return cellMeta;
        },
        showDefaultHeaderActionIcon: false,
        hd: true,
        csp: {
          iconStrategy: 'path',
        },
        transformCanvasConfig: () => ({
          supportsCSSTransform: true,
        }),
        cornerCell: this.getCornerCell(cornerText),
      },
      dataCfg: {
        fields: {
          rows: rowKeys,
          columns: columnKeys,
          values: metricKeys,
          valueInCols,
        },
        meta: rowSectionConfigRows
          .concat(columnSectionConfigRows)
          .concat(metricsSectionConfigRows)
          .concat(infoSectionConfigRows)
          .map(config => {
            return {
              field: chartDataSet.getFieldKey(config),
              name: getColumnRenderName(config),
              formatter: (value?: string | number) =>
                toFormattedValue(value, config?.format),
            } as Meta;
          }),
        data: chartDataSet?.map(row => row.convertToObject()) as Data[],
        sortParams: this.getTableSorters(
          rowSectionConfigRows
            .concat(columnSectionConfigRows)
            .concat(metricsSectionConfigRows),
          chartDataSet,
        ),
      },
      themeCfg: {
        theme: this.getTheme(styleConfigs),
      },
      onRowCellCollapsed: ({ isCollapsed, node }) => {
        this.collapsedRows[node.id] = isCollapsed;
        this.changeDrillConfig(rowSectionConfigRows, drillOption);
      },
      onRowCellAllCollapsed: isCollapsed => {
        this.hierarchyCollapse = !isCollapsed;
        Object.keys(this.collapsedRows).forEach(k => {
          this.collapsedRows[k] = this.hierarchyCollapse;
        });
        this.changeDrillConfig(rowSectionConfigRows, drillOption, true);
      },
      onSelected: (cells: S2CellType<ViewMeta>[]) => {
        this.changeSelectedItems(cells, chartDataSet);
      },
      onDataCellClick: (cell: TargetCellInfo) => {
        const state = this.chart?.interaction.getState();
        this.changeSelectedItems(state?.interactedCells || [], chartDataSet);
      },
      getSpreadSheet: getSpreadSheet => {
        this.chart = getSpreadSheet;
      },
      onLayoutResizeRowWidth: ({ info }) => {
        if (info?.resizedWidth) {
          this.resizedStyle.rowWidth = info.resizedWidth;
        }
      },
      onLayoutResizeTreeWidth: ({ info }) => {
        if (info?.resizedWidth) {
          this.resizedStyle.treeWidth = info.resizedWidth;
        }
      },
      onLayoutResizeColWidth: ({ info }) => {
        if (info?.resizedWidth) {
          this.resizedStyle.dataWidth = info.resizedWidth;
        }
      },
      onLayoutResizeRowHeight: ({ info }) => {
        if (info?.resizedHeight) {
          this.resizedStyle.dataHeight = info.resizedHeight;
        }
      },
      onLayoutResizeColHeight: ({ info }) => {
        if (info?.resizedHeight) {
          this.resizedStyle.columnHeight = info.resizedHeight;
        }
      },
      onLayoutResizeSeriesWidth: ({ seriesNumberWidth }) => {
        if (seriesNumberWidth) {
          this.resizedStyle.seriesWidth = seriesNumberWidth;
        }
      },
    };
  }

  // 未参与汇总的列，其汇总单元格显示为 '-'（已通过 options.layoutCellMeta 实现）

  changeSelectedItems(
    cells: S2CellType<ViewMeta>[],
    chartDataSet: IChartDataSet<string>,
  ) {
    const selectedItems: SelectedItem[] = [];

    const _getDataConfig = (data?) => {
      if (!data) return;
      const dataConfig = Object.keys(data).reduce((acc, cur) => {
        if (chartDataSet.getOriginFieldInfo(cur)) {
          return {
            ...acc,
            [getColumnRenderName(chartDataSet.getOriginFieldInfo(cur))]:
              data[cur],
          };
        }
        return acc;
      }, {});
      return Object.keys(dataConfig).length ? dataConfig : undefined;
    };

    const _getIndex = (colConfig?) => {
      const config = _getDataConfig(colConfig);
      if (config) {
        return Object.values(config).join(',');
      }
      return '';
    };

    cells.forEach(v => {
      const { data, rowQuery, colQuery } = v.getMeta();
      const index: string = _getIndex(rowQuery) + ',' + _getIndex(colQuery);
      const selectedItemIndex = selectedItems.findIndex(v => v.index === index);
      if (
        selectedItemIndex < 0 &&
        data &&
        (_getDataConfig(rowQuery) || _getDataConfig(colQuery))
      ) {
        selectedItems.push({
          index,
          data: {
            rowData: _getDataConfig(data)!,
          },
        });
      } else if (selectedItemIndex >= 0) {
        selectedItems[selectedItemIndex] = {
          index: selectedItems[selectedItemIndex].index,
          data: {
            rowData: {
              ...selectedItems[selectedItemIndex].data.rowData,
              ..._getDataConfig(data)!,
            },
          },
        };
      }
    });
    if (compareSelectedItems(selectedItems, this.selectedItems)) {
      this.selectedItems = selectedItems;
      this.mouseEvents
        ?.find(v => v.name === 'click')
        ?.callback({
          selectedItems,
          interactionType: ChartInteractionEvent.Select,
          type: 'click',
          chartType: 'pivotSheet',
        });
    }
  }

  changeDrillConfig(
    rowSectionConfigRows: ChartDataSectionField[],
    drillOption: ChartDrillOption,
    isCollapse: boolean = false,
  ) {
    const collapsedConfig: Record<string, boolean[]> = {};
    Object.keys(this.collapsedRows).forEach(k => {
      const pathArr = k.split('[&]');
      if (isUndefined(collapsedConfig[pathArr.length])) {
        collapsedConfig[pathArr.length] = [this.collapsedRows[k]];
      } else {
        collapsedConfig[pathArr.length].push(this.collapsedRows[k]);
      }
    });
    let level: number = 0;
    while (level < rowSectionConfigRows.length - 1) {
      if (
        (!isCollapse && !collapsedConfig[level + 2]) ||
        collapsedConfig[level + 2]?.every(c => c) ||
        (isCollapse &&
          collapsedConfig[level + 2] &&
          collapsedConfig[level + 2].every(c => c))
      ) {
        break;
      }
      level++;
    }

    if (this.drillLevel === level) return;
    if (this.drillLevel < level) {
      let index = 0;
      while (level - this.drillLevel > index) {
        drillOption?.expandDown();
        index++;
      }
    } else if (this.drillLevel > level) {
      drillOption?.expandUp(rowSectionConfigRows[level]);
    }
    this.drillLevel = level;
    this.mouseEvents
      ?.find(v => v.name === 'click')
      ?.callback({
        interactionType: ChartInteractionEvent.Drilled,
        drillOption,
        type: 'click',
        chartType: 'pivotSheet',
      });
  }

  getCollapsedRows(
    rowSectionConfigRows: ChartDataSectionField[],
    chartDataSet: IChartDataSet<string>,
    initState?: boolean,
  ) {
    chartDataSet.forEach(dc => {
      let path = 'root';
      rowSectionConfigRows.forEach((rc, index) => {
        if (
          !isUndefined(dc.getCell(rc)) &&
          index < rowSectionConfigRows.length - 1
        ) {
          path = path + '[&]' + dc.getCell(rc);
          this.collapsedRows[path] = !isUndefined(initState)
            ? Boolean(initState)
            : isUndefined(this.collapsedRows?.[path])
            ? this.hierarchyCollapse
            : this.collapsedRows[path];
        }
      });
    });
    if (Object.values(this.collapsedRows).every(v => v)) {
      this.hierarchyCollapse = true;
    } else if (Object.values(this.collapsedRows).every(v => !v)) {
      this.hierarchyCollapse = false;
    }
  }

  private getCellStyle(
    style: ChartStyleConfig[],
    widthType: string,
    isTree: boolean,
    collapsedRows: Record<string, boolean>,
    columnWidthsMap: Map<string, { width?: number }>,
  ): S2Style {
    const [dataWidth, dataHeight, rowWidth, treeWidth, columnHeight, wordWrap, maxLines] =
      getStyles(
        style,
        ['cell'],
        [
          'dataWidth',
          'dataHeight',
          'rowWidth',
          'treeWidth',
          'columnHeight',
          'wordWrap',
          'maxLines',
        ],
      );
    const isCompact = widthType === 'compact';
    // dataWidth 兼容两种结构：number（旧配置）或 { width, columnWidths }（新配置）
    const resolvedDataWidth =
      dataWidth && typeof dataWidth === 'object'
        ? (dataWidth as any).width
        : dataWidth;
    return {
      layoutWidthType: widthType as S2Style['layoutWidthType'],
      compactMinWidth: 40,
      dataCell: {
        width: isCompact
          ? toPositiveNumber(
              valueOrDefault(this.resizedStyle.dataWidth, resolvedDataWidth),
              120,
            )
          : undefined,
        height: toPositiveNumber(
          valueOrDefault(this.resizedStyle.dataHeight, dataHeight),
          32,
        ),
        wordWrap: valueOrDefault(wordWrap, false),
        maxLines: toPositiveNumber(maxLines, 2),
        textOverflow: 'ellipsis',
      },
      rowCell: {
        width: isCompact
          ? toPositiveNumber(
              valueOrDefault(this.resizedStyle.rowWidth, rowWidth),
              120,
            )
          : null,
        treeWidth: isCompact
          ? toPositiveNumber(
              valueOrDefault(this.resizedStyle.treeWidth, treeWidth),
              220,
            )
          : undefined,
        wordWrap: valueOrDefault(wordWrap, false),
        maxLines: toPositiveNumber(maxLines, 2),
        textOverflow: 'ellipsis',
        collapseFields: isTree ? collapsedRows : null,
      },
      colCell: {
        width: isCompact
          ? (colNode: any) => {
              // 优先级: 拖拽宽度 > 配置列宽 > 默认列宽
              // 指标挂列时列节点 field 为 $$extra$$，真实指标字段在 query[$$extra$$]
              const field =
                colNode?.field === '$$extra$$'
                  ? colNode?.query?.['$$extra$$']
                  : colNode?.field;
              const setting = field
                ? columnWidthsMap.get(String(field).toLowerCase())
                : undefined;
              return setting?.width
                ? setting.width
                : toPositiveNumber(
                    valueOrDefault(
                      this.resizedStyle.dataWidth,
                      resolvedDataWidth,
                    ),
                    120,
                  );
            }
          : null,
        height: toPositiveNumber(
          valueOrDefault(this.resizedStyle.columnHeight, columnHeight),
          32,
        ),
        wordWrap: valueOrDefault(wordWrap, false),
        maxLines: toPositiveNumber(maxLines, 2),
        textOverflow: 'ellipsis',
      },
      cornerCell: {
        wordWrap: valueOrDefault(wordWrap, false),
        maxLines: toPositiveNumber(maxLines, 2),
        textOverflow: 'ellipsis',
      },
    };
  }

  private getTableSorters(
    sectionConfigRows: ChartDataSectionField[],
    chartDataSet: IChartDataSet<string>,
  ): Array<SortParam> {
    return sectionConfigRows
      .map(config => {
        if (!config?.sort?.type || config?.sort?.type === SortActionType.None) {
          return null;
        }
        const sortFieldId = chartDataSet.getFieldKey(config);
        if (config.sort.type === SortActionType.Customize) {
          return {
            sortFieldId,
            sortBy: config.sort.value as string[],
          };
        }
        const isASC = config.sort.type === SortActionType.ASC;
        return {
          sortFieldId,
          sortFunc: params => {
            const { data } = params;
            return data?.sort((a, b) =>
              isASC ? a?.localeCompare(b) : b?.localeCompare(a),
            );
          },
        };
      })
      .filter(Boolean) as Array<SortParam>;
  }

  private getConditions(
    styleConfigs: ChartStyleConfig[],
    metricFields: ChartDataSectionField[],
    chartDataSet: IChartDataSet<string>,
  ): Conditions {
    const [
      enableTextColor,
      negativeColor,
      positiveColor,
      enableBackground,
      threshold,
      belowColor,
      aboveColor,
      enableDataBar,
      dataBarColor,
    ] = getStyles(
      styleConfigs,
      ['condition'],
      [
        'enableTextColor',
        'negativeColor',
        'positiveColor',
        'enableBackground',
        'threshold',
        'belowColor',
        'aboveColor',
        'enableDataBar',
        'dataBarColor',
      ],
    );
    const text: TextCondition[] = [];
    const background: BackgroundCondition[] = [];
    const interval: IntervalCondition[] = [];

    metricFields.forEach(field => {
      const fieldKey = chartDataSet.getFieldKey(field);
      if (valueOrDefault(enableTextColor, true)) {
        text.push({
          field: fieldKey,
          mapping: fieldValue => {
            const number = toFiniteNumber(fieldValue);
            if (number === null || number === 0) {
              return null;
            }
            return {
              fill:
                number < 0
                  ? valueOrDefault(negativeColor, '#cf1322')
                  : valueOrDefault(positiveColor, '#237804'),
            };
          },
        });
      }
      if (valueOrDefault(enableBackground, false)) {
        background.push({
          field: fieldKey,
          mapping: fieldValue => {
            const number = toFiniteNumber(fieldValue);
            if (number === null) {
              return null;
            }
            return {
              fill:
                number < valueOrDefault(threshold, 0)
                  ? valueOrDefault(belowColor, '#fff1f0')
                  : valueOrDefault(aboveColor, '#f6ffed'),
              intelligentReverseTextColor: true,
            };
          },
        });
      }
      if (valueOrDefault(enableDataBar, false)) {
        const values = chartDataSet
          .map(row => toFiniteNumber(row.getCell(field)))
          .filter(value => value !== null) as number[];
        if (values.length) {
          const minValue = Math.min(...values);
          const maxValue = Math.max(...values);
          interval.push({
            field: fieldKey,
            mapping: () => ({
              fill: valueOrDefault(dataBarColor, '#5b8ff9'),
              minValue,
              maxValue,
            }),
          });
        }
      }
    });

    return { text, background, interval };
  }

  private getCornerCell(cornerText: string) {
    if (!cornerText) {
      return undefined;
    }
    const cell = (viewMeta: any, spreadsheet: SpreadSheet, headerConfig: any) => {
      class DatartCornerCell extends CornerCell {
        getFormattedFieldValue() {
          const { cornerType, field } = this.meta as any;
          const [firstRowField] = (this.spreadsheet.dataSet.fields
            .rows || []) as string[];
          if (
            cornerType === 'row' &&
            (!field || field === firstRowField)
          ) {
            return {
              value: cornerText,
              formattedValue: cornerText,
            };
          }
          return super.getFormattedFieldValue();
        }
      }
      return new DatartCornerCell(viewMeta, spreadsheet, headerConfig);
    };
    return cell;
  }

  private getTheme(styleConfigs: ChartStyleConfig[]): S2Theme {
    const [headerAlign, dataAlign] = getStyles(
      styleConfigs,
      ['cell'],
      ['headerAlign', 'dataAlign'],
    );
    const [
      headerBackground,
      headerTextColor,
      bodyBackground,
      alternateBackground,
      bodyTextColor,
      borderColor,
      selectedColor,
      headerFont,
      bodyFont,
    ] = getStyles(
      styleConfigs,
      ['theme'],
      [
        'headerBackground',
        'headerTextColor',
        'bodyBackground',
        'alternateBackground',
        'bodyTextColor',
        'borderColor',
        'selectedColor',
        'headerFont',
        'bodyFont',
      ],
    );
    // legacy font/align fallback
    const [tableHeaderFont, tableHeaderAlign] = getStyles(
      styleConfigs,
      ['tableHeaderStyle'],
      ['font', 'align'],
    );
    const [tableBodyFont, tableBodyAlign] = getStyles(
      styleConfigs,
      ['tableBodyStyle'],
      ['font', 'tableAlign'],
    );
    // legacy pivotSheetTheme fallback (themeType + colors array)
    const [legacyThemeConfig] = getStyles(
      styleConfigs,
      ['theme'],
      ['themeType'],
    );
    const legacyColors = (legacyThemeConfig as any)?.colors as
      | string[]
      | undefined;

    const resolvedHeaderFont = valueOrDefault(headerFont, tableHeaderFont);
    const resolvedBodyFont = valueOrDefault(bodyFont, tableBodyFont);
    const resolvedHeaderAlign = valueOrDefault(
      headerAlign,
      valueOrDefault(tableHeaderAlign, 'center'),
    );
    // S2 的 textAlign 为全局属性，无法按列单独设置。
    const resolvedDataAlign = valueOrDefault(
      dataAlign,
      valueOrDefault(tableBodyAlign, 'right'),
    );
    const resolvedHeaderBackground = valueOrDefault(
      headerBackground,
      valueOrDefault(legacyColors?.[3], '#d9eaf7'),
    );
    const resolvedHeaderTextColor = valueOrDefault(
      headerTextColor,
      valueOrDefault(legacyColors?.[0], '#1f4e78'),
    );
    const resolvedBodyBackground = valueOrDefault(
      bodyBackground,
      valueOrDefault(legacyColors?.[1], '#ffffff'),
    );
    const resolvedAlternateBackground = valueOrDefault(
      alternateBackground,
      valueOrDefault(legacyColors?.[8], '#f7fbff'),
    );
    const resolvedBodyTextColor = valueOrDefault(
      bodyTextColor,
      valueOrDefault(legacyColors?.[13], '#262626'),
    );
    const resolvedBorderColor = valueOrDefault(
      borderColor,
      valueOrDefault(legacyColors?.[9], '#b8c8d8'),
    );
    const resolvedSelectedColor = valueOrDefault(
      selectedColor,
      valueOrDefault(legacyColors?.[2], '#bae7ff'),
    );

    const toTextTheme = (font, fill, textAlign, forceBold = false) => ({
      fontFamily:
        font?.fontFamily || 'Microsoft YaHei, PingFang SC, Arial, sans-serif',
      fontSize: toPositiveNumber(font?.fontSize, 12),
      fontWeight: forceBold
        ? font?.fontWeight === 'normal'
          ? 'bold'
          : valueOrDefault(font?.fontWeight, 'bold')
        : valueOrDefault(font?.fontWeight, 'normal'),
      fontStyle: valueOrDefault(font?.fontStyle, 'normal'),
      fill,
      textAlign,
      textBaseline: 'middle' as any,
    });
    const getCellTheme = ({
      backgroundColor,
      crossBackgroundColor,
      borderColor: cellBorderColor,
      selectedColor: cellSelectedColor,
    }) => ({
      backgroundColor,
      crossBackgroundColor,
      backgroundColorOpacity: 1,
      horizontalBorderColor: cellBorderColor,
      horizontalBorderColorOpacity: 1,
      verticalBorderColor: cellBorderColor,
      verticalBorderColorOpacity: 1,
      horizontalBorderWidth: 1,
      verticalBorderWidth: 1,
      padding: {
        top: 8,
        right: 8,
        bottom: 8,
        left: 8,
      },
      interactionState: {
        hover: {
          backgroundColor: cellSelectedColor,
          backgroundOpacity: 0.45,
        },
        selected: {
          backgroundColor: cellSelectedColor,
          backgroundOpacity: 0.75,
          borderColor: cellSelectedColor,
          borderWidth: 1,
        },
        prepareSelect: {
          borderColor: cellSelectedColor,
          borderWidth: 1,
          borderOpacity: 1,
        },
      },
    });

    const headerText = toTextTheme(
      resolvedHeaderFont,
      resolvedHeaderTextColor,
      resolvedHeaderAlign,
      true,
    );
    const bodyText = toTextTheme(
      resolvedBodyFont,
      resolvedBodyTextColor,
      resolvedDataAlign,
    );
    const headerCell = getCellTheme({
      backgroundColor: resolvedHeaderBackground,
      crossBackgroundColor: resolvedHeaderBackground,
      borderColor: resolvedBorderColor,
      selectedColor: resolvedSelectedColor,
    });
    const bodyCell = getCellTheme({
      backgroundColor: resolvedBodyBackground,
      crossBackgroundColor: resolvedAlternateBackground,
      borderColor: resolvedBorderColor,
      selectedColor: resolvedSelectedColor,
    });

    return {
      cornerCell: {
        text: headerText,
        bolderText: headerText,
        measureText: headerText,
        cell: headerCell,
      },
      colCell: {
        text: headerText,
        bolderText: headerText,
        measureText: headerText,
        cell: headerCell,
      },
      rowCell: {
        text: headerText,
        bolderText: headerText,
        measureText: headerText,
        seriesText: headerText,
        cell: headerCell,
        seriesNumberWidth: this.resizedStyle.seriesWidth,
      },
      dataCell: {
        text: bodyText,
        bolderText: {
          ...bodyText,
          fontWeight: 'bold',
        },
        cell: bodyCell,
        miniChart: {
          interval: {
            height: 12,
            fill: '#5b8ff9',
          },
        },
      },
      seriesNumberCell: {
        text: headerText,
        bolderText: headerText,
        cell: headerCell,
      },
      resizeArea: {
        size: 6,
        background: resolvedSelectedColor,
        guideLineColor: resolvedSelectedColor,
      },
      splitLine: {
        horizontalBorderColor: resolvedBorderColor,
        horizontalBorderWidth: 1,
        verticalBorderColor: resolvedBorderColor,
        verticalBorderWidth: 1,
        showShadow: false,
      },
      scrollBar: {
        trackColor: '#f0f0f0',
        thumbColor: '#bfbfbf',
        thumbHoverColor: '#8c8c8c',
        size: 8,
        hoverSize: 10,
      },
      background: {
        color: resolvedBodyBackground,
        opacity: 1,
      },
    };
  }
}

export default PivotSheetChart;
