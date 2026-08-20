import {
  CellSelectedHandler,
  Node,
  ResizeInfo,
  S2DataConfig,
  S2Options,
  S2Style,
  S2Theme,
  SpreadSheet,
  TargetCellInfo,
  ThemeCfg,
} from '@antv/s2';
export type S2LayoutResizeHandler = (data: {
  info: ResizeInfo;
  style?: S2Style;
  seriesNumberWidth?: number;
}) => void;
export interface AndvS2Config {
  dataCfg?: S2DataConfig;
  options: S2Options;
  theme?: S2Theme;
  themeCfg?: ThemeCfg;
  onRowCellCollapsed?: (val: { isCollapsed: boolean; node: Node }) => void;
  onRowCellAllCollapsed?: (isCollapsed: boolean) => void;
  onSelected?: CellSelectedHandler;
  onDataCellClick?: (data: TargetCellInfo) => void;
  getSpreadSheet?: (spreadsheet: SpreadSheet) => void;
  onLayoutResizeRowWidth?: S2LayoutResizeHandler;
  onLayoutResizeRowHeight?: S2LayoutResizeHandler;
  onLayoutResizeColWidth?: S2LayoutResizeHandler;
  onLayoutResizeColHeight?: S2LayoutResizeHandler;
  onLayoutResizeTreeWidth?: S2LayoutResizeHandler;
  onLayoutResizeSeriesWidth?: S2LayoutResizeHandler;
}
