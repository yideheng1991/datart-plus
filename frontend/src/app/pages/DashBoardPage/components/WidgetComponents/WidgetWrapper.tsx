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
  BackgroundConfig,
  BorderConfig,
  WidgetPadding,
} from 'app/pages/DashBoardPage/pages/Board/slice/types';
import { getBackgroundImage } from 'app/pages/DashBoardPage/utils';
import { memo } from 'react';
import styled from 'styled-components/macro';
import { getBorderCss, getPaddingCss } from '../../utils/widget';

export const WidgetWrapper: React.FC<{
  background: BackgroundConfig;
  padding: WidgetPadding;
  border: BorderConfig;
}> = memo(props => {
  const { children, background, padding, border } = props;
  const paddingCss = getPaddingCss(padding as WidgetPadding);
  const borderCss = getBorderCss(border as BorderConfig);
  const opacity = background.opacity !== undefined ? background.opacity : 1;

  return (
    <Wrapper style={{ ...paddingCss, ...borderCss }}>
      <BackgroundLayer
        style={{
          backgroundColor: background.color,
          backgroundImage: getBackgroundImage(background.image),
          backgroundRepeat: background.repeat,
          backgroundSize: background.size,
          opacity,
        }}
      />
      <ContentLayer>{children}</ContentLayer>
    </Wrapper>
  );
});

const Wrapper = styled.div`
  position: relative;
  display: flex;
  flex: 1;
  min-height: 0;

  &:hover .widget-tool-dropdown {
    visibility: visible;
  }
`;

const BackgroundLayer = styled.div`
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
`;

const ContentLayer = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  flex: 1;
  min-height: 0;
`;
