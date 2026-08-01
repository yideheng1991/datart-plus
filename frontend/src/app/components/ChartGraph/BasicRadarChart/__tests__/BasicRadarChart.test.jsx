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

import BasicRadarChart from '../BasicRadarChart';

describe('<BasicRadarChart />', () => {
  let component;
  beforeEach(() => {
    component = new BasicRadarChart();
  });
  test('It should mount', () => {
    expect(component).toBeDatartChartModel();
  });

  test('It should only expose radar-specific configurations', () => {
    expect(component.config.datas.map(item => item.key)).toEqual([
      'dimension',
      'metrics',
      'filter',
      'color',
      'info',
    ]);
    expect(component.config.styles.map(item => item.key)).toEqual([
      'radarAxis',
      'axisName',
      'axisLine',
      'splitLine',
      'splitArea',
      'radarSeries',
      'label',
      'legend',
    ]);
    expect(component.config.settings.map(item => item.key)).toEqual(['paging']);

    const splitArea = component.config.styles.find(
      item => item.key === 'splitArea',
    );
    const radarSeries = component.config.styles.find(
      item => item.key === 'radarSeries',
    );
    expect(splitArea.rows.find(item => item.key === 'opacity')).toMatchObject({
      comType: 'slider',
      options: { min: 0, max: 1, step: 0.1, dots: false },
    });
    expect(
      radarSeries.rows.find(item => item.key === 'areaOpacity'),
    ).toMatchObject({
      comType: 'slider',
      options: { min: 0, max: 1, step: 0.1, dots: false },
    });
  });

  test('It should build indicators and series from dynamic metrics', () => {
    const dataset = {
      columns: [
        { name: 'region' },
        { name: 'SUM(sales)' },
        { name: 'AVG(profit)' },
        { name: 'segment' },
      ],
      rows: [
        ['East', '80', '4', 'Retail'],
        ['West', '60', '8', 'Enterprise'],
      ],
    };
    const config = {
      datas: [
        {
          key: 'dimension',
          type: 'group',
          rows: [{ colName: 'region' }],
        },
        {
          key: 'metrics',
          type: 'aggregate',
          rows: [
            {
              colName: 'sales',
              aggregate: 'SUM',
              alias: { name: 'Sales' },
            },
            {
              colName: 'profit',
              aggregate: 'AVG',
              alias: { name: 'Profit' },
            },
          ],
        },
        {
          key: 'color',
          type: 'color',
          rows: [
            {
              colName: 'segment',
              color: {
                colors: [
                  { key: 'Retail', value: '#ff0000' },
                  { key: 'Enterprise', value: '#0000ff' },
                ],
              },
            },
          ],
        },
      ],
      styles: [
        {
          key: 'radarAxis',
          rows: [
            {
              key: 'maxValues',
              value: [{ key: 'SUM(sales)', max: 100 }],
            },
            { key: 'shape', value: 'circle' },
            { key: 'radius', value: '70%' },
            { key: 'centerX', value: '45%' },
            { key: 'centerY', value: '55%' },
            { key: 'startAngle', value: 45 },
            { key: 'splitNumber', value: 4 },
          ],
        },
        {
          key: 'axisName',
          rows: [
            { key: 'show', value: true },
            { key: 'font', value: { color: '#333333', fontSize: 14 } },
          ],
        },
        {
          key: 'axisLine',
          rows: [
            { key: 'show', value: true },
            {
              key: 'lineStyle',
              value: { color: '#cccccc', type: 'solid', width: 1 },
            },
          ],
        },
        {
          key: 'splitLine',
          rows: [
            { key: 'show', value: true },
            {
              key: 'lineStyle',
              value: { color: '#dddddd', type: 'dashed', width: 1 },
            },
          ],
        },
        {
          key: 'splitArea',
          rows: [
            { key: 'show', value: true },
            { key: 'color', value: '#f5f5f5' },
            { key: 'opacity', value: 0.4 },
          ],
        },
        {
          key: 'radarSeries',
          rows: [
            { key: 'symbol', value: 'diamond' },
            { key: 'symbolSize', value: 6 },
            { key: 'lineType', value: 'dashed' },
            { key: 'lineWidth', value: 3 },
            { key: 'areaOpacity', value: 0.2 },
          ],
        },
        {
          key: 'label',
          rows: [
            { key: 'showLabel', value: true },
            { key: 'font', value: { color: '#111111', fontSize: 12 } },
          ],
        },
        {
          key: 'legend',
          rows: [
            { key: 'showLegend', value: true },
            { key: 'type', value: 'scroll' },
            { key: 'position', value: 'top' },
            { key: 'selectAll', value: true },
            { key: 'height', value: 80 },
            { key: 'font', value: { color: '#222222', fontSize: 12 } },
          ],
        },
      ],
    };

    const options = component.getOptions(dataset, config);

    expect(options.radar.indicator).toEqual([
      { name: 'Sales', max: 100 },
      { name: 'Profit', max: 8 },
    ]);
    expect(options.radar).toMatchObject({
      shape: 'circle',
      radius: '70%',
      center: ['45%', '55%'],
      startAngle: 45,
      splitNumber: 4,
      axisName: {
        show: true,
        color: '#333333',
      },
      axisLine: {
        show: true,
      },
      splitLine: {
        show: true,
      },
      splitArea: {
        show: true,
        areaStyle: {
          color: ['#f5f5f5'],
          opacity: 0.4,
        },
      },
    });
    expect(options.legend).toMatchObject({
      show: true,
      type: 'scroll',
      orient: 'horizontal',
      height: 80,
      data: ['East', 'West'],
    });
    expect(options.series[0]).toMatchObject({
      type: 'radar',
      symbol: 'diamond',
      symbolSize: 6,
      lineStyle: {
        type: 'dashed',
        width: 3,
      },
      areaStyle: {
        opacity: 0.2,
      },
      label: {
        show: true,
        formatter: '{b}',
        color: '#111111',
      },
    });
    expect(options.series[0].data).toEqual([
      expect.objectContaining({
        name: 'East',
        value: [80, 4],
        itemStyle: { color: '#ff0000' },
        lineStyle: { color: '#ff0000' },
        areaStyle: { color: '#ff0000' },
      }),
      expect.objectContaining({
        name: 'West',
        value: [60, 8],
        itemStyle: { color: '#0000ff' },
        lineStyle: { color: '#0000ff' },
        areaStyle: { color: '#0000ff' },
      }),
    ]);
    expect(options.series[0].data[0].rowData).toEqual({
      region: 'East',
      'SUM(sales)': '80',
      'AVG(profit)': '4',
      segment: 'Retail',
    });
    expect(options.tooltip.confine).toBe(true);
    expect(options.tooltip.formatter).toEqual(expect.any(Function));
  });

  test('It should use the first aggregate row without a dimension', () => {
    const dataset = {
      columns: [{ name: 'SUM(sales)' }, { name: 'SUM(profit)' }],
      rows: [['0', '-2']],
    };
    const config = {
      datas: [
        {
          key: 'dimension',
          type: 'group',
          rows: [],
        },
        {
          key: 'metrics',
          type: 'aggregate',
          rows: [
            { colName: 'sales', aggregate: 'SUM' },
            { colName: 'profit', aggregate: 'SUM' },
          ],
        },
      ],
      styles: [],
    };

    const options = component.getOptions(dataset, config);

    expect(options.radar.indicator).toEqual([
      { name: 'SUM(sales)', max: 1 },
      { name: 'SUM(profit)', max: 1 },
    ]);
    expect(options.series[0].data).toEqual([
      expect.objectContaining({
        name: 'SUM(sales), SUM(profit)',
        value: [0, -2],
      }),
    ]);
  });
});
