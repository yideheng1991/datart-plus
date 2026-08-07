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
import * as datav from '@jiaminghi/data-view-react';
import { memo, useContext } from 'react';
import styled from 'styled-components';
import { WidgetContext } from '../../WidgetProvider/WidgetProvider';
import { decorationToolkit } from './decorationConfig';

export const DecorationWidgetCore: React.FC = memo(() => {
  const widget = useContext(WidgetContext);
  const { type, firstColor, secondColor, reverse, animationDirection } =
    decorationToolkit.getDecorationConfig(widget.config.customConfig.props);

  const renderDecoration = () => {
    const color = [firstColor, secondColor];
    const key = `${type}-${new Date().getTime()}`;

    const getAnimationStyle = (isVertical: boolean) => {
      if (animationDirection !== 'reverse') return undefined;
      return {
        transform: isVertical ? 'scaleY(-1)' : 'scaleX(-1)',
        transformOrigin: 'center center',
      };
    };

    switch (type) {
      case 0:
        return <datav.Decoration1 color={color} key={key} />;
      case 1:
        return (
          <datav.Decoration2
            color={color}
            reverse={reverse}
            style={getAnimationStyle(reverse)}
            key={key}
          />
        );
      case 2:
        return <datav.Decoration3 color={color} key={key} />;
      case 3:
        return (
          <datav.Decoration4
            color={color}
            reverse={reverse}
            style={getAnimationStyle(!reverse)}
            key={key}
          />
        );
      case 4:
        return <datav.Decoration5 color={color} key={key} />;
      case 5:
        return <datav.Decoration6 color={color} key={key} />;
      case 6:
        return <datav.Decoration7 color={color} key={key} />;
      case 7:
        return <datav.Decoration8 color={color} key={key} />;
      case 8:
        return <datav.Decoration9 color={color} key={key} />;
      case 9:
        return <datav.Decoration10 color={color} key={key} />;
      case 10:
        return <datav.Decoration11 color={color} key={key} />;
      default:
        return <datav.Decoration1 color={color} key={key} />;
    }
  };

  return <Wrapper>{renderDecoration()}</Wrapper>;
});

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
`;
