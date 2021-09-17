import React, { useCallback } from 'react';
import {
  CheckOutlined,
  LogoutOutlined,
  PlusOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Avatar, Menu, Spin } from 'antd';
import { history, useModel } from 'umi';
import { stringify } from 'querystring';
import HeaderDropdown from '../HeaderDropdown';
import styles from './index.less';
import { outLogin } from '@/services/ant-design-pro/api';
import type { MenuInfo } from 'rc-menu/lib/interface';
import { updateEnterprise } from '@/services/ant-design-pro/login';

export type GlobalHeaderRightProps = {
  menu?: boolean;
};

/**
 * 退出登录，并且将当前的 url 保存
 */
const loginOut = async () => {
  await outLogin();
  const { query = {}, pathname } = history.location;
  const { redirect } = query;
  // Note: There may be security issues, please note
  if (window.location.pathname !== '/user/login' && !redirect) {
    history.replace({
      pathname: '/user/login',
      search: stringify({
        redirect: pathname,
      }),
    });
  }
};

const AvatarDropdown: React.FC<GlobalHeaderRightProps> = ({ menu }) => {
  const { initialState, setInitialState } = useModel('@@initialState');

  const onMenuClick = useCallback(
    (event: MenuInfo) => {
      const { key } = event;
      if (key === 'logout') {
        setInitialState((s) => ({ ...s, currentUser: undefined }));
        loginOut();
        return;
      }
      history.push(`/account/${key}`);
    },
    [setInitialState],
  );

  const loading = (
    <span className={`${styles.action} ${styles.account}`}>
      <Spin
        size="small"
        style={{
          marginLeft: 8,
          marginRight: 8,
        }}
      />
    </span>
  );

  if (!initialState) {
    return loading;
  }

  const { currentUser, enterpriseList } = initialState;

  if (!currentUser || !currentUser.name) {
    return loading;
  }

  const menuHeaderDropdown = (
    <Menu className={styles.menu} selectedKeys={[]} onClick={onMenuClick}>
      {menu && (
        <Menu.Item key="center">
          <UserOutlined />
          个人中心
        </Menu.Item>
      )}
      {menu && (
        <Menu.Item key="settings">
          <SettingOutlined />
          个人设置
        </Menu.Item>
      )}
      <Menu.SubMenu key="enterprise" icon={<SettingOutlined />} title="企业切换">
        <div style={{ maxHeight: 240, overflow: 'auto' }}>
          {enterpriseList?.map((r: any) => (
            <div
              style={{
                color: r?.defaultEnterprise ? '#2C7BE5' : 'initial',
                height: 40,
              }}
              className="pl10 pr10 cursor-pointer"
              key={r?.id}
              onClick={async () => {
                if (r?.defaultEnterprise) return;
                await updateEnterprise({
                  enterpriseId: r.id,
                  defaultEnterprise: true,
                }).then(async (res) => {
                  if (res?.id) {
                    const enterpriseRes = await initialState?.fetchEnterpriselist?.();
                    if (enterpriseRes?.data) {
                      await setInitialState((s) => ({
                        ...s,
                        enterpriseList: enterpriseRes.data,
                      }));
                    }
                  }
                });
              }}
            >
              <span title={r?.name}>
                {r?.name?.length <= 10 ? r?.name : `${r?.name?.substr(0, 10)}...`}
              </span>
              {r?.defaultEnterprise && <CheckOutlined className="ml10" />}
            </div>
          ))}
        </div>
        <Menu.Divider />
        <Menu.Item
          onClick={() => {
            (document.querySelector('#createEnterpriseBtn') as HTMLElement)?.click();
          }}
          icon={<PlusOutlined />}
          key="10"
        >
          创建企业
        </Menu.Item>
      </Menu.SubMenu>
      <Menu.Divider />

      <Menu.Item key="logout">
        <LogoutOutlined />
        退出登录
      </Menu.Item>
    </Menu>
  );
  return (
    <HeaderDropdown overlay={menuHeaderDropdown}>
      <span className={`${styles.action} ${styles.account}`}>
        <Avatar size="small" className={styles.avatar} src={currentUser.avatar} alt="avatar" />
        <span className={`${styles.name} anticon`}>{currentUser.name}</span>
      </span>
    </HeaderDropdown>
  );
};

export default AvatarDropdown;
