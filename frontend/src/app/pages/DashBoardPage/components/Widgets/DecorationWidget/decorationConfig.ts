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
import { ChartStyleSectionComponentType } from 'app/constants';
import { ORIGINAL_TYPE_MAP } from 'app/pages/DashBoardPage/constants';
import type {
  WidgetActionListItem,
  widgetActionType,
  WidgetMeta,
  WidgetProto,
  WidgetToolkit,
} from 'app/pages/DashBoardPage/types/widgetTypes';
import { getJsonConfigs } from 'app/pages/DashBoardPage/utils';
import {
  initBackgroundTpl,
  initBorderTpl,
  initPaddingTpl,
  initTitleTpl,
  initWidgetName,
  PaddingI18N,
  TitleI18N,
  widgetTpl,
} from '../../WidgetManager/utils/init';

const initDecorationWidgetTpl = () => {
  return {
    label: 'decorationWidget.decorationGroup',
    key: 'decorationGroup',
    comType: ChartStyleSectionComponentType.GROUP,
    rows: [
      {
        label: 'decorationWidget.type',
        key: 'type',
        value: 1,
        comType: ChartStyleSectionComponentType.SELECT,
        options: {
          translateItemLabel: true,
          items: [
            { label: 'decorationWidget.decoration1', value: 0 },
            { label: 'decorationWidget.decoration2', value: 1 },
            { label: 'decorationWidget.decoration3', value: 2 },
            { label: 'decorationWidget.decoration4', value: 3 },
            { label: 'decorationWidget.decoration5', value: 4 },
            { label: 'decorationWidget.decoration6', value: 5 },
            { label: 'decorationWidget.decoration7', value: 6 },
            { label: 'decorationWidget.decoration8', value: 7 },
            { label: 'decorationWidget.decoration9', value: 8 },
            { label: 'decorationWidget.decoration10', value: 9 },
            { label: 'decorationWidget.decoration11', value: 10 },
          ],
        },
      },
      {
        label: 'decorationWidget.firstColor',
        key: 'firstColor',
        value: '#4fd2dd',
        comType: ChartStyleSectionComponentType.FONT_COLOR,
      },
      {
        label: 'decorationWidget.secondColor',
        key: 'secondColor',
        value: '#235fa7',
        comType: ChartStyleSectionComponentType.FONT_COLOR,
      },
      {
        label: 'decorationWidget.reverse',
        key: 'reverse',
        value: false,
        comType: ChartStyleSectionComponentType.SWITCH,
        watcher: {
          deps: ['type'],
          action: props => {
            return {
              hidden: props.type !== 1 && props.type !== 3,
            };
          },
        },
      },
      {
        label: 'decorationWidget.animationDirection',
        key: 'animationDirection',
        value: 'normal',
        comType: ChartStyleSectionComponentType.SELECT,
        options: {
          translateItemLabel: true,
          items: [
            { label: 'decorationWidget.directionNormal', value: 'normal' },
            { label: 'decorationWidget.directionReverse', value: 'reverse' },
          ],
        },
        watcher: {
          deps: ['type'],
          action: props => {
            return {
              hidden: props.type !== 1 && props.type !== 3,
            };
          },
        },
      },
    ],
  };
};
const decorationWidgetI18N = {
  zh: {
    decorationGroup: '装饰配置',
    type: '样式',
    firstColor: '主颜色',
    secondColor: '副颜色',
    reverse: '旋转90度',
    animationDirection: '动画方向',
    directionNormal: '正向',
    directionReverse: '反向',
    decoration1: '装饰1',
    decoration2: '装饰2',
    decoration3: '装饰3',
    decoration4: '装饰4',
    decoration5: '装饰5',
    decoration6: '装饰6',
    decoration7: '装饰7',
    decoration8: '装饰8',
    decoration9: '装饰9',
    decoration10: '装饰10',
    decoration11: '装饰11',
  },
  en: {
    decorationGroup: 'Decoration Config',
    type: 'Style',
    firstColor: 'Primary Color',
    secondColor: 'Secondary Color',
    reverse: 'Rotate 90°',
    animationDirection: 'Animation Direction',
    directionNormal: 'Forward',
    directionReverse: 'Reverse',
    decoration1: 'Decoration 1',
    decoration2: 'Decoration 2',
    decoration3: 'Decoration 3',
    decoration4: 'Decoration 4',
    decoration5: 'Decoration 5',
    decoration6: 'Decoration 6',
    decoration7: 'Decoration 7',
    decoration8: 'Decoration 8',
    decoration9: 'Decoration 9',
    decoration10: 'Decoration 10',
    decoration11: 'Decoration 11',
  },
};
const NameI18N = {
  zh: '装饰',
  en: 'Decoration',
};
export const widgetMeta: WidgetMeta = {
  icon: 'decoration-widget',
  originalType: ORIGINAL_TYPE_MAP.decoration,
  canWrapped: true,
  controllable: false,
  linkable: false,
  canFullScreen: true,
  singleton: false,

  i18ns: [
    {
      lang: 'zh-CN',
      translation: {
        desc: 'decoration',
        widgetName: NameI18N.zh,
        action: {},
        decorationWidget: decorationWidgetI18N.zh,
        title: TitleI18N.zh,
        background: { backgroundGroup: '背景' },
        padding: PaddingI18N.zh,
        border: { borderGroup: '边框' },
      },
    },
    {
      lang: 'en-US',
      translation: {
        desc: 'decoration',
        widgetName: NameI18N.en,
        action: {},
        decorationWidget: decorationWidgetI18N.en,
        title: TitleI18N.en,
        background: { backgroundGroup: 'Background' },
        padding: PaddingI18N.en,
        border: { borderGroup: 'Border' },
      },
    },
  ],
};
export interface DecorationWidgetToolKit extends WidgetToolkit {
  getDecorationConfig: (props) => {
    type: number;
    firstColor: string;
    secondColor: string;
    reverse: boolean;
    animationDirection: string;
  };
}
export const widgetToolkit: DecorationWidgetToolKit = {
  create: opt => {
    const widget = widgetTpl();
    widget.id = widgetMeta.originalType + widget.id;
    widget.parentId = opt.parentId || '';
    widget.viewIds = opt.viewIds || [];
    widget.relations = opt.relations || [];
    widget.config.originalType = widgetMeta.originalType;
    widget.config.type = 'media';
    widget.config.name = opt.name || '';
    widget.config.rect.height = 50;
    widget.config.pRect.height = 3;

    widget.config.customConfig.props = [
      { ...initDecorationWidgetTpl() },
      { ...initTitleTpl() },
      { ...initBackgroundTpl() },
      { ...initPaddingTpl() },
      { ...initBorderTpl() },
    ];

    return widget;
  },
  getName(key) {
    return initWidgetName(NameI18N, key);
  },
  edit() {},
  save() {},
  getDropDownList(...arg) {
    const list: WidgetActionListItem<widgetActionType>[] = [
      {
        key: 'edit',
        renderMode: ['edit'],
      },
      {
        key: 'delete',
        renderMode: ['edit'],
      },
      {
        key: 'lock',
        renderMode: ['edit'],
      },
      {
        key: 'group',
        renderMode: ['edit'],
      },
    ];
    return list;
  },
  getDecorationConfig(props) {
    const [type, firstColor, secondColor, reverse, animationDirection] =
      getJsonConfigs(
        props,
        ['decorationGroup'],
        ['type', 'firstColor', 'secondColor', 'reverse', 'animationDirection'],
      ) as [number, string, string, boolean, string];
    return {
      type: type ?? 1,
      firstColor: firstColor ?? '#4fd2dd',
      secondColor: secondColor ?? '#235fa7',
      reverse: reverse ?? false,
      animationDirection: animationDirection ?? 'normal',
    };
  },
};

const decorationProto: WidgetProto = {
  originalType: widgetMeta.originalType,
  meta: widgetMeta,
  toolkit: widgetToolkit,
};
export const decorationToolkit = widgetToolkit;
export default decorationProto;
