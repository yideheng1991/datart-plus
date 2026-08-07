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

import {
  AutoComplete,
  Button,
  Drawer,
  Form,
  Input,
  InputNumber,
  List,
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Tag,
} from 'antd';
import useI18NPrefix from 'app/hooks/useI18NPrefix';
import { selectOrgId } from 'app/pages/MainPage/slice/selectors';
import { FC, useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { request2 } from 'utils/request';
import { getErrorMessage } from 'utils/utils';

interface LlmConfig {
  id: string;
  orgId: string;
  provider: string;
  apiBaseUrl: string;
  apiKeyConfigured: boolean;
  model: string;
  temperature: number;
  maxTokens: number;
  defaultSystemPrompt?: string;
  defaultPromptEnabled: boolean;
  active: boolean;
}

interface LlmConfigFormValues {
  provider: string;
  apiBaseUrl?: string;
  apiKey?: string;
  model: string;
  temperature: number;
  maxTokens: number;
  defaultSystemPrompt?: string;
  defaultPromptEnabled: boolean;
  active: boolean;
}

const PROVIDER_MODELS: Record<string, string[]> = {
  OPENAI: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
  DOUBAO: [
    'doubao-pro-4k',
    'doubao-pro-32k',
    'doubao-pro-128k',
    'doubao-lite-4k',
    'doubao-lite-32k',
  ],
  DASHSCOPE: ['qwen-max', 'qwen-plus', 'qwen-turbo', 'qwen-long'],
  CUSTOM: [],
};

interface LlmConfigDrawerProps {
  visible: boolean;
  onClose: () => void;
}

export const LlmConfigDrawer: FC<LlmConfigDrawerProps> = ({
  visible,
  onClose,
}) => {
  const orgId = useSelector(selectOrgId);
  const t = useI18NPrefix('view.nlSql.config');
  const [form] = Form.useForm<LlmConfigFormValues>();
  const [configs, setConfigs] = useState<LlmConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testingId, setTestingId] = useState('');
  const [editing, setEditing] = useState<LlmConfig>();
  const [formVisible, setFormVisible] = useState(false);
  const [provider, setProvider] = useState('OPENAI');
  const [defaultPromptEnabled, setDefaultPromptEnabled] = useState(false);
  const modelOptions = PROVIDER_MODELS[provider] || [];

  const showError = useCallback(error => {
    message.error(getErrorMessage(error));
  }, []);

  const loadConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await request2<LlmConfig[]>({
        url: '/llm/configs',
        method: 'GET',
        params: { orgId },
      });
      setConfigs(data);
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  }, [orgId, showError]);

  useEffect(() => {
    if (visible) {
      loadConfigs();
    }
  }, [visible, loadConfigs]);

  const openCreateForm = useCallback(() => {
    setEditing(undefined);
    setProvider('OPENAI');
    setDefaultPromptEnabled(false);
    form.resetFields();
    form.setFieldsValue({
      provider: 'OPENAI',
      temperature: 0.3,
      maxTokens: 4096,
      defaultSystemPrompt: '',
      defaultPromptEnabled: false,
      active: true,
    });
    setFormVisible(true);
  }, [form]);

  const openEditForm = useCallback(
    (config: LlmConfig) => {
      setEditing(config);
      setProvider(config.provider);
      setDefaultPromptEnabled(config.defaultPromptEnabled);
      form.setFieldsValue({
        provider: config.provider,
        apiBaseUrl: config.apiBaseUrl,
        apiKey: '',
        model: config.model,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        defaultSystemPrompt: config.defaultSystemPrompt,
        defaultPromptEnabled: config.defaultPromptEnabled,
        active: config.active,
      });
      setFormVisible(true);
    },
    [form],
  );

  const saveConfig = useCallback(
    async (values: LlmConfigFormValues) => {
      setSaving(true);
      try {
        await request2<LlmConfig>({
          url: editing ? `/llm/configs/${editing.id}` : '/llm/configs',
          method: editing ? 'PUT' : 'POST',
          data: {
            orgId,
            ...values,
            apiKey: values.apiKey?.trim() || undefined,
            defaultSystemPrompt:
              values.defaultSystemPrompt?.trim() || undefined,
          },
        });
        message.success(t(editing ? 'updateSuccess' : 'createSuccess'));
        setFormVisible(false);
        await loadConfigs();
      } catch (error) {
        showError(error);
      } finally {
        setSaving(false);
      }
    },
    [editing, loadConfigs, orgId, showError, t],
  );

  const activateConfig = useCallback(
    async (id: string) => {
      try {
        await request2<boolean>({
          url: `/llm/configs/${id}/activate`,
          method: 'POST',
        });
        message.success(t('activateSuccess'));
        await loadConfigs();
      } catch (error) {
        showError(error);
      }
    },
    [loadConfigs, showError, t],
  );

  const testConfig = useCallback(
    async (id: string) => {
      setTestingId(id);
      try {
        const { data } = await request2<boolean>({
          url: `/llm/configs/${id}/test`,
          method: 'POST',
        });
        data ? message.success(t('testSuccess')) : message.error(t('testFail'));
      } catch (error) {
        showError(error);
      } finally {
        setTestingId('');
      }
    },
    [showError, t],
  );

  const deleteConfig = useCallback(
    async (id: string) => {
      try {
        await request2<boolean>({
          url: `/llm/configs/${id}`,
          method: 'DELETE',
        });
        message.success(t('deleteSuccess'));
        await loadConfigs();
      } catch (error) {
        showError(error);
      }
    },
    [loadConfigs, showError, t],
  );

  return (
    <>
      <Drawer
        title={t('title')}
        width={720}
        visible={visible}
        destroyOnClose
        onClose={onClose}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Button type="primary" onClick={openCreateForm}>
            {t('create')}
          </Button>
          <List
            loading={loading}
            dataSource={configs}
            locale={{ emptyText: t('empty') }}
            renderItem={config => (
              <List.Item
                actions={[
                  <Button
                    key="test"
                    type="link"
                    loading={testingId === config.id}
                    onClick={() => testConfig(config.id)}
                  >
                    {t('test')}
                  </Button>,
                  <Button
                    key="activate"
                    type="link"
                    disabled={config.active}
                    onClick={() => activateConfig(config.id)}
                  >
                    {t('activate')}
                  </Button>,
                  <Button
                    key="edit"
                    type="link"
                    onClick={() => openEditForm(config)}
                  >
                    {t('edit')}
                  </Button>,
                  <Popconfirm
                    key="delete"
                    title={t('deleteConfirm')}
                    onConfirm={() => deleteConfig(config.id)}
                  >
                    <Button type="link" danger>
                      {t('delete')}
                    </Button>
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <span>{config.model}</span>
                      <Tag>{config.provider}</Tag>
                      {config.active && <Tag color="green">{t('active')}</Tag>}
                      {config.defaultPromptEnabled && (
                        <Tag color="blue">{t('defaultPromptEnabledTag')}</Tag>
                      )}
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={0}>
                      <span>{config.apiBaseUrl}</span>
                      <span>
                        {config.apiKeyConfigured
                          ? t('apiKeyConfigured')
                          : t('apiKeyMissing')}
                      </span>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </Space>
      </Drawer>
      <Modal
        title={t(editing ? 'editTitle' : 'createTitle')}
        visible={formVisible}
        width={720}
        confirmLoading={saving}
        destroyOnClose
        onOk={() => form.submit()}
        onCancel={() => setFormVisible(false)}
      >
        <Form
          form={form}
          layout="vertical"
          preserve={false}
          onFinish={saveConfig}
        >
          <Form.Item
            label={t('provider')}
            name="provider"
            rules={[{ required: true }]}
          >
            <Select onChange={value => setProvider(value as string)}>
              {['OPENAI', 'DOUBAO', 'DASHSCOPE', 'CUSTOM'].map(provider => (
                <Select.Option key={provider} value={provider}>
                  {provider}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label={t('apiBaseUrl')}
            name="apiBaseUrl"
            rules={[{ type: 'url' }]}
          >
            <Input placeholder={t('apiBaseUrlPlaceholder')} />
          </Form.Item>
          <Form.Item
            label={t('apiKey')}
            name="apiKey"
            rules={[{ required: !editing }]}
            extra={editing ? t('apiKeyEditTip') : undefined}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            label={t('model')}
            name="model"
            rules={[{ required: true }]}
          >
            <AutoComplete
              options={modelOptions.map(model => ({ value: model }))}
              filterOption={(input, option) =>
                (option?.value ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              placeholder={t('modelPlaceholder')}
            />
          </Form.Item>
          <Form.Item
            label={t('temperature')}
            name="temperature"
            rules={[{ required: true }]}
          >
            <InputNumber min={0} max={2} step={0.1} />
          </Form.Item>
          <Form.Item
            label={t('maxTokens')}
            name="maxTokens"
            rules={[{ required: true }]}
          >
            <InputNumber min={1} max={32768} />
          </Form.Item>
          <Form.Item
            label={t('defaultPromptEnabled')}
            name="defaultPromptEnabled"
            valuePropName="checked"
          >
            <Switch onChange={setDefaultPromptEnabled} />
          </Form.Item>
          <Form.Item
            label={t('defaultSystemPrompt')}
            name="defaultSystemPrompt"
            extra={t('defaultSystemPromptTip')}
            rules={[
              { max: 2000 },
              {
                validator: (_, value) =>
                  !form.getFieldValue('defaultPromptEnabled') || value?.trim()
                    ? Promise.resolve()
                    : Promise.reject(
                        new Error(t('defaultSystemPromptRequired')),
                      ),
              },
            ]}
          >
            <Input.TextArea
              rows={6}
              maxLength={2000}
              showCount
              disabled={!defaultPromptEnabled}
              placeholder={t('defaultSystemPromptPlaceholder')}
            />
          </Form.Item>
          <Form.Item label={t('active')} name="active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
