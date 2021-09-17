// @ts-ignore
/* eslint-disable */
// import { request } from 'umi';
import request from '@/utils/request';

export type LoginParamsType = {
  userName: string;
  mobile: string;
  captcha: string;

  phone: string;
  smsType: 'register' | 'resetPasswordByPhone';
  smsCode: string;
  name: string;

  userId: string;
  appName?: string;

  loginType: 'byPhone';
  password: string;
  loginPassword: string;
  identify: string;
  remember: boolean;
};
export type CreateEnterPrisesParamsType = {
  name: string;
  employeesMin: number;
  employeesMax: number;
};

export type mobileVerifyParamsType = Pick<LoginParamsType, 'phone'>;
export type mobileVerifyData = {
  registed: boolean;
};

/** 发送验证码 POST /api/login/captcha */
// export async function getFakeCaptcha(
//   params: {
//     // query
//     /** 手机号 */
//     phone?: string;
//   },
//   options?: { [key: string]: any },
// ) {
//   return request<API.FakeCaptcha>('/api/login/captcha', {
//     method: 'GET',
//     params: {
//       ...params,
//     },
//     ...(options || {}),
//   });
// }

export async function getUserInfo(): Promise<any> {
  const { userId, token } = JSON.parse(sessionStorage.getItem('tokenInfo') ?? '{}');
  return request(`/v1/users/${userId}`, {
    headers: {
      Authorization: `${token}`,
    },
    method: 'GET',
    params: {
      t: Date.now(),
    },
    // data: {
    // ...params,
    // },
  });
}

// 更新企业
export const updateEnterprise = async (params: {
  enterpriseId: string;
  defaultEnterprise: boolean;
}) => {
  const { token } = JSON.parse(sessionStorage.getItem('tokenInfo') ?? '{}');

  return request(`/v1/enterprises/${params.enterpriseId}`, {
    headers: {
      Authorization: `${token}`,
    },
    method: 'PATCH',
    params: {
      t: Date.now(),
    },
    data: {
      defaultEnterprise: params.defaultEnterprise,
    },
  });
};

export async function fakeAccountLogin(params: LoginParamsType) {
  return request('/api/login/account', {
    method: 'POST',
    data: params,
  });
}

// export async function getFakeCaptcha(mobile: string) {
//   return request(`/api/login/captcha?mobile=${mobile}`);
// }

// 验证手机号是否注册
export const registerMobileVerify = async (params: Pick<LoginParamsType, 'phone'>) => {
  return request('/v1/registers/mobile:verify', {
    method: 'POST',
    params: {
      t: Date.now(),
    },
    data: {
      ...params,
    },
  });
};

// 获取注册手机验证码
export const getRegisterSmscode = async (
  params: Pick<LoginParamsType, 'phone' | 'smsType' | 'appName'>,
) => {
  return request('/v1/registers/sms:send', {
    method: 'POST',
    params: {
      t: Date.now(),
    },
    data: {
      ...params,
    },
  });
};

// 验证注册手机验证码
export const verifyRegisterSmscode = async (
  params: Pick<LoginParamsType, 'phone' | 'smsType' | 'smsCode'>,
) => {
  return request('/v1/registers/sms:verify', {
    method: 'POST',
    params: {
      t: Date.now(),
    },
    data: {
      ...params,
    },
  });
};

// 用户注册
export const userRegister = async (
  params: Pick<LoginParamsType, 'phone' | 'password' | 'name'>,
) => {
  return request('/v1/registers', {
    method: 'POST',
    params: {
      t: Date.now(),
    },
    data: {
      ...params,
    },
  });
};

// 用户通过手机号重置密码
export const resetPasswordByPhone = async (params: Pick<LoginParamsType, 'phone' | 'password'>) => {
  return request(`/v1/users/${params.phone}/password:reset`, {
    method: 'POST',
    params: {
      t: Date.now(),
    },
    data: {
      ...params,
    },
  });
};

// 获取用户信息
// export const getUserInfo = async (params: Pick<LoginParamsType, 'userId'>) => {
//   const { userId, token } = JSON.parse(sessionStorage.getItem('tokenInfo') ?? '{}');
//   return request(`/v1/users/${params.userId}`, {
//     headers: {
//       Authorization: `${token}`,
//     },
//     method: 'GET',
//     params: {
//       t: Date.now(),
//     },
//     // data: {
//     // ...params,
//     // },
//   });
// };

// 创建企业
export const createEnterprises = async (params: CreateEnterPrisesParamsType) => {
  const { token } = JSON.parse(sessionStorage.getItem('tokenInfo') ?? '{}');

  return request('/v1/enterprises', {
    method: 'POST',
    headers: {
      Authorization: `${token}`,
    },
    params: {
      t: Date.now(),
    },
    data: {
      ...params,
    },
  });
};

// 获取字典
export const getEnterprisesDict = async (params: { code: string }) => {
  const { token } = JSON.parse(sessionStorage.getItem('tokenInfo') ?? '{}');

  return request(`/v1/dicts/groups/${params.code}`, {
    headers: {
      Authorization: `${token}`,
    },
    method: 'GET',
    params: {
      t: Date.now(),
    },
    // data: {
    // ...params,
    // },
  });
};

// 获取企业列表
export const getEnterprisesList = async () => {
  const { token } = JSON.parse(sessionStorage.getItem('tokenInfo') ?? '{}');

  return request(`/v1/enterprises`, {
    headers: {
      Authorization: `${token}`,
    },
    method: 'GET',
    params: {
      t: Date.now(),
    },
    // data: {
    // ...params,
    // },
  });
};

// 用户登录
export const userLogin = async (
  params: Pick<LoginParamsType, 'loginType' | 'identify' | 'password' | 'remember'>,
) => {
  return request('/v1/users/login', {
    method: 'POST',
    params: {
      t: Date.now(),
    },
    data: {
      ...params,
    },
  });
};

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
