import React from 'react';
import { Typography, Button, message, Space, Modal } from 'antd';
import styles from './Welcome.less';
import { ModalForm, ProFormSelect, ProFormText } from '@ant-design/pro-form';
import { createEnterprises, getEnterprisesDict } from '@/services/ant-design-pro/login';
import welcomeBgm from '@/assets/welcome2.png';
import { Link, useModel } from 'umi';
import logo from '../assets/logo_horizontal.png';
import RightContent from '@/components/RightContent/index';
// import { connect } from 'umi';
// import type { ConnectState } from '@/models/connect';

const primaryBtnSty = { backgroundColor: '#00D2B2', borderColor: '#00D2B2' };
const ghostBtnSty = { borderColor: '#00D2B2', color: '#00D2B2' };

const Welcomme: React.FC = () => {
  const { initialState, setInitialState } = useModel('@@initialState');

  return (
    <div className={styles.main}>
      <div className={styles.header}>
        <Link to="/">
          <img alt="logo" className={styles.logo} src={logo} />
        </Link>
        <div className={styles.lang}>
          <RightContent />
        </div>
      </div>
      <div className="wrapper">
        <div className="top">
          <div className="left">
            <Typography.Title>团队使用效率更高效</Typography.Title>
            <Typography.Paragraph style={{ width: 300, height: 54 }}>
              文案文案文案文案文案文案文案文案文案文案文案文案文案文案文案文案文案文案文案文案文文案文案文案文
            </Typography.Paragraph>
            <Space size="large" style={{ marginTop: '20px' }}>
              <ModalForm<{
                name: string;
                scale: string;
              }>
                title="创建企业"
                layout="horizontal"
                width={520}
                preserve={false}
                labelCol={{ span: 6 }}
                wrapperCol={{ span: 14 }}
                trigger={
                  <Button
                    id="createEnterpriseBtn"
                    style={{ ...primaryBtnSty }}
                    type="primary"
                    shape="round"
                  >
                    创建企业
                  </Button>
                }
                modalProps={{
                  destroyOnClose: true,
                  okText: '创建',
                }}
                onFinish={async (values) => {
                  await createEnterprises({
                    name: values.name,
                    ...JSON.parse(values.scale),
                  });
                  const enterpriseRes = await initialState?.fetchEnterpriselist?.();
                  if (enterpriseRes?.data) {
                    await setInitialState((s) => ({
                      ...s,
                      enterpriseList: enterpriseRes.data,
                    }));
                  }
                  message.success('创建成功');
                  return true;
                }}
                submitter={{
                  submitButtonProps: {
                    // loading: true,
                    style: { ...primaryBtnSty },
                  },
                }}
              >
                <Typography>完善企业信息</Typography>
                <Typography.Paragraph type="secondary" style={{ marginBottom: 24 }}>
                  补充企业信息，开启专属数字化专业服务
                </Typography.Paragraph>
                <ProFormText
                  name="name"
                  label="企业名称"
                  fieldProps={{
                    maxLength: 50,
                  }}
                  rules={[
                    {
                      required: true,
                      message: '请输入企业名称',
                    },
                  ]}
                />
                <ProFormSelect
                  request={async () => {
                    const { dicts } = await getEnterprisesDict({
                      code: 'enterprises.employees.ranges',
                    });
                    if (dicts) {
                      return dicts?.map((r: any) => ({
                        ...r,
                        label: r.value,
                        value: r.extend,
                      }));
                    }
                    return [
                      // { label: '1 - 99人', value: '1' },
                      // { label: '100 - 99人', value: '2' },
                      // { label: '1000 - 9999人', value: '3' },
                      // { label: '10000及以上', value: '4' },
                    ];
                  }}
                  name="scale"
                  label="团队规模"
                  rules={[
                    {
                      required: true,
                      message: '请选择团队规模',
                    },
                  ]}
                />
              </ModalForm>
              <Button
                style={{ ...ghostBtnSty }}
                type="ghost"
                shape="round"
                // loading={}
                onClick={() => {
                  Modal.info({
                    title: '请联系管理员申请加入企业',
                    content: <div />,
                    centered: true,
                    onOk() {},
                    okButtonProps: {
                      style: { ...primaryBtnSty },
                    },
                  });
                }}
              >
                加入企业
              </Button>
            </Space>
          </div>
          <div className="right">
            <img alt="logo" className={styles.logo} src={welcomeBgm} />
          </div>
        </div>
        <div className="bottom">
          <Typography style={{ fontWeight: 500, fontSize: 24 }} className="mb16">
            用科技引领建设行业新体验
          </Typography>
          <div className="feature">
            <div className="feat1">重点功能1</div>
            <div className="feat2">重点功能2</div>
            <div className="feat3">重点功能3</div>
            <div className="feat3">重点功能4</div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Welcomme;
