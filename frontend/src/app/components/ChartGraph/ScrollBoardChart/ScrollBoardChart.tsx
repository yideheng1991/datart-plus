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

import ReactChart from 'app/models/ReactChart';
import { ChartCategory } from 'app/types/ChartMetadata';
import {
  ChartConfig,
  ChartDataConfig,
  ChartDataSectionField,
  ChartStyleConfig,
} from 'app/types/ChartConfig';
import ChartDataSetDTO, {
  IChartDataSet,
} from 'app/types/ChartDataSet';
import { BrokerContext, BrokerOption } from 'app/types/ChartLifecycleBroker';
import {
  getColumnRenderName,
  getStyles,
  getValue,
  getValueByColumnKey,
  toFormattedValue,
  transformToDataSet,
} from 'app/utils/chartHelper';
import ScrollBoardWrapper, { ScrollBoardProps } from './ScrollBoardWrapper';
import Config from './config';

const SCROLL_BOARD_ICON = `<svg t="1787376771802" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="6432" width="200" height="200"><path d="M1024 0H0v1024h1024V0z m-64 960h-294.4V64H960v896zM345.6 374.4h256v256h-256v-256z m-64 256H64v-256h217.6v256z m64-320V64h256v246.4h-256z m256 384V960h-256v-265.6h256zM281.6 64v246.4H64V64h217.6zM64 694.4h217.6V960H64v-265.6z" p-id="6433" fill="#515151"></path><path d="M844.8 310.4h70.4l-102.4-166.4-99.2 166.4h67.2v409.6h-70.4l102.4 166.4 99.2-166.4h-67.2V310.4z" p-id="6434" fill="#515151"></path></svg>`;

class ScrollBoardChart extends ReactChart {
  useIFrame = false;
  isISOContainer = 'scroll-board';
  config = Config;

  constructor(props?) {
    super(ScrollBoardWrapper, {
      id: props?.id || 'scroll-board',
      name: props?.name || 'ScrollBoard',
      icon: props?.icon || SCROLL_BOARD_ICON,
      category: props?.category || ChartCategory.Table,
    });

    this.meta.requirements = props?.requirements || [
      {
        group: [0, 999],
        aggregate: [0, 999],
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
    this.adapter?.mounted(
      context.document.getElementById(options.containerId),
      options,
      context,
    );
  }

  onUpdated(options: BrokerOption, context: BrokerContext): void {
    if (!this.isMatchRequirement(options.config)) {
      this.adapter?.unmount();
      return;
    }
    const optionsParams = this.getOptions(
      context,
      options.dataset,
      options.config,
      options.widgetSpecialConfig,
    );
    this.adapter?.updated(optionsParams, context);
  }

  public onResize(options: BrokerOption, context: BrokerContext) {
    const optionsParams = this.getOptions(
      context,
      options.dataset,
      options.config,
      options.widgetSpecialConfig,
    );
    this.adapter?.updated(optionsParams, context);
  }

  protected getOptions(
    context: BrokerContext,
    dataset?: ChartDataSetDTO,
    config?: ChartConfig,
    widgetSpecialConfig?: any,
  ): ScrollBoardProps {
    if (!dataset || !config) {
      return {};
    }
    const dataConfigs = config.datas || [];
    const styleConfigs = config.styles || [];

    const chartDataSet = transformToDataSet(
      dataset.rows,
      dataset.columns,
      dataConfigs,
    );

    const mixedConfig = this.getMixedSection(dataConfigs);
    const headerStyle = this.getHeaderStyle(styleConfigs);

    const headers = this.getHeaders(mixedConfig);
    const rows = this.getRows(mixedConfig, chartDataSet);
    return {
      header: headers,
      data: rows,
      ...this.getBasicStyle(styleConfigs),
      ...headerStyle,
      ...this.getBodyStyle(styleConfigs),
      ...this.getColumnStyle(
        styleConfigs,
        mixedConfig,
        headers,
        rows,
        headerStyle,
        context?.width,
      ),
    };
  }

  private getMixedSection(
    dataConfigs: ChartDataConfig[],
  ): ChartDataSectionField[] {
    return (dataConfigs || [])
      .filter(c => c.key === 'mixed')
      .flatMap(config => config.rows || []);
  }

  private getHeaders(configs: ChartDataSectionField[]): string[] {
    return (configs || []).map(c => getColumnRenderName(c));
  }

  private getRows(
    configs: ChartDataSectionField[],
    chartDataSet: IChartDataSet<string>,
  ): Array<Array<string | number>> {
    if (!configs?.length) {
      return [];
    }
    return chartDataSet?.map(dc => {
      return configs.map(c => {
        const value = dc.getCell(c);
        return toFormattedValue(value, c.format);
      });
    });
  }

  private getBasicStyle(styleConfigs: ChartStyleConfig[]) {
    const [rowNum, waitTime, headerHeight, carousel, hoverPause] = getStyles(
      styleConfigs,
      ['basic'],
      ['rowNum', 'waitTime', 'headerHeight', 'carousel', 'hoverPause'],
    );
    return {
      rowNum,
      waitTime,
      headerHeight,
      carousel,
      hoverPause,
    };
  }

  private getHeaderStyle(styleConfigs: ChartStyleConfig[]) {
    const [
      headerBGC,
      headerFont,
      headerAlign,
      index,
      indexHeader,
      indexAlign,
    ] = getStyles(
      styleConfigs,
      ['header'],
      [
        'headerBGC',
        'headerFont',
        'headerAlign',
        'index',
        'indexHeader',
        'indexAlign',
      ],
    );
    return {
      headerBGC,
      headerFont,
      headerAlign,
      index,
      indexHeader,
      indexAlign,
    };
  }

  private getBodyStyle(styleConfigs: ChartStyleConfig[]) {
    const [oddRowBGC, evenRowBGC, bodyFont] = getStyles(
      styleConfigs,
      ['body'],
      ['oddRowBGC', 'evenRowBGC', 'bodyFont'],
    );
    return {
      oddRowBGC,
      evenRowBGC,
      bodyFont,
    };
  }

  private getColumnStyle(
    styleConfigs: ChartStyleConfig[],
    mixedConfig: ChartDataSectionField[],
    headers: string[],
    rows: Array<Array<string | number>>,
    headerStyle: {
      index?: boolean;
      indexAlign?: string;
      headerAlign?: string;
    },
    width?: number,
  ): {
    columnWidth?: number[];
    headerAligns?: string[];
    dataAligns?: string[];
  } {
    // 估算一段文本的渲染宽度：CJK（中文等）约 15px，ASCII（英文/数字）约 8px，
    // 再加上左右内边距（各 10px）与缓冲。
    const CJK_WIDTH = 15;
    const ASCII_WIDTH = 8;
    const COL_PADDING = 24;
    const isCJK = (ch: string) =>
      /[\u2e80-\u9fff\uf900-\ufaff\uff00-\uffef\u3000-\u303f]/.test(ch);
    const calcTextWidth = (text: string | number | null | undefined) => {
      let w = 0;
      for (const ch of String(text ?? '')) {
        w += isCJK(ch) ? CJK_WIDTH : ASCII_WIDTH;
      }
      return w;
    };

    // 计算每列所需最小宽度（取表头与内容最大值），序号列单独计算
    const columnMinWidth = (headers || []).map((h, i) => {
      let maxContentWidth = 0;
      for (const row of rows || []) {
        const cell = row?.[i];
        const cellWidth = calcTextWidth(cell);
        if (cellWidth > maxContentWidth) maxContentWidth = cellWidth;
      }
      return Math.max(
        calcTextWidth(h) + COL_PADDING,
        maxContentWidth + COL_PADDING,
        40,
      );
    });
    const indexMinWidth = headerStyle.index
      ? Math.max(
          (rows?.length ? String(rows.length).length : 1) * ASCII_WIDTH +
            COL_PADDING,
          60,
        )
      : 0;

    // 按各列内容所需宽度比例分配容器宽度，保证总和不超过容器宽，避免 flex 压缩截断
    const required = headerStyle.index
      ? [indexMinWidth, ...columnMinWidth]
      : columnMinWidth;
    const totalRequired = required.reduce((a, b) => a + b, 0);
    let columnWidth: number[];
    if (width && totalRequired > 0 && width > totalRequired) {
      // 容器足够宽：按内容所需宽度 + 按比例分配富余空间，避免右侧大量留白
      const extra = width - totalRequired;
      columnWidth = required.map(w => w + (w / totalRequired) * extra);
    } else {
      // 容器较窄：按内容所需宽度比例压缩到容器宽
      columnWidth = width && width > 0 && totalRequired > 0
        ? required.map(w => Math.max(40, (w / totalRequired) * width))
        : required;
    }

    // 数据列对齐：读取 ColumnAlign 配置（按字段设置），序号列使用 indexAlign。
    // 配置项位于样式配置的 body 分组下（见 config.ts 中 comType: 'columnAlign'）。
    const alignValue = getValue(styleConfigs, ['body', 'align']);
    const aligns = alignValue?.aligns || [];
    const dataColumnAlign = (mixedConfig || []).map(c => {
      const current = aligns.find(cc => cc.key === getValueByColumnKey(c));
      return current?.align ?? 'center';
    });
    const dataAligns = headerStyle.index
      ? [headerStyle.indexAlign || 'center', ...dataColumnAlign]
      : dataColumnAlign;

    // 表头对齐：使用独立的全局 headerAlign 配置，序号列表头同用该对齐
    const headerAlign = headerStyle.headerAlign || 'center';
    const headerAligns = headers.map(() => headerAlign);

    return {
      columnWidth,
      headerAligns,
      dataAligns,
    };
  }
}

export default ScrollBoardChart;
