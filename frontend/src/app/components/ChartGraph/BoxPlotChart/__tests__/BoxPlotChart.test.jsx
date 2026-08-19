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

import { AggregateFieldActionType } from 'app/constants';
import BoxPlotChart from '../BoxPlotChart';

describe('<BoxPlotChart />', () => {
  let component;
  beforeEach(() => {
    component = new BoxPlotChart();
  });

  test('It should mount', () => {
    expect(component).toBeDatartChartModel();
  });

  test('It should expose boxplot-specific data sections', () => {
    expect(component.config.datas.map(item => item.key)).toEqual([
      'dimension',
      'min',
      'q1',
      'median',
      'q3',
      'max',
      'outlier',
      'filter',
    ]);
  });

  test('It should be a custom category chart', () => {
    expect(component.meta.category).toBe('custom');
  });

  test('It should apply the matching default aggregate for each statistic section', () => {
    const datas = component.config.datas;
    const getSectionByKey = key => datas.find(item => item.key === key);

    expect(getSectionByKey('min')).toMatchObject({
      type: 'aggregate',
      required: true,
      limit: 1,
      defaultAggregate: AggregateFieldActionType.Min,
    });
    expect(getSectionByKey('q1')).toMatchObject({
      type: 'aggregate',
      required: true,
      limit: 1,
      defaultAggregate: AggregateFieldActionType.Quartile1,
    });
    expect(getSectionByKey('median')).toMatchObject({
      type: 'aggregate',
      required: true,
      limit: 1,
      defaultAggregate: AggregateFieldActionType.Median,
    });
    expect(getSectionByKey('q3')).toMatchObject({
      type: 'aggregate',
      required: true,
      limit: 1,
      defaultAggregate: AggregateFieldActionType.Quartile3,
    });
    expect(getSectionByKey('max')).toMatchObject({
      type: 'aggregate',
      required: true,
      limit: 1,
      defaultAggregate: AggregateFieldActionType.Max,
    });
  });

  test('It should not set defaultAggregate on non-statistic sections', () => {
    const datas = component.config.datas;
    ['dimension', 'outlier', 'filter'].forEach(key => {
      expect(
        datas.find(item => item.key === key).defaultAggregate,
      ).toBeUndefined();
    });
  });

  test('It should require one group and five aggregates to match requirement', () => {
    expect(component.meta.requirements).toEqual([
      {
        group: 1,
        aggregate: [5, 999],
      },
    ]);
  });
});
