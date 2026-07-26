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

import { Button, Tooltip } from 'antd';
import React, { useCallback, useState } from 'react';
import styled from 'styled-components/macro';
import useI18NPrefix from 'app/hooks/useI18NPrefix';

declare global {
  interface Window {
    EyeDropper?: any;
  }
}

interface EyedropperProps {
  onPick: (color: string) => void;
  disabled?: boolean;
}

const EyedropperIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 1024 1024"
    width="1em"
    height="1em"
    fill="currentColor"
    className={className}
  >
    <path d="M864 256L736 128c-16-16-41-16-57 0L607 199 355 451 219 315c-16-16-41-16-57 0L77 400c-16 16-16 41 0 57l142 142-166 166c-16 16-16 41 0 57l69 69c8 8 18 12 29 12s21-4 29-12l166-166 142 142c16 16 41 16 57 0l85-85c16-16 16-41 0-57L613 670l252-252 71-72c17-15 17-41 0-57zM241 639l-56 56-56-56 108-108 56 56-52 52z" />
  </svg>
);

export const Eyedropper: React.FC<EyedropperProps> = ({
  onPick,
  disabled,
}) => {
  const t = useI18NPrefix('components.colorPicker');
  const [isPicking, setIsPicking] = useState(false);
  const supported = typeof window !== 'undefined' && !!window.EyeDropper;

  const handlePick = useCallback(async () => {
    if (!window.EyeDropper) return;
    try {
      setIsPicking(true);
      const eyeDropper = new window.EyeDropper();
      const result = await eyeDropper.open();
      onPick(result.sRGBHex);
    } catch (e) {
    } finally {
      setIsPicking(false);
    }
  }, [onPick]);

  if (!supported) return null;

  return (
    <Tooltip title={t('eyedropper')} placement="top">
      <EyedropperBtn
        size="small"
        disabled={disabled || isPicking}
        onClick={handlePick}
        icon={<EyedropperIcon />}
      />
    </Tooltip>
  );
};

const EyedropperBtn = styled(Button)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;

  svg {
    font-size: 14px;
  }
`;