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
import * as AntDesignIcons from '@ant-design/icons';
import { WidgetContext } from 'app/pages/DashBoardPage/components/WidgetProvider/WidgetProvider';
import { getIconConfig } from 'app/pages/DashBoardPage/components/Widgets/IconWidget/iconConfig';
import React, { useContext, useMemo } from 'react';
import styled from 'styled-components/macro';

const sanitizeSvg = (svgString: string): string => {
  if (!svgString) return '';

  let result = svgString;

  // Remove width/height attributes from the svg element to allow CSS scaling
  result = result.replace(/<svg([^>]*?)\s+width="[^"]*"/i, '<svg$1');
  result = result.replace(/<svg([^>]*?)\s+height="[^"]*"/i, '<svg$1');

  // Remove inline fill attributes from all elements to let CSS currentColor work
  result = result.replace(/\s+fill="[^"]*"/gi, '');

  // Remove inline stroke attributes that might conflict with color
  result = result.replace(/\s+stroke="[^"]*"/gi, '');

  return result;
};

export const IconWidgetCore: React.FC<{}> = () => {
  const widget = useContext(WidgetContext);

  const iconConfig = useMemo(() => {
    const props = widget.config.customConfig.props;
    return getIconConfig(props);
  }, [widget.config.customConfig.props]);

  const {
    sourceType,
    antdIcon,
    customSvg,
    iconColor,
    secondaryColor,
    iconSize,
    rotation,
  } = iconConfig;

  const iconStyle: React.CSSProperties = {
    color: iconColor,
    fontSize: `${iconSize}px`,
    transform: `rotate(${rotation}deg)`,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
  };

  const renderIcon = () => {
    if (sourceType === 'custom' && customSvg) {
      const sanitizedSvg = sanitizeSvg(customSvg);
      return (
        <SvgWrapper
          style={iconStyle}
          dangerouslySetInnerHTML={{ __html: sanitizedSvg }}
        />
      );
    }

    if (sourceType === 'antd' && antdIcon) {
      const IconComponent =
        (AntDesignIcons as any)[antdIcon] || AntDesignIcons.BarChartOutlined;

      const isTwoTone = antdIcon.endsWith('TwoTone');
      if (isTwoTone) {
        const twoToneStyle: React.CSSProperties = {
          fontSize: iconStyle.fontSize,
          transform: iconStyle.transform,
          display: iconStyle.display,
          alignItems: iconStyle.alignItems,
          justifyContent: iconStyle.justifyContent,
          lineHeight: iconStyle.lineHeight,
        };
        return React.createElement(IconComponent, {
          style: twoToneStyle,
          twoToneColor: secondaryColor
            ? [iconColor, secondaryColor]
            : iconColor,
        });
      }
      return React.createElement(IconComponent, { style: iconStyle });
    }

    return <Placeholder style={iconStyle}>?</Placeholder>;
  };

  return <Wrapper>{renderIcon()}</Wrapper>;
};

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
`;

const SvgWrapper = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;

  svg {
    width: 100%;
    height: 100%;
    fill: currentColor;
  }

  svg path,
  svg circle,
  svg rect,
  svg polygon,
  svg ellipse,
  svg line,
  svg polyline {
    fill: currentColor;
    stroke: currentColor;
  }
`;

const Placeholder = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  opacity: 0.3;
`;
