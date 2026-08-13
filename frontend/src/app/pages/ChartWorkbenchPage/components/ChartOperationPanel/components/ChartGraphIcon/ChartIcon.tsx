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

import { FC } from 'react';
import styled from 'styled-components';
import { FONT_SIZE_ICON_MD, SPACE_TIMES } from 'styles/StyleConstants';

interface ChartIconProps {
  iconStr?: string;
  isMatchRequirement?: boolean;
  isActive?: boolean;
  size?: string | number;
}

const ChartIcon: FC<ChartIconProps> = ({
  iconStr,
  isMatchRequirement,
  isActive,
  size = FONT_SIZE_ICON_MD,
}) => {
  const renderIcon = ({
    iconStr,
    isMatchRequirement,
    isActive,
    size,
  }: {
    iconStr?: string;
    isMatchRequirement?: boolean;
    isActive?: boolean;
    size: string | number;
  }) => {
    const safeIconStr = iconStr ?? '';
    if (/^<svg/.test(safeIconStr) || /^<\?xml/.test(safeIconStr)) {
      return <SVGImageRender {...{ iconStr: safeIconStr, isMatchRequirement, size }} />;
    }
    if (/svg\+xml;base64/.test(safeIconStr)) {
      return (
        <Base64ImageRender {...{ iconStr: safeIconStr, isMatchRequirement, size }} />
      );
    }
    return (
      <SVGFontIconRender {...{ iconStr: safeIconStr, isMatchRequirement, size }} />
    );
  };

  return renderIcon({ iconStr, isMatchRequirement, isActive, size });
};

export default ChartIcon;

const SVGImageRender = ({
  iconStr,
  isMatchRequirement,
  size,
}: {
  iconStr: string;
  isMatchRequirement?: boolean;
  size: string | number;
}) => {
  const encodedStr = window.encodeURIComponent(iconStr);
  return (
    <StyledInlineSVGIcon
      alt="svg icon"
      style={{ height: size, width: size }}
      src={`data:image/svg+xml;utf8,${encodedStr}`}
      isMatchRequirement={isMatchRequirement}
    />
  );
};

const Base64ImageRender = ({
  iconStr,
  isMatchRequirement,
  size,
}: {
  iconStr: string;
  isMatchRequirement?: boolean;
  size: string | number;
}) => {
  return (
    <StyledBase64Icon
      alt="svg icon"
      style={{ height: size, width: size }}
      src={iconStr}
      isMatchRequirement={isMatchRequirement}
    />
  );
};

const SVGFontIconRender = ({
  iconStr,
  isMatchRequirement,
  size,
}: {
  iconStr: string;
  isMatchRequirement?: boolean;
  size: string | number;
}) => {
  return (
    <StyledSVGFontIcon
      isMatchRequirement={isMatchRequirement}
      className={`iconfont icon-${!iconStr ? 'chart' : iconStr}`}
      style={{ fontSize: size, lineHeight: `${size}px` }}
    />
  );
};

const StyledInlineSVGIcon = styled.img<{ isMatchRequirement?: boolean }>`
  opacity: ${p => (p.isMatchRequirement ? 1 : 0.7)};
`;

const StyledSVGFontIcon = styled.i<{ isMatchRequirement?: boolean }>`
  opacity: ${p => (p.isMatchRequirement ? 1 : 0.7)};
`;

const StyledBase64Icon = styled.img<{
  isMatchRequirement?: boolean;
}>`
  opacity: ${p => (p.isMatchRequirement ? 1 : 0.7)};
`;
