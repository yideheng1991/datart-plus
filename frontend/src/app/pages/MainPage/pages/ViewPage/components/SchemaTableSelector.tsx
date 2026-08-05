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

import { DatabaseOutlined, TableOutlined } from '@ant-design/icons';
import { Select } from 'antd';
import { FC, useCallback, useMemo } from 'react';
import styled from 'styled-components/macro';
import { SPACE_XS } from 'styles/StyleConstants';
import { DatabaseSchema, SchemaTableIdentifier } from '../slice/types';

interface SchemaTableSelectorProps {
  schemas?: DatabaseSchema[];
  value: SchemaTableIdentifier[];
  multiple?: boolean;
  maxSelections?: number;
  loading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  onChange: (tables: SchemaTableIdentifier[]) => void;
}

const getTableKey = (database: string, table: string) =>
  JSON.stringify([database, table]);

export const SchemaTableSelector: FC<SchemaTableSelectorProps> = ({
  schemas,
  value,
  multiple = false,
  maxSelections,
  loading,
  disabled,
  placeholder,
  onChange,
}) => {
  const availableTables = useMemo(() => {
    const tables = new Map<string, SchemaTableIdentifier>();
    schemas?.forEach(schema => {
      schema.tables?.forEach(table => {
        const selectedTable = {
          database: schema.dbName,
          table: table.tableName,
        };
        tables.set(
          getTableKey(selectedTable.database, selectedTable.table),
          selectedTable,
        );
      });
    });
    return tables;
  }, [schemas]);
  const selectedKeys = useMemo(
    () =>
      value
        .map(table => getTableKey(table.database, table.table))
        .filter(key => availableTables.has(key)),
    [availableTables, value],
  );
  const handleChange = useCallback(
    rawValue => {
      const keys = (Array.isArray(rawValue) ? rawValue : [rawValue]).filter(
        (key): key is string => typeof key === 'string',
      );
      const selectionLimit = multiple ? maxSelections || keys.length : 1;
      const tables = keys
        .map(key => availableTables.get(key))
        .filter((table): table is SchemaTableIdentifier => !!table)
        .slice(0, selectionLimit);
      onChange(tables);
    },
    [availableTables, maxSelections, multiple, onChange],
  );
  const selectionLimitReached =
    multiple && !!maxSelections && selectedKeys.length >= maxSelections;

  return (
    <Select
      mode={multiple ? 'multiple' : undefined}
      value={multiple ? selectedKeys : selectedKeys[0]}
      loading={loading}
      disabled={disabled}
      placeholder={placeholder}
      maxTagCount={multiple ? 3 : undefined}
      allowClear
      showSearch
      filterOption={(input, option) =>
        String(option?.title || '')
          .toLowerCase()
          .includes(input.toLowerCase())
      }
      onChange={handleChange}
      style={{ width: '100%' }}
    >
      {schemas?.map(schema => (
        <Select.OptGroup
          key={schema.dbName}
          label={
            <GroupLabel>
              <DatabaseOutlined />
              <span>{schema.dbName}</span>
            </GroupLabel>
          }
        >
          {schema.tables?.map(table => {
            const key = getTableKey(schema.dbName, table.tableName);
            return (
              <Select.Option
                key={key}
                value={key}
                title={`${schema.dbName}.${table.tableName}`}
                disabled={selectionLimitReached && !selectedKeys.includes(key)}
              >
                <OptionLabel>
                  <TableOutlined />
                  <span>{table.tableName}</span>
                </OptionLabel>
              </Select.Option>
            );
          })}
        </Select.OptGroup>
      ))}
    </Select>
  );
};

const GroupLabel = styled.span`
  display: inline-flex;
  gap: ${SPACE_XS};
  align-items: center;
`;

const OptionLabel = styled.span`
  display: inline-flex;
  gap: ${SPACE_XS};
  align-items: center;
`;
