/* eslint-disable consistent-return */
/** Request 网络请求工具 更详细的 api 文档: https://github.com/umijs/umi-request */
import type { RequestOptionsInit } from 'umi-request';
import { extend } from 'umi-request';
import { notification } from 'antd';
import { history } from 'umi';
// import { stringify } from 'querystring';
// const { REACT_APP_ENV } = process.env;

// const codeMessage: Record<number, string> = {
//   200: '服务器成功返回请求的数据。',
//   201: '新建或修改数据成功。',
//   202: '一个请求已经进入后台排队（异步任务）。',
//   204: '删除数据成功。',
//   400: '发出的请求有错误，服务器没有进行新建或修改数据的操作。',
//   401: '用户没有权限（令牌、用户名、密码错误）。',
//   403: '用户得到授权，但是访问是被禁止的。',
//   404: '发出的请求针对的是不存在的记录，服务器没有进行操作。',
//   406: '请求的格式不可得。',
//   410: '请求的资源被永久删除，且不会再得到的。',
//   422: '当创建一个对象时，发生一个验证错误。',
//   500: '服务器发生错误，请检查服务器。',
//   502: '网关错误。',
//   503: '服务不可用，服务器暂时过载或维护。',
//   504: '网关超时。',
// };

/** 异常处理程序 */
const errorHandler = (error: { response: Response }): Response => {
  const { response } = error;
  if (response && response.status) {
    // const errorText = codeMessage[response.status] || response.statusText;
    // const { status, url } = response;
    // notification.error({
    //   message: `请求错误 ${status}: ${url}`,
    //   description: errorText,
    // });
  } else if (!response) {
    notification.error({
      description: '您的网络发生异常，无法连接服务器',
      message: '网络异常',
    });
  }
  return response;
};
/** 配置request请求时的默认参数 */
const request = extend({
  errorHandler, // 默认错误处理
  prefix: REACT_APP_ENV ? '' : 'https://account-dev.api.bimg.shop',
  credentials: 'include', // 默认请求是否带上cookie
});
// 刷新token
export const tokenRefresh = async (params: { refreshToken: string }) => {
  return request('/v1/token:refresh', {
    method: 'POST',
    params: {
      t: Date.now(),
    },
    data: {
      ...params,
    },
  });
};

let isRefreshUrl = false;
let currentUrl = '';
let currentOptions = {};
// request拦截器, 改变url 或 options.
request.interceptors.request.use(
  async (url: string, options: RequestOptionsInit): any => {
    if (
      options.headers?.Authorization === 'undefined' &&
      !url.includes('/v1/token:refresh') &&
      !window.location.pathname.includes('/user/login')
    ) {
      const refreshRes = await tokenRefresh({
        refreshToken: JSON.parse(localStorage.getItem('refreshToken') ?? '{}')
          .refreshToken?.split(' ')
          ?.pop(),
      });

      if (!refreshRes?.userId) {
        localStorage.clear();
        sessionStorage.clear();
        // history.push(`/user/login`);
        window.location.href = `/user/login`;
        return;
      }

      const {
        userId,
        auth: { tokenType, token, refreshToken },
      } = refreshRes;

      sessionStorage.setItem('tokenInfo', JSON.stringify({ userId, token: tokenType + token }));
      localStorage.setItem(
        'refreshToken',
        JSON.stringify({ userId, refreshToken: tokenType + refreshToken }),
      );
      const { token: Authorization } = JSON.parse(sessionStorage.getItem('tokenInfo') ?? '{}');
      currentOptions = {
        ...options,
        headers: {
          Authorization,
        },
      };
    } else {
      currentOptions = {
        ...options,
      };
    }

    const { userId } = JSON.parse(sessionStorage.getItem('tokenInfo') ?? '{}');

    isRefreshUrl = url.includes('/v1/token:refresh');
    currentUrl = url.replace('undefined', userId);

    return {
      url: `${currentUrl}`,
      options: {
        ...currentOptions,
        interceptors: true,
      },
    };
  },
  {
    global: true,
  },
);

// response拦截器, 处理response
request.interceptors.response.use(
  async (response, options) => {
    if (
      response.status === 401 &&
      !window.location.pathname.includes('/user/login') &&
      isRefreshUrl
    ) {
      localStorage.clear();
      sessionStorage.clear();
      history.push(`/user/login`);
    }

    if (
      response.status === 401 &&
      !window.location.pathname.includes('/user/login') &&
      !isRefreshUrl
    ) {
      const { url: last401Url } = response;
      const last401Options = { ...options };
      const refreshRes = await tokenRefresh({
        refreshToken: JSON.parse(localStorage.getItem('refreshToken') ?? '{}')
          .refreshToken?.split(' ')
          ?.pop(),
      });
      if (!refreshRes?.userId) {
        localStorage.clear();
        sessionStorage.clear();
        history.push(`/user/login`);
      } else {
        const {
          userId,
          auth: { tokenType, token, refreshToken },
        } = refreshRes;

        sessionStorage.setItem('tokenInfo', JSON.stringify({ userId, token: tokenType + token }));
        localStorage.setItem(
          'refreshToken',
          JSON.stringify({ userId, refreshToken: tokenType + refreshToken }),
        );

        const { token: Authorization } = JSON.parse(sessionStorage.getItem('tokenInfo') ?? '{}');

        const response2 = await request(last401Url, {
          ...last401Options,
          headers: {
            Authorization,
          },
          params: {
            t: Date.now(),
          },
        });
        return response2;
      }
    }

    return response;
  },
  {
    global: true,
  },
);

export default request;
