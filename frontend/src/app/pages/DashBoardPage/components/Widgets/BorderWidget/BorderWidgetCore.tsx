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
import styled from 'styled-components/macro';
import { WidgetContext } from '../../WidgetProvider/WidgetProvider';
import { borderToolkit } from './borderConfig';

export const BorderWidgetCore: React.FC = memo(() => {
  const widget = useContext(WidgetContext);
  const { type, firstColor, secondColor, title, titleWidth, titleFont } =
    borderToolkit.getBorderConfig(widget.config.customConfig.props);

  const renderBorder = () => {
    const color = [firstColor, secondColor];
    const key = `${type}-${new Date().getTime()}`;
    switch (type) {
      case 0:
        return <datav.BorderBox1 color={color} key={key} />;
      case 1:
        return <datav.BorderBox2 color={color} key={key} />;
      case 2:
        return <datav.BorderBox3 color={color} key={key} />;
      case 3:
        return <datav.BorderBox4 color={color} key={key} />;
      case 4:
        return <datav.BorderBox5 color={color} key={key} />;
      case 5:
        return <datav.BorderBox6 color={color} key={key} />;
      case 6:
        return <datav.BorderBox7 color={color} key={key} />;
      case 7:
        return <datav.BorderBox8 color={color} key={key} />;
      case 8:
        return <datav.BorderBox9 color={color} key={key} />;
      case 9:
        return <datav.BorderBox10 color={color} key={key} />;
      case 10:
        return (
          <BorderBox11Wrapper titleFont={titleFont}>
            <datav.BorderBox11
              color={color}
              title={title}
              titleWidth={titleWidth}
              key={key}
            />
          </BorderBox11Wrapper>
        );
      case 11:
        return <datav.BorderBox12 color={color} key={key} />;
      case 12:
        return <datav.BorderBox13 color={color} key={key} />;
      default:
        return <datav.BorderBox1 color={color} key={key} />;
    }
  };

  return <Wrapper>{renderBorder()}</Wrapper>;
});

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
`;

interface BorderBox11WrapperProps {
  titleFont: {
    fontFamily: string;
    fontSize: string;
    fontWeight: string;
    fontStyle: string;
    color: string;
  };
}

const BorderBox11Wrapper = styled.div<BorderBox11WrapperProps>`
  width: 100%;
  height: 100%;

  svg text.dv-border-box-11-title {
    font-family: ${props => props.titleFont.fontFamily} !important;
    font-size: ${props => props.titleFont.fontSize}px !important;
    font-style: ${props => props.titleFont.fontStyle} !important;
    font-weight: ${props => props.titleFont.fontWeight} !important;
    fill: ${props => props.titleFont.color} !important;
  }
`;
