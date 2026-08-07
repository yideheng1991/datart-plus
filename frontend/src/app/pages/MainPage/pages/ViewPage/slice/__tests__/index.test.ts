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

import { initialState, reducer } from '..';
import { ViewViewModelStages } from '../../constants';
import { generateEditingView } from '../../utils';
import { generateNlSql } from '../thunks';

jest.mock('react-monaco-editor', () => ({ monaco: {} }));

describe('generateNlSql reducer', () => {
  test('updates the requested view when another view is active', () => {
    const target = generateEditingView({
      id: 'target-view',
      type: 'NL_SQL',
      sourceId: 'source-id',
    });
    const active = generateEditingView({
      id: 'active-view',
      type: 'SQL',
      script: 'select active',
    });
    const args = {
      id: target.id,
      prompt: 'show monthly sales',
      selectedTables: [
        {
          database: 'analytics',
          table: 'sales',
        },
      ],
    };
    const pendingState = reducer(
      {
        ...initialState,
        editingViews: [target, active],
        currentEditingView: active.id,
      },
      generateNlSql.pending('request-id', args),
    );

    const nextState = reducer(
      pendingState,
      generateNlSql.fulfilled(
        {
          sql: 'select month, sum(amount) from sales group by month',
          llmConfigId: 'config-id',
          model: 'gpt-test',
          generatedAt: '2026-08-05T12:00:00Z',
          schemaUpdatedAt: '2026-08-05T11:00:00Z',
        },
        'request-id',
        args,
      ),
    );

    const updatedTarget = nextState.editingViews.find(
      view => view.id === target.id,
    );
    const unchangedActive = nextState.editingViews.find(
      view => view.id === active.id,
    );

    expect(updatedTarget).toMatchObject({
      script: 'select month, sum(amount) from sales group by month',
      nlSqlGenerating: false,
      touched: true,
      stage: ViewViewModelStages.Initialized,
      model: {
        nlSql: {
          prompt: args.prompt,
          sourceId: target.sourceId,
          selectedTables: args.selectedTables,
          llmConfigId: 'config-id',
          model: 'gpt-test',
        },
      },
    });
    expect(unchangedActive?.script).toBe('select active');
    expect(nextState.currentEditingView).toBe(active.id);
  });
});
