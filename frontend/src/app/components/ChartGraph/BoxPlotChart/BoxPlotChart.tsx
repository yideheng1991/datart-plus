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

import Chart from 'app/models/Chart';
import { ChartSelectionManager } from 'app/models/ChartSelectionManager';
import {
  ChartConfig,
  ChartDataConfig,
  ChartDataSectionField,
  SelectedItem,
} from 'app/types/ChartConfig';
import { ChartCategory } from 'app/types/ChartMetadata';
import ChartDataSetDTO from 'app/types/ChartDataSet';
import { BrokerContext, BrokerOption } from 'app/types/ChartLifecycleBroker';
import {
  getColumnRenderName,
  getExtraSeriesRowData,
  getSelectedItemStyles,
  getStyles,
  transformToDataSet,
  valueFormatter,
} from 'app/utils/chartHelper';
import { init } from 'echarts';
import Config from './config';

const STATISTIC_KEYS = ['min', 'q1', 'median', 'q3', 'max'];

const BOXPLOT_ICON = `<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg t="1785632179853" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1042" xmlns:xlink="http://www.w3.org/1999/xlink" width="200" height="200"><path d="M215.578947 161.684211H53.894737v53.894736h107.789474v107.789474h53.894736V215.578947h107.789474V161.684211H215.578947z m0 485.052631H161.684211v107.789474H53.894737v53.894737h269.473684v-53.894737H215.578947v-107.789474zM862.315789 323.368421h-161.68421v53.894737h107.789474v107.789474h53.894736V377.263158h107.789474V323.368421h-107.789474z m0 431.157895h-53.894736v107.789473h-107.789474v53.894737h269.473684v-53.894737h-107.789474v-107.789473zM538.947368 53.894737H377.263158v53.894737h107.789474v161.68421h53.894736V107.789474h107.789474V53.894737h-107.789474z m0 700.631579H485.052632v161.68421H377.263158v53.894737h269.473684v-53.894737h-107.789474v-161.68421z" fill="#444A5C" p-id="1043"></path><path d="M323.368421 662.905263H53.894737v-377.263158h269.473684v377.263158z m-215.578947-53.894737h161.68421v-269.473684H107.789474v269.473684zM970.105263 808.421053h-269.473684V431.157895h269.473684v377.263158z m-215.578947-53.894737h161.68421V485.052632h-161.68421v269.473684zM646.736842 781.473684H377.263158v-538.947368h269.473684v538.947368z m-215.578947-53.894737h161.68421v-431.157894H431.157895v431.157894z" fill="#444A5C" p-id="1044"></path></svg>`;

const valueOrDefault = (value, defaultValue) =>
  value === undefined || value === null ? defaultValue : value;

const toFiniteNumber = value => {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

class BoxPlotChart extends Chart {
  dependency = [];
  config = Config;
  chart: any = null;
  selectionManager?: ChartSelectionManager;

  constructor() {
    super(
      'echarts-boxplot',
      'viz.palette.graph.names.boxPlot',
      BOXPLOT_ICON,
      undefined,
      ChartCategory.Custom,
    );
    this.meta.requirements = [
      {
        group: 1,
        aggregate: [5, 999],
      },
    ];
  }

  onMount(options: BrokerOption, context: BrokerContext) {
    if (
      options.containerId === undefined ||
      !context.document ||
      !context.window
    ) {
      return;
    }

    this.chart = init(
      context.document.getElementById(options.containerId)!,
      'default',
    );
    this.selectionManager = new ChartSelectionManager(this.mouseEvents);
    this.selectionManager.attachWindowListeners(context.window);
    this.selectionManager.attachZRenderListeners(this.chart);
    this.selectionManager.attachEChartsListeners(this.chart);
  }

  onUpdated(options: BrokerOption, context: BrokerContext): void {
    if (!options.dataset || !options.dataset.columns || !options.config) {
      return;
    }
    if (!this.isMatchRequirement(options.config)) {
      this.chart?.clear();
      return;
    }
    this.selectionManager?.updateSelectedItems(options?.selectedItems);
    this.chart?.setOption(
      this.getOptions(options.dataset, options.config, options.selectedItems),
      true,
    );
  }

  onUnMount(options: BrokerOption, context: BrokerContext) {
    this.selectionManager?.removeWindowListeners(context.window);
    this.selectionManager?.removeZRenderListeners(this.chart);
    this.chart?.dispose();
    this.chart = null;
  }

  onResize(options: BrokerOption, context: BrokerContext) {
    this.chart?.resize(options, context);
  }

  private getOptions(
    dataset: ChartDataSetDTO,
    chartConfig: ChartConfig,
    selectedItems?: SelectedItem[],
  ) {
    const styleConfigs = chartConfig.styles || [];
    const dataConfigs = chartConfig.datas || [];
    const dimensionConfig = this.getDataConfigs(dataConfigs, 'dimension')[0];
    const statisticConfigs = STATISTIC_KEYS.map(
      key => this.getDataConfigs(dataConfigs, key)[0],
    );
    const outlierConfigs = this.getDataConfigs(dataConfigs, 'outlier');
    const chartDataSet = transformToDataSet(
      dataset.rows,
      dataset.columns,
      dataConfigs,
    );
    const records = chartDataSet
      .map(row => {
        const values = statisticConfigs.map(field =>
          toFiniteNumber(row.getCell(field)),
        );
        return {
          row,
          category: row.getCell(dimensionConfig),
          values,
        };
      })
      .filter(
        record =>
          record.category !== undefined &&
          record.category !== null &&
          record.values.every(value => value !== null),
      );

    const [orientation, backgroundColor, showTooltip, animation] = getStyles(
      styleConfigs,
      ['general'],
      ['orientation', 'backgroundColor', 'showTooltip', 'animation'],
    );
    const [showTitle, titleText, titlePosition, titleFont] = getStyles(
      styleConfigs,
      ['title'],
      ['show', 'text', 'position', 'font'],
    );
    const [
      showCategoryAxis,
      categoryName,
      categoryLabelRotate,
      categoryAxisFont,
    ] = getStyles(
      styleConfigs,
      ['categoryAxis'],
      ['show', 'name', 'rotate', 'font'],
    );
    const [
      showValueAxis,
      configuredValueName,
      showSplitArea,
      showSplitLine,
      splitLineColor,
      valueAxisFont,
    ] = getStyles(
      styleConfigs,
      ['valueAxis'],
      ['show', 'name', 'showSplitArea', 'showSplitLine', 'splitLineColor', 'font'],
    );
    const [
      boxFill,
      boxBorderColor,
      boxBorderWidth,
      boxBorderType,
      minBoxWidth,
      maxBoxWidth,
    ] = getStyles(
      styleConfigs,
      ['box'],
      ['fill', 'borderColor', 'borderWidth', 'borderType', 'minWidth', 'maxWidth'],
    );
    const [showOutlier, outlierColor, outlierSymbolSize] = getStyles(
      styleConfigs,
      ['outlier'],
      ['show', 'color', 'symbolSize'],
    );
    const [showZoom, zoomStart, zoomEnd] = getStyles(
      styleConfigs,
      ['zoom'],
      ['show', 'start', 'end'],
    );
    const [containLabel, marginLeft, marginRight, marginTop, marginBottom] =
      getStyles(
        styleConfigs,
        ['margin'],
        ['containLabel', 'left', 'right', 'top', 'bottom'],
      );

    const layout = valueOrDefault(orientation, 'vertical');
    const categories = records.map(record => record.category);
    const valueName = configuredValueName || '';
    const categoryAxisVisible = valueOrDefault(showCategoryAxis, true);
    const valueAxisVisible = valueOrDefault(showValueAxis, true);
    const categoryAxis = {
      type: 'category',
      name: categoryAxisVisible ? categoryName : '',
      data: categories,
      boundaryGap: true,
      axisLine: {
        show: categoryAxisVisible,
      },
      axisTick: {
        show: categoryAxisVisible,
      },
      axisLabel: {
        show: categoryAxisVisible,
        rotate: valueOrDefault(categoryLabelRotate, 0),
        ...(categoryAxisFont || {}),
      },
      nameTextStyle: categoryAxisFont,
      splitArea: {
        show: false,
      },
      splitLine: {
        show: false,
      },
    };
    const valueAxis = {
      type: 'value',
      name: valueAxisVisible ? valueName : '',
      axisLine: {
        show: valueAxisVisible,
      },
      axisTick: {
        show: valueAxisVisible,
      },
      axisLabel: {
        show: valueAxisVisible,
        ...(valueAxisFont || {}),
      },
      nameTextStyle: valueAxisFont,
      splitArea: {
        show: valueOrDefault(showSplitArea, true),
      },
      splitLine: {
        show: valueOrDefault(showSplitLine, true),
        lineStyle: {
          color: valueOrDefault(splitLineColor, '#e8e8e8'),
        },
      },
    };
    const tooltipFormatter = this.getTooltipFormatter(statisticConfigs);
    const boxplotSeries = {
      name: valueName,
      type: 'boxplot',
      layout,
      data: records.map((record, index) => ({
        value: record.values,
        ...getExtraSeriesRowData(record.row),
        ...getSelectedItemStyles(0, index, selectedItems || []),
      })),
      boxWidth: [
        valueOrDefault(minBoxWidth, 7),
        valueOrDefault(maxBoxWidth, 50),
      ],
      itemStyle: {
        color: valueOrDefault(boxFill, '#ffffff'),
        borderColor: valueOrDefault(boxBorderColor, '#5470c6'),
        borderWidth: valueOrDefault(boxBorderWidth, 2),
        borderType: valueOrDefault(boxBorderType, 'solid'),
      },
      tooltip: {
        formatter: tooltipFormatter,
      },
    };
    const outlierSeries = valueOrDefault(showOutlier, true)
      ? outlierConfigs.map((field, outlierIndex) => ({
          name: getColumnRenderName(field),
          type: 'scatter',
          data: records.reduce((data, record, recordIndex) => {
            const value = toFiniteNumber(record.row.getCell(field));
            if (value !== null) {
              data.push({
                value:
                  layout === 'horizontal'
                    ? [value, record.category]
                    : [record.category, value],
                ...getExtraSeriesRowData(record.row),
                ...getSelectedItemStyles(
                  1 + outlierIndex,
                  recordIndex,
                  selectedItems || [],
                ),
              });
            }
            return data;
          }, [] as any[]),
          symbolSize: valueOrDefault(outlierSymbolSize, 8),
          itemStyle: {
            color: valueOrDefault(outlierColor, '#e06343'),
          },
        }))
      : [];

    return {
      backgroundColor: valueOrDefault(backgroundColor, 'rgba(0, 0, 0, 0)'),
      animation: valueOrDefault(animation, true),
      title: {
        show: valueOrDefault(showTitle, true),
        text: titleText || '',
        left: valueOrDefault(titlePosition, 'center'),
        textStyle: titleFont,
      },
      tooltip: {
        show: valueOrDefault(showTooltip, true),
        trigger: 'item',
        renderMode: 'richText',
        axisPointer: {
          type: 'shadow',
        },
      },
      grid: {
        containLabel: valueOrDefault(containLabel, true),
        left: valueOrDefault(marginLeft, 40),
        right: valueOrDefault(marginRight, 30),
        top: valueOrDefault(marginTop, 60),
        bottom: valueOrDefault(marginBottom, 60),
      },
      xAxis: layout === 'horizontal' ? valueAxis : categoryAxis,
      yAxis: layout === 'horizontal' ? categoryAxis : valueAxis,
      dataZoom: this.getDataZoom(
        layout,
        valueOrDefault(showZoom, false),
        valueOrDefault(zoomStart, 0),
        valueOrDefault(zoomEnd, 100),
      ),
      series: [boxplotSeries, ...outlierSeries],
    };
  }

  private getDataConfigs(
    dataConfigs: ChartDataConfig[],
    key: string,
  ): ChartDataSectionField[] {
    return dataConfigs
      .filter(dataConfig => dataConfig.key === key)
      .flatMap(dataConfig => dataConfig.rows || []);
  }

  private getDataZoom(layout, show, start, end) {
    if (!show) {
      return [];
    }
    const axisIndex =
      layout === 'horizontal' ? { yAxisIndex: 0 } : { xAxisIndex: 0 };
    return [
      {
        type: 'inside',
        filterMode: 'filter',
        start,
        end,
        ...axisIndex,
      },
      {
        type: 'slider',
        filterMode: 'filter',
        start,
        end,
        ...axisIndex,
      },
    ];
  }

  private getTooltipFormatter(statisticConfigs: ChartDataSectionField[]) {
    return params => {
      const values = Array.isArray(params.value)
        ? params.value.slice(-STATISTIC_KEYS.length)
        : [];
      const lines = [String(params.name ?? '')];
      statisticConfigs.forEach((field, index) => {
        lines.push(valueFormatter(field, values[index]));
      });
      return lines.join('\n');
    };
  }
}

export default BoxPlotChart;
