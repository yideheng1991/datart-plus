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

import { RobotOutlined, SettingOutlined } from '@ant-design/icons';
import { Button, Input, message, Space, Typography } from 'antd';
import useI18NPrefix from 'app/hooks/useI18NPrefix';
import { selectIsOrgOwner } from 'app/pages/MainPage/slice/selectors';
import { FC, useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { SPACE, SPACE_MD, SPACE_XS } from 'styles/StyleConstants';
import { getErrorMessage } from 'utils/utils';
import { SchemaTableSelector } from '../../components/SchemaTableSelector';
import { ViewStatus } from '../../constants';
import {
  selectCurrentEditingViewAttr,
  selectDatabaseSchemaLoading,
  selectSourceDatabaseSchemas,
} from '../../slice/selectors';
import { generateNlSql } from '../../slice/thunks';
import {
  DatabaseSchema,
  HierarchyModel,
  NlSqlSelectedTable,
} from '../../slice/types';
import { LlmConfigDrawer } from './LlmConfigDrawer';

const MAX_SELECTED_TABLES = 50;

interface NlSqlBuilderProps {
  allowManage: boolean;
}

export const NlSqlBuilder: FC<NlSqlBuilderProps> = ({ allowManage }) => {
  const dispatch = useDispatch();
  const t = useI18NPrefix('view.nlSql');
  const isOrgOwner = useSelector(selectIsOrgOwner);
  const id = useSelector(state =>
    selectCurrentEditingViewAttr(state, { name: 'id' }),
  ) as string;
  const sourceId = useSelector(state =>
    selectCurrentEditingViewAttr(state, { name: 'sourceId' }),
  ) as string;
  const sourceSchemas = useSelector(state =>
    selectSourceDatabaseSchemas(state, { id: sourceId }),
  ) as DatabaseSchema[] | undefined;
  const schemaLoading = useSelector(selectDatabaseSchemaLoading);
  const status = useSelector(state =>
    selectCurrentEditingViewAttr(state, { name: 'status' }),
  ) as ViewStatus;
  const model = useSelector(state =>
    selectCurrentEditingViewAttr(state, { name: 'model' }),
  ) as HierarchyModel;
  const generating = useSelector(state =>
    selectCurrentEditingViewAttr(state, { name: 'nlSqlGenerating' }),
  ) as boolean;
  const [prompt, setPrompt] = useState(model?.nlSql?.prompt || '');
  const [selectedTables, setSelectedTables] = useState<NlSqlSelectedTable[]>(
    [],
  );
  const [configVisible, setConfigVisible] = useState(false);
  const isArchived = status === ViewStatus.Archived;

  useEffect(() => {
    setPrompt(model?.nlSql?.prompt || '');
  }, [id, model?.nlSql?.prompt]);

  useEffect(() => {
    if (model?.nlSql?.sourceId !== sourceId || !sourceSchemas) {
      setSelectedTables([]);
      return;
    }
    const savedTables = (model.nlSql.selectedTables || []).filter(
      selectedTable =>
        sourceSchemas.some(
          schema =>
            schema.dbName === selectedTable.database &&
            schema.tables?.some(
              table => table.tableName === selectedTable.table,
            ),
        ),
    );
    setSelectedTables(savedTables);
  }, [
    id,
    model?.nlSql?.selectedTables,
    model?.nlSql?.sourceId,
    sourceId,
    sourceSchemas,
  ]);

  const generate = useCallback(async () => {
    try {
      await (
        dispatch(
          generateNlSql({
            id,
            prompt: prompt.trim(),
            selectedTables,
          }),
        ) as any
      ).unwrap();
      message.success(t('generateSuccess'));
    } catch (error) {
      message.error(getErrorMessage(error));
    }
  }, [dispatch, id, prompt, selectedTables, t]);

  return (
    <Panel>
      <TableSelectorArea>
        <Typography.Text strong>{t('tables')}</Typography.Text>
        <SchemaTableSelector
          schemas={sourceSchemas}
          value={selectedTables}
          multiple
          maxSelections={MAX_SELECTED_TABLES}
          loading={schemaLoading}
          disabled={!sourceId || !allowManage || isArchived}
          placeholder={t('selectTablePlaceholder')}
          onChange={setSelectedTables}
        />
      </TableSelectorArea>
      <PromptArea>
        <Input.TextArea
          value={prompt}
          maxLength={4000}
          showCount
          autoSize={{ minRows: 2, maxRows: 5 }}
          disabled={!allowManage || isArchived}
          placeholder={t('promptPlaceholder')}
          onChange={event => setPrompt(event.target.value)}
          style={{ flex: 1, minWidth: 0 }}
        />
        <Actions>
          <Space>
            <Button
              icon={<RobotOutlined />}
              type="primary"
              loading={generating}
              disabled={
                !allowManage ||
                isArchived ||
                !sourceId ||
                !prompt.trim() ||
                generating
              }
              onClick={generate}
            >
              {t('generate')}
            </Button>
            {isOrgOwner && (
              <Button
                icon={<SettingOutlined />}
                onClick={() => setConfigVisible(true)}
              >
                {t('manageConfig')}
              </Button>
            )}
          </Space>
          {!sourceId && (
            <Typography.Text type="secondary">
              {t('selectSourceTip')}
            </Typography.Text>
          )}
          {sourceId && selectedTables.length === 0 && (
            <Typography.Text type="warning">
              {t('selectTableTip')}
            </Typography.Text>
          )}
          {model?.nlSql?.generatedAt && (
            <Typography.Text type="secondary">
              {t('generatedBy', false, {
                model: model.nlSql.model,
                time: new Date(model.nlSql.generatedAt).toLocaleString(),
              })}
            </Typography.Text>
          )}
        </Actions>
      </PromptArea>
      {isOrgOwner && (
        <LlmConfigDrawer
          visible={configVisible}
          onClose={() => setConfigVisible(false)}
        />
      )}
    </Panel>
  );
};

const Panel = styled.div`
  flex-shrink: 0;
  padding: ${SPACE_MD};
  background-color: ${p => p.theme.componentBackground};
  border-bottom: 1px solid ${p => p.theme.borderColorSplit};
`;

const TableSelectorArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${SPACE};
  margin-bottom: ${SPACE_MD};
`;

const PromptArea = styled.div`
  display: flex;
  gap: ${SPACE_MD};
  align-items: flex-start;

  & > .ant-input {
    flex: 1;
    min-width: 0;
  }
`;

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${SPACE_XS};
  min-width: 280px;
  padding-top: ${SPACE};
`;
