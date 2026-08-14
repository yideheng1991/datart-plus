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

import { createListenerMiddleware, isRejected } from '@reduxjs/toolkit';
import { message } from 'antd';

const rejectedErrorHandlerMiddleware = createListenerMiddleware();

rejectedErrorHandlerMiddleware.startListening({
  predicate: isRejected,
  effect: async (action: any, listenerApi) => {
    listenerApi.cancelActiveListeners();
    await listenerApi.delay(100);

    const actionType = action?.type || 'unknown';

    let errorMessage = '';
    if (action?.payload?.message) {
      errorMessage = action.payload.message;
    } else if (typeof action?.payload === 'string') {
      errorMessage = action.payload;
    } else if (action?.error?.message) {
      errorMessage = action.error.message;
    }

    if (errorMessage) {
      message.error(errorMessage);
    }

    console.error(
      `%cRedux Rejection Error | ${actionType}`,
      'color: #ff4d4f; font-weight: bold; font-size: 13px;',
    );
    console.groupCollapsed(`Details for: ${actionType}`);
    console.log('%cThunk Name/Type:', 'font-weight: bold; color: #1890ff;', actionType);
    console.log('%cMeta Arg:', 'font-weight: bold; color: #52c41a;', action?.meta?.arg);
    console.log('%cPayload:', 'font-weight: bold; color: #fa8c16;', action?.payload);
    console.log('%cError Object:', 'font-weight: bold; color: #f5222d;', action?.error);
    console.log('%cFull Action:', 'font-weight: bold; color: #722ed1;', action);
    if (errorMessage) {
      console.log('%cResolved Message:', 'font-weight: bold; color: #eb2f96;', errorMessage);
    }
    console.groupEnd();
  },
});

export default rejectedErrorHandlerMiddleware;
