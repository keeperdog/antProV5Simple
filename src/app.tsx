import type { Settings as LayoutSettings } from '@ant-design/pro-layout';
import { PageLoading } from '@ant-design/pro-layout';
import type { RunTimeLayoutConfig } from 'umi';
import { history } from 'umi';
import RightContent from '@/components/RightContent';
import Footer from '@/components/Footer';
import { getUserInfo, getEnterprisesList, tokenRefresh } from './services/ant-design-pro/login';
// import { BookOutlined, LinkOutlined } from '@ant-design/icons';

// const isDev = process.env.NODE_ENV === 'development';
const loginPath = '/user/login';

/** 获取用户信息比较慢的时候会展示一个 loading */
export const initialStateConfig = {
  loading: <PageLoading />,
};

/**
 * @see  https://umijs.org/zh-CN/plugins/plugin-initial-state
 * */
export async function getInitialState(): Promise<{
  settings?: Partial<LayoutSettings>;
  currentUser?: API.CurrentUser;
  enterpriseList?: Record<string, any>[];
  fetchUserInfo?: () => Promise<API.CurrentUser | undefined>;
  fetchEnterpriselist?: () => Promise<{ data: Record<string, any>[] }>;
}> {
  const refreshToken = JSON.parse(localStorage.getItem('refreshToken') || '{}');
  const tokenInfo = JSON.parse(sessionStorage.getItem('tokenInfo') || '{}');

  if (refreshToken?.userId && !tokenInfo?.userId) {
    const refreshRes = await tokenRefresh({
      refreshToken: JSON.parse(localStorage.getItem('refreshToken') ?? '{}')
        .refreshToken?.split(' ')
        ?.pop(),
    });
    if (refreshRes?.userId) {
      const {
        userId,
        auth: { tokenType, token, refreshToken: newRefreshToken },
      } = refreshRes;
      sessionStorage.setItem('tokenInfo', JSON.stringify({ userId, token: tokenType + token }));
      localStorage.setItem(
        'refreshToken',
        JSON.stringify({ userId, refreshToken: tokenType + newRefreshToken }),
      );
    }
  }

  const fetchUserInfo = async () => {
    try {
      return await getUserInfo();
    } catch (error) {
      history.push(loginPath);
    }
    return undefined;
  };

  const fetchEnterpriselist = async () => {
    try {
      return await getEnterprisesList();
    } catch (error) {
      history.push(loginPath);
    }
    return undefined;
  };
  // 如果是登录页面，不执行
  if (history.location.pathname !== loginPath) {
    const currentUser = await fetchUserInfo();
    const { data } = await fetchEnterpriselist();

    return {
      fetchUserInfo,
      currentUser,
      fetchEnterpriselist,
      enterpriseList: data,
      settings: {},
    };
  }

  return {
    fetchUserInfo,
    fetchEnterpriselist,
    settings: {},
  };
}

// ProLayout 支持的api https://procomponents.ant.design/components/layout
export const layout: RunTimeLayoutConfig = ({ initialState }) => {
  return {
    rightContentRender: () => <RightContent />,
    disableContentMargin: false,
    // waterMarkProps: {
    //   content: initialState?.currentUser?.name,
    // },
    footerRender: () => <Footer />,
    onPageChange: () => {
      const { location } = history;
      const refreshToken = JSON.parse(localStorage.getItem('refreshToken') || '{}');
      const tokenInfo = JSON.parse(sessionStorage.getItem('tokenInfo') || '{}');
      const isLogin = tokenInfo?.userId || refreshToken?.userId;
      // 如果没有登录，重定向到 login
      if (!isLogin && location.pathname !== loginPath) {
        history.push(loginPath);
      }
    },
    // links: isDev
    //   ? [
    //       <Link to="/umi/plugin/openapi" target="_blank">
    //         <LinkOutlined />
    //         <span>OpenAPI 文档</span>
    //       </Link>,
    //       <Link to="/~docs">
    //         <BookOutlined />
    //         <span>业务组件文档</span>
    //       </Link>,
    //     ]
    //   : [],
    menuHeaderRender: undefined,
    // 自定义 403 页面
    // unAccessible: <div>unAccessible</div>,
    ...initialState?.settings,
  };
};
