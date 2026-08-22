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

import { ScrollBoard } from '@jiaminghi/data-view-react';
import { memo, FC } from 'react';
import styled from 'styled-components';

export type ScrollBoardFont = {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string | number;
  fontStyle?: string;
  color?: string;
};

export interface ScrollBoardProps {
  header?: string[];
  data?: Array<Array<string | number>>;
  rowNum?: number;
  waitTime?: number;
  headerHeight?: number;
  headerBGC?: string;
  oddRowBGC?: string;
  evenRowBGC?: string;
  columnWidth?: number[];
  headerAligns?: string[];
  dataAligns?: string[];
  index?: boolean;
  indexHeader?: string;
  carousel?: 'single' | 'page';
  hoverPause?: boolean;
  headerFont?: ScrollBoardFont;
  bodyFont?: ScrollBoardFont;
}

const ScrollBoardWrapper: FC<ScrollBoardProps> = memo(props => {
  const { headerFont, bodyFont, ...boardProps } = props;
  return (
    <StyledScrollBoardContainer
      headerFont={headerFont}
      bodyFont={bodyFont}
      headerAligns={boardProps.headerAligns}
      dataAligns={boardProps.dataAligns}
    >
      <ScrollBoard
        config={{
          header: boardProps.header,
          data: boardProps.data,
          rowNum: boardProps.rowNum,
          waitTime: boardProps.waitTime,
          headerHeight: boardProps.headerHeight,
          headerBGC: boardProps.headerBGC,
          oddRowBGC: boardProps.oddRowBGC,
          evenRowBGC: boardProps.evenRowBGC,
          columnWidth: boardProps.columnWidth,
          align: boardProps.dataAligns,
          index: boardProps.index,
          indexHeader: boardProps.indexHeader,
          carousel: boardProps.carousel,
          hoverPause: boardProps.hoverPause,
        }}
      />
    </StyledScrollBoardContainer>
  );
});

const buildAlignCss = (
  headerAligns?: string[],
  dataAligns?: string[],
): string => {
  const build = (selector: string, aligns?: string[]): string => {
    if (!Array.isArray(aligns) || !aligns.length) {
      return '';
    }
    return aligns
      .map((align, idx) => `${selector}:nth-child(${idx + 1}){text-align:${align};}`)
      .join('');
  };
  const headerCss = build('.dv-scroll-board .header .header-item', headerAligns);
  const dataCss = build('.dv-scroll-board .rows .row-item .ceil', dataAligns);
  return headerCss + dataCss;
};

const StyledScrollBoardContainer = styled.div<{
  headerFont?: ScrollBoardFont;
  bodyFont?: ScrollBoardFont;
  headerAligns?: string[];
  dataAligns?: string[];
}>`
  width: 100%;
  height: 100%;
  overflow: hidden;

  .dv-scroll-board .header {
    ${p => `font-family: ${p?.headerFont?.fontFamily};`}
    ${p => (p?.headerFont?.fontSize ? `font-size: ${p.headerFont.fontSize}px;` : '')}
    ${p => (p?.headerFont?.fontWeight ? `font-weight: ${p.headerFont.fontWeight};` : '')}
    ${p => (p?.headerFont?.fontStyle ? `font-style: ${p.headerFont.fontStyle};` : '')}
    ${p => (p?.headerFont?.color ? `color: ${p.headerFont.color};` : '')}
  }

  .dv-scroll-board .rows .row-item {
    ${p => `font-family: ${p?.bodyFont?.fontFamily};`}
    ${p => (p?.bodyFont?.fontSize ? `font-size: ${p.bodyFont.fontSize}px;` : '')}
    ${p => (p?.bodyFont?.fontWeight ? `font-weight: ${p.bodyFont.fontWeight};` : '')}
    ${p => (p?.bodyFont?.fontStyle ? `font-style: ${p.bodyFont.fontStyle};` : '')}
    ${p => (p?.bodyFont?.color ? `color: ${p.bodyFont.color};` : '')}
  }

  ${p => buildAlignCss(p.headerAligns, p.dataAligns)}
`;

export default ScrollBoardWrapper;