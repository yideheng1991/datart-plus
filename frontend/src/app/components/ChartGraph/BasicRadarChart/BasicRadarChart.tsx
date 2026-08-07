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

import { ChartDataSectionType } from 'app/constants';
import { ChartSelectionManager } from 'app/models/ChartSelectionManager';
import {
  ChartConfig,
  ChartDataSectionField,
  ChartStyleConfig,
  LegendStyle,
} from 'app/types/ChartConfig';
import ChartDataSetDTO, { IChartDataSet } from 'app/types/ChartDataSet';
import { BrokerContext, BrokerOption } from 'app/types/ChartLifecycleBroker';
import {
  getColumnRenderName,
  getDataColumnMaxAndMin2,
  getExtraSeriesRowData,
  getSeriesTooltips4Polar2,
  getStyles,
  getValueByColumnKey,
  transformToDataSet,
} from 'app/utils/chartHelper';
import { init } from 'echarts';
import Chart from '../../../models/Chart';
import Config from './config';

type RadarIndicatorMaxValue = {
  key: string;
  max: number;
};

class BasicRadarChart extends Chart {
  config = Config;
  chart: any = null;
  selectionManager?: ChartSelectionManager;

  constructor(props?) {
    super(
      props?.id || 'radar',
      props?.name || 'viz.palette.graph.names.radarChart',
      props?.icon || 'radar',
    );
    this.meta.requirements = props?.requirements || [
      {
        group: [0, 1],
        aggregate: [1, 999],
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

  onUpdated(options: BrokerOption, context: BrokerContext) {
    if (!options.dataset || !options.dataset.columns || !options.config) {
      return;
    }
    if (!this.isMatchRequirement(options.config)) {
      this.chart?.clear();
      return;
    }
    this.selectionManager?.updateSelectedItems(options.selectedItems);
    const newOptions = this.getOptions(options.dataset, options.config);
    this.chart?.setOption(Object.assign({}, newOptions), true);
  }

  onUnMount(options: BrokerOption, context: BrokerContext) {
    this.selectionManager?.removeWindowListeners(context.window);
    this.selectionManager?.removeZRenderListeners(this.chart);
    this.chart?.dispose();
  }

  onResize(options: BrokerOption, context: BrokerContext) {
    this.chart?.resize(context);
  }

  getOptions(dataset: ChartDataSetDTO, config: ChartConfig) {
    const dataConfigs = config.datas || [];
    const styleConfigs = config.styles || [];
    const groupConfigs = dataConfigs
      .filter(config => config.type === ChartDataSectionType.Group)
      .flatMap(config => config.rows || []);
    const aggregateConfigs = dataConfigs
      .filter(config => config.type === ChartDataSectionType.Aggregate)
      .flatMap(config => config.rows || []);
    const colorConfigs = dataConfigs
      .filter(config => config.type === ChartDataSectionType.Color)
      .flatMap(config => config.rows || []);
    const infoConfigs = dataConfigs
      .filter(config => config.type === ChartDataSectionType.Info)
      .flatMap(config => config.rows || []);
    const chartDataSet = transformToDataSet(
      dataset.rows,
      dataset.columns,
      dataConfigs,
    );
    const seriesData = this.getSeriesData(
      chartDataSet,
      groupConfigs,
      aggregateConfigs,
      colorConfigs,
    );

    return {
      tooltip: this.getTooltip(
        chartDataSet,
        groupConfigs,
        aggregateConfigs,
        colorConfigs,
        infoConfigs,
      ),
      legend: this.getLegendStyle(
        styleConfigs,
        seriesData.map(item => item.name),
      ),
      radar: this.getRadarStyle(styleConfigs, aggregateConfigs, chartDataSet),
      series: [
        {
          type: 'radar',
          ...this.getRadarSeriesStyle(styleConfigs),
          data: seriesData,
        },
      ],
    };
  }

  private getRadarStyle(
    styles: ChartStyleConfig[],
    aggregateConfigs: ChartDataSectionField[],
    chartDataSet: IChartDataSet<string>,
  ) {
    const [
      shape,
      radius,
      centerX,
      centerY,
      startAngle,
      splitNumber,
      configuredMaxValues,
    ] = getStyles(
      styles,
      ['radarAxis'],
      [
        'shape',
        'radius',
        'centerX',
        'centerY',
        'startAngle',
        'splitNumber',
        'maxValues',
      ],
    );
    const [showAxisName, axisNameFont] = getStyles(
      styles,
      ['axisName'],
      ['show', 'font'],
    );
    const [showAxisLine, axisLineStyle] = getStyles(
      styles,
      ['axisLine'],
      ['show', 'lineStyle'],
    );
    const [showSplitLine, splitLineStyle] = getStyles(
      styles,
      ['splitLine'],
      ['show', 'lineStyle'],
    );
    const [showSplitArea, splitAreaColor, splitAreaOpacity] = getStyles(
      styles,
      ['splitArea'],
      ['show', 'color', 'opacity'],
    );
    const maxValues: RadarIndicatorMaxValue[] = Array.isArray(
      configuredMaxValues,
    )
      ? configuredMaxValues
      : [];

    return {
      shape,
      radius,
      center: [centerX, centerY],
      startAngle,
      splitNumber,
      axisName: {
        show: showAxisName,
        ...axisNameFont,
      },
      axisLine: {
        show: showAxisLine,
        lineStyle: axisLineStyle,
      },
      splitLine: {
        show: showSplitLine,
        lineStyle: splitLineStyle,
      },
      splitArea: {
        show: showSplitArea,
        areaStyle: {
          color: splitAreaColor ? [splitAreaColor] : undefined,
          opacity: splitAreaOpacity,
        },
      },
      indicator: aggregateConfigs.map(field => ({
        name: getColumnRenderName(field),
        max: this.getIndicatorMax(field, chartDataSet, maxValues),
      })),
    };
  }

  private getRadarSeriesStyle(styles: ChartStyleConfig[]) {
    const [symbol, symbolSize, lineType, lineWidth, areaOpacity] = getStyles(
      styles,
      ['radarSeries'],
      ['symbol', 'symbolSize', 'lineType', 'lineWidth', 'areaOpacity'],
    );
    const [showLabel, labelFont] = getStyles(
      styles,
      ['label'],
      ['showLabel', 'font'],
    );

    return {
      symbol,
      symbolSize,
      lineStyle: {
        type: lineType,
        width: lineWidth,
      },
      areaStyle:
        typeof areaOpacity === 'number' && areaOpacity > 0
          ? { opacity: areaOpacity }
          : undefined,
      label: {
        show: showLabel,
        formatter: '{b}',
        ...labelFont,
      },
    };
  }

  private getIndicatorMax(
    field: ChartDataSectionField,
    chartDataSet: IChartDataSet<string>,
    maxValues: RadarIndicatorMaxValue[],
  ): number {
    const configuredMax = maxValues.find(
      item => item.key === getValueByColumnKey(field),
    )?.max;
    if (
      typeof configuredMax === 'number' &&
      Number.isFinite(configuredMax) &&
      configuredMax > 0
    ) {
      return configuredMax;
    }

    if (!chartDataSet.length) {
      return 1;
    }
    const { max: dataMax } = getDataColumnMaxAndMin2(chartDataSet, field);
    return Number.isFinite(dataMax) && dataMax > 0 ? dataMax : 1;
  }

  private getSeriesData(
    chartDataSet: IChartDataSet<string>,
    groupConfigs: ChartDataSectionField[],
    aggregateConfigs: ChartDataSectionField[],
    colorConfigs: ChartDataSectionField[],
  ) {
    const rows = groupConfigs.length ? chartDataSet : chartDataSet.slice(0, 1);
    const defaultSeriesName = aggregateConfigs
      .map(getColumnRenderName)
      .join(', ');
    const colorConfig = colorConfigs[0];
    const colors: Array<{ key: string; value: string }> =
      colorConfig?.color?.colors || [];

    return Array.from(rows, row => {
      const colorKey = colorConfig ? row.getCell(colorConfig) : undefined;
      const color = colors.find(item => item.key === colorKey)?.value;

      return {
        ...getExtraSeriesRowData(row),
        name:
          groupConfigs.map(field => row.getCell(field)).join('-') ||
          defaultSeriesName,
        value: aggregateConfigs.map(field => {
          const value = Number(row.getCell(field));
          return Number.isFinite(value) ? value : 0;
        }),
        itemStyle: color ? { color } : undefined,
        lineStyle: color ? { color } : undefined,
        areaStyle: color ? { color } : undefined,
      };
    });
  }

  private getLegendStyle(
    styles: ChartStyleConfig[],
    seriesNames: string[],
  ): LegendStyle {
    const [show, type, font, legendPosition, selectAll, height] = getStyles(
      styles,
      ['legend'],
      ['showLegend', 'type', 'font', 'position', 'selectAll', 'height'],
    );
    let positions = {};
    let orient = '';

    switch (legendPosition) {
      case 'top':
        orient = 'horizontal';
        positions = { top: 8, left: 8, right: 8, height: 32 };
        break;
      case 'bottom':
        orient = 'horizontal';
        positions = { bottom: 8, left: 8, right: 8, height: 32 };
        break;
      case 'left':
        orient = 'vertical';
        positions = { left: 8, top: 16, bottom: 24, width: 96 };
        break;
      default:
        orient = 'vertical';
        positions = { right: 8, top: 16, bottom: 24, width: 96 };
        break;
    }
    const selected = seriesNames.reduce(
      (result, name) => ({
        ...result,
        [name]: selectAll,
      }),
      {},
    );

    return {
      ...positions,
      show,
      type,
      height: height || null,
      orient,
      selected,
      data: seriesNames,
      textStyle: font,
    };
  }

  private getTooltip(
    chartDataSet: IChartDataSet<string>,
    groupConfigs: ChartDataSectionField[],
    aggregateConfigs: ChartDataSectionField[],
    colorConfigs: ChartDataSectionField[],
    infoConfigs: ChartDataSectionField[],
  ) {
    return {
      trigger: 'item',
      confine: true,
      formatter: seriesParams => {
        if (seriesParams.componentType !== 'series') {
          return seriesParams.name;
        }
        return getSeriesTooltips4Polar2(
          chartDataSet,
          seriesParams,
          groupConfigs,
          colorConfigs,
          aggregateConfigs,
          infoConfigs,
        );
      },
    };
  }
}

export default BasicRadarChart;
