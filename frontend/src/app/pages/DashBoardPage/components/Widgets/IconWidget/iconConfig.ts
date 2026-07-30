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

const initIconTpl = () => {
  return {
    label: 'icon.iconGroup',
    key: 'iconGroup',
    comType: 'group',
    rows: [
      {
        label: 'icon.sourceType',
        key: 'sourceType',
        value: 'antd',
        comType: ChartStyleSectionComponentType.SELECT,
        options: {
          items: [
            { label: 'Ant Design Icons', key: 'antd', value: 'antd' },
            { label: 'Custom SVG', key: 'custom', value: 'custom' },
          ],
        },
      },
      {
        label: 'icon.antdIcon',
        key: 'antdIcon',
        value: 'BarChartOutlined',
        comType: ChartStyleSectionComponentType.ICON_PICKER,
        options: {},
        watcher: {
          deps: ['sourceType'],
          action: props => {
            if (props.sourceType === 'antd') {
              return { disabled: false };
            }
            return { disabled: true };
          },
        },
      },
      {
        label: 'icon.customSvg',
        key: 'customSvg',
        value: '',
        comType: ChartStyleSectionComponentType.INPUT,
        options: { placeholder: 'Paste SVG source code here...' },
        watcher: {
          deps: ['sourceType'],
          action: props => {
            if (props.sourceType === 'custom') {
              return { disabled: false };
            }
            return { disabled: true };
          },
        },
      },
      {
        label: 'icon.iconColor',
        key: 'iconColor',
        value: '#1890ff',
        comType: ChartStyleSectionComponentType.FONT_COLOR,
      },
      {
        label: 'icon.secondaryColor',
        key: 'secondaryColor',
        value: '',
        comType: ChartStyleSectionComponentType.FONT_COLOR,
        watcher: {
          deps: ['sourceType', 'antdIcon'],
          action: props => {
            if (
              props.sourceType === 'antd' &&
              props.antdIcon &&
              props.antdIcon.endsWith('TwoTone')
            ) {
              return { disabled: false };
            }
            return { disabled: true };
          },
        },
      },
      {
        label: 'icon.iconSize',
        key: 'iconSize',
        value: 64,
        comType: ChartStyleSectionComponentType.INPUT_NUMBER,
      },
      {
        label: 'icon.rotation',
        key: 'rotation',
        value: 0,
        comType: ChartStyleSectionComponentType.INPUT_NUMBER,
      },
    ],
  };
};

const iconI18N = {
  zh: {
    iconGroup: '图标配置',
    sourceType: '图标来源',
    antdIcon: '内置图标',
    customSvg: '自定义SVG源码',
    iconColor: '主颜色',
    secondaryColor: '副颜色',
    iconSize: '图标大小(px)',
    rotation: '旋转角度',
  },
  en: {
    iconGroup: 'Icon Config',
    sourceType: 'Source Type',
    antdIcon: 'Built-in Icon',
    customSvg: 'Custom SVG Source',
    iconColor: 'Primary Color',
    secondaryColor: 'Secondary Color',
    iconSize: 'Icon Size (px)',
    rotation: 'Rotation',
  },
};

const NameI18N = {
  zh: '图标',
  en: 'Icon',
};

export const widgetMeta: WidgetMeta = {
  icon: 'icon-widget',
  originalType: ORIGINAL_TYPE_MAP.icon,
  canWrapped: true,
  controllable: false,
  linkable: false,
  canFullScreen: true,
  singleton: false,

  i18ns: [
    {
      lang: 'zh-CN',
      translation: {
        desc: 'icon',
        widgetName: NameI18N.zh,
        action: {},
        title: TitleI18N.zh,
        icon: iconI18N.zh,
        background: { backgroundGroup: '背景' },
        padding: PaddingI18N.zh,
        border: { borderGroup: '边框' },
      },
    },
    {
      lang: 'en-US',
      translation: {
        desc: 'icon',
        widgetName: NameI18N.en,
        action: {},
        title: TitleI18N.en,
        icon: iconI18N.en,
        background: { backgroundGroup: 'Background' },
        padding: PaddingI18N.en,
        border: { borderGroup: 'Border' },
      },
    },
  ],
};

const widgetToolkit: WidgetToolkit = {
  create: opt => {
    const widget = widgetTpl();
    widget.id = widgetMeta.originalType + widget.id;
    widget.parentId = opt.parentId || '';
    widget.datachartId = opt.datachartId || '';
    widget.viewIds = opt.viewIds || [];
    widget.relations = opt.relations || [];
    widget.config.originalType = widgetMeta.originalType;
    widget.config.type = 'media';
    widget.config.name = opt.name || '';

    widget.config.customConfig.props = [
      { ...initIconTpl() },
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
};

export const getIconConfig = (props: any) => {
  const [sourceType] = getJsonConfigs(props, ['iconGroup'], ['sourceType']);
  const [antdIcon] = getJsonConfigs(props, ['iconGroup'], ['antdIcon']);
  const [customSvg] = getJsonConfigs(props, ['iconGroup'], ['customSvg']);
  const [iconColor] = getJsonConfigs(props, ['iconGroup'], ['iconColor']);
  const [secondaryColor] = getJsonConfigs(
    props,
    ['iconGroup'],
    ['secondaryColor'],
  );
  const [iconSize] = getJsonConfigs(props, ['iconGroup'], ['iconSize']);
  const [rotation] = getJsonConfigs(props, ['iconGroup'], ['rotation']);
  return {
    sourceType,
    antdIcon,
    customSvg,
    iconColor,
    secondaryColor,
    iconSize,
    rotation,
  };
};

const iconProto: WidgetProto = {
  originalType: widgetMeta.originalType,
  meta: widgetMeta,
  toolkit: widgetToolkit,
};
export default iconProto;
