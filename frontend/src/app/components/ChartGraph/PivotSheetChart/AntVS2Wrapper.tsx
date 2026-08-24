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

import { setLang } from '@antv/s2';
import '@antv/s2/dist/s2.min.css';
import { SheetComponent } from '@antv/s2-react';
import '@antv/s2-react/dist/s2-react.min.css';
import { getLang } from 'locales/i18n';
import { FC, memo } from 'react';
import styled from 'styled-components';
import { AndvS2Config } from './types';

setLang(['zh_CN', 'en_US'].find(lang => lang.includes(getLang()!)) as any);

const AntVS2Wrapper: FC<AndvS2Config> = memo(config => {
  const {
    dataCfg,
    options,
    themeCfg,
    onRowCellCollapsed,
    onRowCellAllCollapsed,
    onSelected,
    getSpreadSheet,
    onDataCellClick,
    ...resizeHandlers
  } = config;

  if (!dataCfg) {
    return <div></div>;
  }

  return (
    <StyledAntVS2Wrapper
      sheetType="pivot"
      dataCfg={dataCfg}
      options={options as any}
      themeCfg={themeCfg}
      adaptive={false}
      onRowCellCollapsed={onRowCellCollapsed}
      onRowCellAllCollapsed={onRowCellAllCollapsed}
      onDataCellSelected={onSelected}
      onDataCellClick={onDataCellClick}
      onMounted={spreadsheet => {
        getSpreadSheet?.(spreadsheet);
      }}
      {...(resizeHandlers as any)}
    />
  );
});

const StyledAntVS2Wrapper = styled(SheetComponent)``;

export default AntVS2Wrapper;
