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

import { createGlobalStyle } from 'styled-components';

/**
 * Ant Design 4.x 组件暗色主题样式覆盖。
 *
 * 背景：从 Craco (Webpack) 迁移到 Vite 后，less.modifyVars 无法在浏览器端使用，
 * 导致 changeAntdTheme 函数失效。antd.min.css 始终加载明亮主题，切换暗色模式时
 * Ant Design 组件（如 Menu、Button、Modal 等）的样式不受影响。
 *
 * 解决方案：通过 styled-components createGlobalStyle，根据当前主题动态覆盖
 * Ant Design 组件的关键 CSS 类名，实现暗色模式切换。
 */
export const AntdBase = createGlobalStyle`
  /* stylelint-disable no-descending-specificity */
  body {
    /* ============ Menu ============ */
    .ant-menu {
      color: ${p => p.theme.textColorSnd};
      background: ${p => p.theme.componentBackground};
    }
    .ant-menu-item,
    .ant-menu-submenu-title {
      color: ${p => p.theme.textColorSnd};
    }
    .ant-menu-item:hover,
    .ant-menu-submenu-title:hover {
      color: ${p => p.theme.textColor};
    }
    .ant-menu-item-selected {
      color: ${p => p.theme.textColor};
    }
    .ant-menu:not(.ant-menu-horizontal) .ant-menu-item-selected {
      background: ${p => p.theme.emphasisBackground};
    }
    .ant-menu:not(.ant-menu-dark) .ant-menu-item-selected {
      background: ${p => p.theme.emphasisBackground};
    }
    .ant-menu-submenu-selected {
      color: ${p => p.theme.textColor};
    }
    .ant-menu-submenu > .ant-menu {
      background: ${p => p.theme.componentBackground};
    }
    .ant-menu-submenu-popup {
      background: ${p => p.theme.componentBackground};
    }
    .ant-menu-vertical .ant-menu-item::after,
    .ant-menu-vertical-left .ant-menu-item::after,
    .ant-menu-vertical-right .ant-menu-item::after,
    .ant-menu-inline .ant-menu-item::after {
      border-right-color: ${p => p.theme.primary};
    }

    /* ============ Button ============ */
    .ant-btn {
      color: ${p => p.theme.textColorSnd};
      background: ${p => p.theme.componentBackground};
      border-color: ${p => p.theme.borderColorBase};
    }
    .ant-btn:hover,
    .ant-btn:focus {
      color: ${p => p.theme.primary};
      background: ${p => p.theme.componentBackground};
      border-color: ${p => p.theme.primary};
    }
    .ant-btn-primary {
      color: ${p => p.theme.white};
      background: ${p => p.theme.primary};
      border-color: ${p => p.theme.primary};
    }
    .ant-btn-primary:hover,
    .ant-btn-primary:focus {
      color: ${p => p.theme.white};
      background: ${p => p.theme.primary};
      border-color: ${p => p.theme.primary};
      opacity: 0.85;
    }
    .ant-btn-ghost {
      color: ${p => p.theme.textColorSnd};
      background: transparent;
      border-color: ${p => p.theme.borderColorBase};
    }
    .ant-btn-ghost:hover,
    .ant-btn-ghost:focus {
      color: ${p => p.theme.primary};
      border-color: ${p => p.theme.primary};
    }
    .ant-btn-dashed {
      color: ${p => p.theme.textColorSnd};
      background: ${p => p.theme.componentBackground};
      border-color: ${p => p.theme.borderColorBase};
    }
    .ant-btn-link {
      color: ${p => p.theme.primary};
      background: transparent;
    }
    .ant-btn-text {
      color: ${p => p.theme.textColorSnd};
      background: transparent;
    }
    .ant-btn-text:hover {
      color: ${p => p.theme.textColor};
      background: ${p => p.theme.emphasisBackground};
    }
    .ant-btn-background-ghost {
      color: ${p => p.theme.textColorLight};
      background: transparent !important;
      border-color: ${p => p.theme.textColorLight};
    }
    .ant-btn-background-ghost.ant-btn-primary {
      color: ${p => p.theme.primary};
      border-color: ${p => p.theme.primary};
    }
    .ant-btn-dangerous {
      color: ${p => p.theme.error};
      border-color: ${p => p.theme.error};
    }
    .ant-btn-dangerous.ant-btn-primary {
      color: ${p => p.theme.white};
      background: ${p => p.theme.error};
      border-color: ${p => p.theme.error};
    }

    /* ============ Modal ============ */
    .ant-modal-content {
      background: ${p => p.theme.componentBackground};
    }
    .ant-modal-header {
      background: ${p => p.theme.componentBackground};
      border-bottom-color: ${p => p.theme.borderColorSplit};
    }
    .ant-modal-title {
      color: ${p => p.theme.textColor};
    }
    .ant-modal-footer {
      border-top-color: ${p => p.theme.borderColorSplit};
    }
    .ant-modal-close {
      color: ${p => p.theme.textColorLight};
    }
    .ant-modal-close:hover {
      color: ${p => p.theme.textColor};
    }
    .ant-modal-mask {
      background: ${p => p.theme.black};
    }
    .ant-modal-confirm-body .ant-modal-confirm-title {
      color: ${p => p.theme.textColor};
    }
    .ant-modal-confirm-body .ant-modal-confirm-content {
      color: ${p => p.theme.textColorSnd};
    }

    /* ============ Select ============ */
    .ant-select-auto-complete .ant-select-selector {
      background: ${p => p.theme.componentBackground};
      border-color: ${p => p.theme.borderColorBase};
    }
    .ant-select:not(.ant-select-customize-input) .ant-select-selector {
      background: ${p => p.theme.componentBackground};
      border-color: ${p => p.theme.borderColorBase};
    }
    .ant-select:hover:not(.ant-select-disabled) .ant-select-selector {
      border-color: ${p => p.theme.primary};
    }
    .ant-select-focused:not(.ant-select-disabled).ant-select:not(.ant-select-customize-input) .ant-select-selector {
      border-color: ${p => p.theme.primary};
      box-shadow: 0 0 0 2px ${p => p.theme.primary}33;
    }
    .ant-select-single .ant-select-selector .ant-select-selection-item,
    .ant-select-single .ant-select-selector .ant-select-selection-placeholder {
      color: ${p => p.theme.textColorSnd};
    }
    .ant-select-arrow {
      color: ${p => p.theme.textColorLight};
    }
    .ant-select-dropdown {
      background: ${p => p.theme.componentBackground};
    }
    .ant-select-item {
      color: ${p => p.theme.textColorSnd};
    }
    .ant-select-item-option-active:not(.ant-select-item-option-disabled) {
      background: ${p => p.theme.emphasisBackground};
    }
    .ant-select-item-option-selected:not(.ant-select-item-option-disabled) {
      color: ${p => p.theme.primary};
      background: ${p => p.theme.emphasisBackground};
    }

    /* ============ Input ============ */
    .ant-input {
      color: ${p => p.theme.textColor};
      background: ${p => p.theme.componentBackground};
      border-color: ${p => p.theme.borderColorBase};
    }
    .ant-input:hover {
      border-color: ${p => p.theme.primary};
    }
    .ant-input:focus,
    .ant-input-focused {
      border-color: ${p => p.theme.primary};
      box-shadow: 0 0 0 2px ${p => p.theme.primary}33;
    }
    .ant-input::placeholder {
      color: ${p => p.theme.textColorDisabled};
    }
    .ant-input-group-addon {
      color: ${p => p.theme.textColorSnd};
      background: ${p => p.theme.emphasisBackground};
      border-color: ${p => p.theme.borderColorBase};
    }
    .ant-input-affix-wrapper {
      background: ${p => p.theme.componentBackground};
      border-color: ${p => p.theme.borderColorBase};
    }
    .ant-input-affix-wrapper:hover {
      border-color: ${p => p.theme.primary};
    }
    .ant-input-affix-wrapper-focused {
      border-color: ${p => p.theme.primary};
      box-shadow: 0 0 0 2px ${p => p.theme.primary}33;
    }
    .ant-input-affix-wrapper .ant-input-prefix,
    .ant-input-affix-wrapper .ant-input-suffix {
      color: ${p => p.theme.textColorLight};
    }

    /* ============ InputNumber ============ */
    .ant-input-number {
      color: ${p => p.theme.textColor};
      background: ${p => p.theme.componentBackground};
      border-color: ${p => p.theme.borderColorBase};
    }
    .ant-input-number:hover {
      border-color: ${p => p.theme.primary};
    }
    .ant-input-number-focused {
      border-color: ${p => p.theme.primary};
      box-shadow: 0 0 0 2px ${p => p.theme.primary}33;
    }
    .ant-input-number-handler-wrap {
      background: ${p => p.theme.componentBackground};
      border-left-color: ${p => p.theme.borderColorBase};
    }
    .ant-input-number-handler {
      color: ${p => p.theme.textColorLight};
    }
    .ant-input-number-handler:hover {
      height: 40% !important;
    }
    .ant-input-number-handler-up-inner,
    .ant-input-number-handler-down-inner {
      color: ${p => p.theme.textColorLight};
    }

    /* ============ Table ============ */
    .ant-table {
      color: ${p => p.theme.textColor};
      background: ${p => p.theme.componentBackground};
    }
    .ant-table-thead > tr > th {
      color: ${p => p.theme.textColor};
      background: ${p => p.theme.emphasisBackground};
      border-bottom-color: ${p => p.theme.borderColorSplit};
    }
    .ant-table-tbody > tr > td {
      border-bottom-color: ${p => p.theme.borderColorSplit};
    }
    .ant-table-placeholder {
      background: ${p => p.theme.componentBackground};
    }
    .ant-table-bordered .ant-table-thead > tr > th,
    .ant-table-bordered .ant-table-tbody > tr > td {
      border-right-color: ${p => p.theme.borderColorSplit};
    }
    .ant-table-tbody > tr.ant-table-row-selected > td {
      background: ${p => p.theme.emphasisBackground};
    }
    .ant-table-tbody > tr.ant-table-row:hover > td {
      background: ${p => p.theme.emphasisBackground};
    }
    .ant-table-bordered .ant-table-container {
      border-color: ${p => p.theme.borderColorSplit};
    }
    .ant-table-filter-trigger {
      color: ${p => p.theme.textColorLight};
    }
    .ant-table-filter-trigger:hover {
      color: ${p => p.theme.textColor};
    }
    .ant-table-filter-dropdown {
      background: ${p => p.theme.componentBackground};
    }

    /* ============ Dropdown ============ */
    .ant-dropdown-menu {
      background: ${p => p.theme.componentBackground};
    }
    .ant-dropdown-menu-item {
      color: ${p => p.theme.textColorSnd};
    }
    .ant-dropdown-menu-item:hover {
      background: ${p => p.theme.emphasisBackground};
    }
    .ant-dropdown-menu-item-selected {
      color: ${p => p.theme.primary};
      background: ${p => p.theme.emphasisBackground};
    }
    .ant-dropdown-menu-submenu-title {
      color: ${p => p.theme.textColorSnd};
    }
    .ant-dropdown-menu-submenu-title:hover {
      background: ${p => p.theme.emphasisBackground};
    }

    /* ============ Popover ============ */
    .ant-popover-inner {
      background: ${p => p.theme.componentBackground};
    }
    .ant-popover-title {
      color: ${p => p.theme.textColor};
      border-bottom-color: ${p => p.theme.borderColorSplit};
    }
    .ant-popover-inner-content {
      color: ${p => p.theme.textColorSnd};
    }
    .ant-popover-arrow {
      border-color: ${p => p.theme.componentBackground};
    }

    /* ============ Tabs ============ */
    .ant-tabs {
      color: ${p => p.theme.textColor};
    }
    .ant-tabs-nav {
      color: ${p => p.theme.textColorSnd};
    }
    .ant-tabs-tab {
      color: ${p => p.theme.textColorSnd};
    }
    .ant-tabs-tab:hover {
      color: ${p => p.theme.textColor};
    }
    .ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn {
      color: ${p => p.theme.primary};
    }
    .ant-tabs-ink-bar {
      background: ${p => p.theme.primary};
    }
    .ant-tabs-top > .ant-tabs-nav::before,
    .ant-tabs-bottom > .ant-tabs-nav::before,
    .ant-tabs-top > div > .ant-tabs-nav::before,
    .ant-tabs-bottom > div > .ant-tabs-nav::before {
      border-bottom-color: ${p => p.theme.borderColorSplit};
    }
    .ant-tabs-card > .ant-tabs-nav .ant-tabs-tab {
      background: ${p => p.theme.emphasisBackground};
      border-color: ${p => p.theme.borderColorSplit};
    }
    .ant-tabs-card > .ant-tabs-nav .ant-tabs-tab-active {
      background: ${p => p.theme.componentBackground};
      border-bottom-color: ${p => p.theme.componentBackground};
    }
    .ant-tabs-card.ant-tabs-top > .ant-tabs-nav .ant-tabs-tab-active {
      border-bottom-color: ${p => p.theme.componentBackground};
    }

    /* ============ Card ============ */
    .ant-card {
      color: ${p => p.theme.textColor};
      background: ${p => p.theme.componentBackground};
    }
    .ant-card-head {
      color: ${p => p.theme.textColor};
      border-bottom-color: ${p => p.theme.borderColorSplit};
    }
    .ant-card-extra {
      color: ${p => p.theme.textColorSnd};
    }
    .ant-card-bordered {
      border-color: ${p => p.theme.borderColorSplit};
    }
    .ant-card-grid {
      box-shadow: 1px 0 0 0 ${p => p.theme.borderColorSplit}, 0 1px 0 0 ${p => p.theme.borderColorSplit};
    }
    .ant-card-actions {
      background: ${p => p.theme.componentBackground};
      border-top-color: ${p => p.theme.borderColorSplit};
    }
    .ant-card-actions > li {
      color: ${p => p.theme.textColorLight};
    }
    .ant-card-actions > li:not(:last-child) {
      border-right-color: ${p => p.theme.borderColorSplit};
    }

    /* ============ Breadcrumb ============ */
    .ant-breadcrumb {
      color: ${p => p.theme.textColorLight};
    }
    .ant-breadcrumb a {
      color: ${p => p.theme.textColorLight};
    }
    .ant-breadcrumb a:hover {
      color: ${p => p.theme.textColor};
    }
    .ant-breadcrumb > span:last-child {
      color: ${p => p.theme.textColor};
    }
    .ant-breadcrumb-separator {
      color: ${p => p.theme.textColorDisabled};
    }

    /* ============ Pagination ============ */
    .ant-pagination-item {
      background: ${p => p.theme.componentBackground};
      border-color: ${p => p.theme.borderColorBase};
    }
    .ant-pagination-item a {
      color: ${p => p.theme.textColorSnd};
    }
    .ant-pagination-item:hover {
      border-color: ${p => p.theme.primary};
    }
    .ant-pagination-item-active {
      border-color: ${p => p.theme.primary};
    }
    .ant-pagination-item-active a {
      color: ${p => p.theme.primary};
    }
    .ant-pagination-item:hover a {
      color: ${p => p.theme.primary};
    }
    .ant-pagination-prev .ant-pagination-item-link,
    .ant-pagination-next .ant-pagination-item-link {
      color: ${p => p.theme.textColorSnd};
      background: ${p => p.theme.componentBackground};
      border-color: ${p => p.theme.borderColorBase};
    }
    .ant-pagination-prev:hover .ant-pagination-item-link,
    .ant-pagination-next:hover .ant-pagination-item-link {
      color: ${p => p.theme.primary};
      border-color: ${p => p.theme.primary};
    }
    .ant-pagination-options-quick-jumper {
      color: ${p => p.theme.textColorSnd};
    }

    /* ============ Drawer ============ */
    .ant-drawer-content {
      background: ${p => p.theme.componentBackground};
    }
    .ant-drawer-header {
      background: ${p => p.theme.componentBackground};
      border-bottom-color: ${p => p.theme.borderColorSplit};
    }
    .ant-drawer-title {
      color: ${p => p.theme.textColor};
    }
    .ant-drawer-close {
      color: ${p => p.theme.textColorLight};
    }
    .ant-drawer-close:hover {
      color: ${p => p.theme.textColor};
    }
    .ant-drawer-body {
      color: ${p => p.theme.textColorSnd};
    }
    .ant-drawer-mask {
      background: rgba(0, 0, 0, 0.45);
    }

    /* ============ Checkbox ============ */
    .ant-checkbox-inner {
      background: ${p => p.theme.componentBackground};
      border-color: ${p => p.theme.borderColorBase};
    }
    .ant-checkbox-checked .ant-checkbox-inner {
      background: ${p => p.theme.primary};
      border-color: ${p => p.theme.primary};
    }
    .ant-checkbox-disabled .ant-checkbox-inner {
      background: ${p => p.theme.emphasisBackground};
      border-color: ${p => p.theme.borderColorBase} !important;
    }
    .ant-checkbox-wrapper:hover .ant-checkbox-inner,
    .ant-checkbox:hover .ant-checkbox-inner,
    .ant-checkbox-input:focus + .ant-checkbox-inner {
      border-color: ${p => p.theme.primary};
    }
    .ant-checkbox-checked::after {
      border-color: ${p => p.theme.primary};
    }

    /* ============ Radio ============ */
    .ant-radio-wrapper {
      color: ${p => p.theme.textColorSnd};
    }
    .ant-radio-inner {
      background: ${p => p.theme.componentBackground};
      border-color: ${p => p.theme.borderColorBase};
    }
    .ant-radio-checked .ant-radio-inner {
      border-color: ${p => p.theme.primary};
    }
    .ant-radio-inner::after {
      background: ${p => p.theme.primary};
    }
    .ant-radio-disabled .ant-radio-inner {
      background: ${p => p.theme.emphasisBackground};
      border-color: ${p => p.theme.borderColorBase} !important;
    }
    .ant-radio-wrapper:hover .ant-radio,
    .ant-radio:hover .ant-radio-inner,
    .ant-radio-input:focus + .ant-radio-inner {
      border-color: ${p => p.theme.primary};
    }

    /* ============ Switch ============ */
    .ant-switch {
      background: ${p => p.theme.borderColorBase};
    }
    .ant-switch-checked {
      background: ${p => p.theme.primary};
    }

    /* ============ Tree ============ */
    .ant-tree {
      color: ${p => p.theme.textColor};
      background: ${p => p.theme.componentBackground};
    }
    .ant-tree .ant-tree-node-content-wrapper {
      color: ${p => p.theme.textColorSnd};
    }
    .ant-tree .ant-tree-node-content-wrapper:hover {
      background: ${p => p.theme.emphasisBackground};
    }
    .ant-tree .ant-tree-node-content-wrapper.ant-tree-node-selected {
      color: ${p => p.theme.primary};
      background: ${p => p.theme.emphasisBackground};
    }
    .ant-tree .ant-tree-treenode:hover {
      background: ${p => p.theme.emphasisBackground};
    }
    .ant-tree-checkbox-inner {
      background: ${p => p.theme.componentBackground};
      border-color: ${p => p.theme.borderColorBase};
    }
    .ant-tree-checkbox-checked .ant-tree-checkbox-inner {
      background: ${p => p.theme.primary};
      border-color: ${p => p.theme.primary};
    }

    /* ============ Tag ============ */
    .ant-tag {
      color: ${p => p.theme.textColorSnd};
      background: ${p => p.theme.emphasisBackground};
      border-color: ${p => p.theme.borderColorBase};
    }

    /* ============ Badge ============ */
    .ant-badge-count {
      color: ${p => p.theme.white};
    }

    /* ============ Spin ============ */
    .ant-spin {
      color: ${p => p.theme.primary};
    }
    .ant-spin-nested-loading > div > .ant-spin .ant-spin-text {
      color: ${p => p.theme.primary};
    }
    .ant-spin-dot-item {
      background: ${p => p.theme.primary};
    }

    /* ============ Progress ============ */
    .ant-progress-inner {
      background: ${p => p.theme.emphasisBackground};
    }
    .ant-progress-text {
      color: ${p => p.theme.textColorSnd};
    }

    /* ============ Slider ============ */
    .ant-slider-rail {
      background: ${p => p.theme.emphasisBackground};
    }
    .ant-slider-track {
      background: ${p => p.theme.primary};
    }
    .ant-slider-handle {
      background: ${p => p.theme.componentBackground};
      border-color: ${p => p.theme.primary};
    }
    .ant-slider-handle:focus {
      border-color: ${p => p.theme.primary};
      box-shadow: 0 0 0 5px ${p => p.theme.primary}33;
    }
    .ant-slider:hover .ant-slider-rail {
      background: ${p => p.theme.emphasisBackground};
    }
    .ant-slider:hover .ant-slider-track {
      background: ${p => p.theme.primary};
    }

    /* ============ Message ============ */
    .ant-message-notice-content {
      background: ${p => p.theme.componentBackground};
      box-shadow: ${p => p.theme.shadow2};
    }

    /* ============ Notification ============ */
    .ant-notification-notice {
      background: ${p => p.theme.componentBackground};
    }
    .ant-notification-notice-message {
      color: ${p => p.theme.textColor};
    }
    .ant-notification-notice-description {
      color: ${p => p.theme.textColorSnd};
    }
    .ant-notification-notice-close {
      color: ${p => p.theme.textColorLight};
    }

    /* ============ Alert ============ */
    .ant-alert-message {
      color: ${p => p.theme.textColor};
    }
    .ant-alert-description {
      color: ${p => p.theme.textColorSnd};
    }
    .ant-alert-close-icon .anticon-close {
      color: ${p => p.theme.textColorLight};
    }

    /* ============ Steps ============ */
    .ant-steps-item-title {
      color: ${p => p.theme.textColor} !important;
    }
    .ant-steps-item-description {
      color: ${p => p.theme.textColorSnd} !important;
    }
    .ant-steps-item-wait .ant-steps-item-icon {
      border-color: ${p => p.theme.borderColorBase};
    }
    .ant-steps-item-wait .ant-steps-item-icon > .ant-steps-icon {
      color: ${p => p.theme.textColorDisabled};
    }
    .ant-steps-item-finish .ant-steps-item-icon {
      border-color: ${p => p.theme.primary};
    }
    .ant-steps-item-finish .ant-steps-item-icon > .ant-steps-icon {
      color: ${p => p.theme.primary};
    }
    .ant-steps-item-process .ant-steps-item-icon {
      background: ${p => p.theme.primary};
      border-color: ${p => p.theme.primary};
    }

    /* ============ Collapse ============ */
    .ant-collapse {
      background: ${p => p.theme.componentBackground};
      border-color: ${p => p.theme.borderColorSplit};
    }
    .ant-collapse > .ant-collapse-item {
      border-bottom-color: ${p => p.theme.borderColorSplit};
    }
    .ant-collapse > .ant-collapse-item > .ant-collapse-header {
      color: ${p => p.theme.textColor};
    }
    .ant-collapse-content {
      background: ${p => p.theme.componentBackground};
      border-top-color: ${p => p.theme.borderColorSplit};
    }
    .ant-collapse-content > .ant-collapse-content-box {
      color: ${p => p.theme.textColorSnd};
    }

    /* ============ DatePicker ============ */
    .ant-picker {
      background: ${p => p.theme.componentBackground};
      border-color: ${p => p.theme.borderColorBase};
    }
    .ant-picker:hover {
      border-color: ${p => p.theme.primary};
    }
    .ant-picker-focused {
      border-color: ${p => p.theme.primary};
      box-shadow: 0 0 0 2px ${p => p.theme.primary}33;
    }
    .ant-picker-input > input {
      color: ${p => p.theme.textColor};
    }
    .ant-picker-input > input::placeholder {
      color: ${p => p.theme.textColorDisabled};
    }
    .ant-picker-suffix {
      color: ${p => p.theme.textColorLight};
    }
    .ant-picker-clear {
      color: ${p => p.theme.textColorLight};
      background: ${p => p.theme.componentBackground};
    }
    .ant-picker-panel-container {
      background: ${p => p.theme.componentBackground};
    }
    .ant-picker-panel {
      border-color: ${p => p.theme.borderColorSplit};
    }
    .ant-picker-header {
      color: ${p => p.theme.textColor};
      border-bottom-color: ${p => p.theme.borderColorSplit};
    }
    .ant-picker-header button {
      color: ${p => p.theme.textColorLight};
    }
    .ant-picker-header button:hover {
      color: ${p => p.theme.textColor};
    }
    .ant-picker-cell {
      color: ${p => p.theme.textColorDisabled};
    }
    .ant-picker-cell-in-view {
      color: ${p => p.theme.textColor};
    }
    .ant-picker-cell:hover .ant-picker-cell-inner {
      background: ${p => p.theme.emphasisBackground};
    }
    .ant-picker-cell-in-view.ant-picker-cell-today .ant-picker-cell-inner::before {
      border-color: ${p => p.theme.primary};
    }
    .ant-picker-cell-in-view.ant-picker-cell-selected .ant-picker-cell-inner {
      background: ${p => p.theme.primary};
    }
    .ant-picker-footer {
      border-top-color: ${p => p.theme.borderColorSplit};
    }
    .ant-picker-today-btn {
      color: ${p => p.theme.primary};
    }
    .ant-picker-time-panel {
      border-left-color: ${p => p.theme.borderColorSplit};
    }
    .ant-picker-time-panel-column > li.ant-picker-time-panel-cell .ant-picker-time-panel-cell-inner {
      color: ${p => p.theme.textColorSnd};
    }
    .ant-picker-time-panel-column > li.ant-picker-time-panel-cell-selected .ant-picker-time-panel-cell-inner {
      color: ${p => p.theme.primary};
      background: ${p => p.theme.emphasisBackground};
    }
    .ant-picker-time-panel-column > li.ant-picker-time-panel-cell:hover .ant-picker-time-panel-cell-inner {
      background: ${p => p.theme.emphasisBackground};
    }

    /* ============ Transfer ============ */
    .ant-transfer-list {
      background: ${p => p.theme.componentBackground};
      border-color: ${p => p.theme.borderColorBase};
    }
    .ant-transfer-list-header {
      color: ${p => p.theme.textColor};
      background: ${p => p.theme.componentBackground};
      border-bottom-color: ${p => p.theme.borderColorSplit};
    }
    .ant-transfer-list-content-item {
      color: ${p => p.theme.textColorSnd};
    }
    .ant-transfer-list-content-item:hover {
      background: ${p => p.theme.emphasisBackground};
    }
    .ant-transfer-list-content-item-checked {
      background: ${p => p.theme.emphasisBackground};
    }

    /* ============ List ============ */
    .ant-list {
      color: ${p => p.theme.textColor};
    }
    .ant-list-item {
      border-bottom-color: ${p => p.theme.borderColorSplit};
    }
    .ant-list-item-meta-title {
      color: ${p => p.theme.textColor};
    }
    .ant-list-item-meta-description {
      color: ${p => p.theme.textColorLight};
    }
    .ant-list-empty-text {
      color: ${p => p.theme.textColorDisabled};
    }

    /* ============ Skeleton ============ */
    .ant-skeleton-content .ant-skeleton-title {
      background: ${p => p.theme.emphasisBackground};
    }
    .ant-skeleton-content .ant-skeleton-paragraph > li {
      background: ${p => p.theme.emphasisBackground};
    }

    /* ============ Result ============ */
    .ant-result-title {
      color: ${p => p.theme.textColor};
    }
    .ant-result-subtitle {
      color: ${p => p.theme.textColorSnd};
    }
    .ant-result-extra {
      color: ${p => p.theme.textColorSnd};
    }

    /* ============ Empty ============ */
    .ant-empty-description {
      color: ${p => p.theme.textColorDisabled};
    }

    /* ============ Statistic ============ */
    .ant-statistic-title {
      color: ${p => p.theme.textColorLight};
    }
    .ant-statistic-content {
      color: ${p => p.theme.textColor};
    }

    /* ============ Timeline ============ */
    .ant-timeline-item-tail {
      border-left-color: ${p => p.theme.borderColorSplit};
    }
    .ant-timeline-item-head {
      background: ${p => p.theme.componentBackground};
    }

    /* ============ Rate ============ */
    .ant-rate-star-first,
    .ant-rate-star-second {
      color: ${p => p.theme.borderColorBase};
    }
    .ant-rate-star-full .ant-rate-star-first,
    .ant-rate-star-full .ant-rate-star-second {
      color: ${p => p.theme.yellow};
    }

    /* ============ Cascader ============ */
    .ant-cascader-menu {
      border-right-color: ${p => p.theme.borderColorSplit};
    }
    .ant-cascader-menus {
      background: ${p => p.theme.componentBackground};
    }
    .ant-cascader-menu-item {
      color: ${p => p.theme.textColorSnd};
    }
    .ant-cascader-menu-item:hover {
      background: ${p => p.theme.emphasisBackground};
    }
    .ant-cascader-menu-item-active {
      background: ${p => p.theme.emphasisBackground};
    }

    /* ============ Mentions ============ */
    .ant-mentions {
      background: ${p => p.theme.componentBackground};
      border-color: ${p => p.theme.borderColorBase};
    }
    .ant-mentions:hover {
      border-color: ${p => p.theme.primary};
    }
    .ant-mentions-focused {
      border-color: ${p => p.theme.primary};
      box-shadow: 0 0 0 2px ${p => p.theme.primary}33;
    }
    .ant-mentions > textarea {
      color: ${p => p.theme.textColor};
    }
    .ant-mentions-dropdown {
      background: ${p => p.theme.componentBackground};
    }
    .ant-mentions-dropdown-menu-item {
      color: ${p => p.theme.textColorSnd};
    }
    .ant-mentions-dropdown-menu-item:hover {
      background: ${p => p.theme.emphasisBackground};
    }
    .ant-mentions-dropdown-menu-item-active {
      background: ${p => p.theme.emphasisBackground};
    }

    /* ============ Comment ============ */
    .ant-comment-avatar {
      background: ${p => p.theme.emphasisBackground};
    }
    .ant-comment-content-author-name {
      color: ${p => p.theme.textColor};
    }
    .ant-comment-content-author-time {
      color: ${p => p.theme.textColorLight};
    }
    .ant-comment-content-detail {
      color: ${p => p.theme.textColorSnd};
    }

    /* ============ Descriptions ============ */
    .ant-descriptions-title {
      color: ${p => p.theme.textColor};
    }
    .ant-descriptions-item-label {
      color: ${p => p.theme.textColorLight};
    }
    .ant-descriptions-item-content {
      color: ${p => p.theme.textColor};
    }
    .ant-descriptions-bordered .ant-descriptions-item-label,
    .ant-descriptions-bordered .ant-descriptions-item-content {
      border-right-color: ${p => p.theme.borderColorSplit};
    }
    .ant-descriptions-bordered .ant-descriptions-view {
      border-color: ${p => p.theme.borderColorSplit};
    }
    .ant-descriptions-bordered .ant-descriptions-item-label {
      background: ${p => p.theme.emphasisBackground};
    }

    /* ============ Divider ============ */
    .ant-divider {
      border-top-color: ${p => p.theme.borderColorSplit};
    }
    .ant-divider-inner-text {
      color: ${p => p.theme.textColorSnd};
    }
    .ant-divider-plain.ant-divider-with-text {
      color: ${p => p.theme.textColorSnd};
    }

    /* ============ Upload ============ */
    .ant-upload {
      color: ${p => p.theme.textColorSnd};
    }
    .ant-upload.ant-upload-drag {
      background: ${p => p.theme.emphasisBackground};
      border-color: ${p => p.theme.borderColorBase};
    }
    .ant-upload.ant-upload-drag p.ant-upload-drag-icon .anticon {
      color: ${p => p.theme.textColorLight};
    }
    .ant-upload.ant-upload-drag p.ant-upload-text {
      color: ${p => p.theme.textColor};
    }

    /* ============ PageHeader ============ */
    .ant-page-header {
      color: ${p => p.theme.textColor};
      background: ${p => p.theme.componentBackground};
    }
    .ant-page-header-back-button {
      color: ${p => p.theme.textColorSnd};
    }
    .ant-page-header-heading-title {
      color: ${p => p.theme.textColor};
    }
    .ant-page-header-heading-sub-title {
      color: ${p => p.theme.textColorLight};
    }

    /* ============ Avatar ============ */
    .ant-avatar {
      color: ${p => p.theme.textColor};
      background: ${p => p.theme.emphasisBackground};
    }

    /* ============ Tooltip ============ */
    /* Ant Design 4.x 内置的 tooltip 暗色模式已经正常工作，不需要额外覆盖 */

    /* ============ BackTop ============ */
    .ant-back-top-content {
      background: ${p => p.theme.primary};
    }

    /* ============ Anchor ============ */
    .ant-anchor-link-title {
      color: ${p => p.theme.textColorSnd};
    }
    .ant-anchor-link-active > .ant-anchor-link-title {
      color: ${p => p.theme.primary};
    }
    .ant-anchor-ink-ball {
      background: ${p => p.theme.componentBackground};
      border-color: ${p => p.theme.primary};
    }

    /* ============ Affix ============ */
    .ant-affix {
      background: ${p => p.theme.componentBackground};
    }
  }
`;