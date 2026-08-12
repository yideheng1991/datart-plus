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

import useI18NPrefix from 'app/hooks/useI18NPrefix';
import { IChart } from 'app/types/Chart';
import { ChartConfig } from 'app/types/ChartConfig';
import { reachLowerBoundCount } from 'app/utils/internalChartHelper';
import { FC, memo, useCallback, useLayoutEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import {
  BORDER_RADIUS,
  SPACE_TIMES,
} from 'styles/StyleConstants';
import ChartIcon from '../../ChartGraphIcon/ChartIcon';

const Chart404Graph: FC<{
  chart?: IChart;
  chartConfig?: ChartConfig;
}> = memo(({ chart, chartConfig }) => {
  const t = useI18NPrefix(`viz.palette`);
  const containerRef = useRef<HTMLDivElement>(null);
  const [iconSize, setIconSize] = useState(120);
  const [fontSize, setFontSize] = useState(14);

  const measure = useCallback(() => {
    const el = containerRef.current;
    if (!el) {
      return;
    }
    const { width, height } = el.getBoundingClientRect();
    // 根据容器较小边推算尺寸，保证 icon + 文字始终可见
    const base = Math.min(width, height);
    const nextIconSize = Math.max(24, Math.min(120, Math.round(base * 0.5)));
    const nextFontSize = Math.max(10, Math.min(16, Math.round(base * 0.06)));
    setIconSize(nextIconSize);
    setFontSize(nextFontSize);
  }, []);

  useLayoutEffect(() => {
    measure();
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver(() => measure());
    observer.observe(el);
    return () => observer.disconnect();
  }, [measure]);

  const renderChartLimitation = () => {
    const sections = chartConfig?.datas
      ?.filter(s => reachLowerBoundCount(s?.limit, s.rows?.length) > 0)
      .map(s => {
        return (
          <li key={s.key}>
            {t('present.needMore', false, {
              type: t('data.' + s.label),
              num: reachLowerBoundCount(s?.limit, s.rows?.length),
            })}
          </li>
        );
      });
    return sections;
  };

  return (
    <StyledChart404Graph ref={containerRef}>
      <StyledChartIcon style={{ fontSize }}>
        <ChartIcon
          iconStr={chart?.meta?.icon}
          isMatchRequirement={false}
          size={iconSize}
        />
      </StyledChartIcon>
      <StyledLimitation style={{ fontSize }}>{renderChartLimitation()}</StyledLimitation>
    </StyledChart404Graph>
  );
});

export default Chart404Graph;

const StyledChart404Graph = styled.div`
  display: flex;
  flex-flow: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: ${SPACE_TIMES(2)};
  overflow: hidden;
  color: ${p => p.theme.normal};
  text-align: center;
  opacity: 0.6;
`;

const StyledChartIcon = styled.div`
  margin-bottom: ${SPACE_TIMES(2)};
  line-height: 1;
  border-radius: ${BORDER_RADIUS};
`;

const StyledLimitation = styled.ul`
  max-width: 100%;
  padding: 0;
  margin: 0;
  word-break: break-word;
  list-style: none;
`;
