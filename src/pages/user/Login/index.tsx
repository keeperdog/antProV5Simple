import { createFromIconfontCN } from '@ant-design/icons';
import { Alert, message, Button, Typography, Row, Result } from 'antd';
import React, { useLayoutEffect, useRef, useState } from 'react';
import type { ProFormInstance } from '@ant-design/pro-form';
import ProForm, { ProFormCheckbox, ProFormText } from '@ant-design/pro-form';
import { Link, history, SelectLang, useModel } from 'umi';
import Footer from '@/components/Footer';
import InputGroup from 'react-input-groups';
import logo from '@/assets/logo_horizontal.png';
import {
  userRegister,
  verifyRegisterSmscode,
  registerMobileVerify,
  getRegisterSmscode,
  resetPasswordByPhone,
  // getUserInfo,
  userLogin,
} from '@/services/ant-design-pro/login';

import styles from './index.less';
// 用于出错清空验证码
const defautlSmsCode = {
  target: { value: '' },
};

const LoginMessage: React.FC<{
  content: string;
}> = ({ content }) => (
  <Alert
    style={{
      marginBottom: 24,
    }}
    message={content}
    type="error"
    showIcon
  />
);
const sleep = (interval: number) => new Promise((resolve) => setTimeout(resolve, interval));

const IconFont = createFromIconfontCN({
  scriptUrl: '//at.alicdn.com/t/font_2800629_brgcxk5nipe.js',
});

const Login: React.FC = () => {
  const [type, setType] = useState<string>('accountLogin');
  const [password, setPassword] = useState<string>('');
  const [getRegisterSmscodeLoading, setGetRegisterSmscodeLoading] = useState<boolean>(false);
  const [handleSubmitting, setHandleSubmitting] = useState(false);
  const [loginError, setloginError] = useState<boolean>(false);
  // 是否是重置密码
  const [isReset, setIsReset] = useState<boolean>(false);
  //  默认已经注册，不显示可注册 对号
  const [registed, setRegisted] = useState<boolean>(false);
  const [countDown, setCountDown] = useState<number>(60);
  const formRef = useRef<ProFormInstance>();
  const inputGroupRef = useRef<any>();

  const [, forceUpdate] = useState({});

  useLayoutEffect(() => {
    let isUnmounted = false;

    async function helper() {
      if (countDown) {
        await sleep(1000);
        if (!isUnmounted) {
          setCountDown((count) => count - 1);
        }
      }
    }

    if (type === 'registerValidateCode') {
      helper();
    }

    if (type === 'accountLogin') {
      formRef.current?.resetFields();
      setloginError(false);
    }

    return () => {
      isUnmounted = true;
    };
  }, [countDown, type]);

  const { initialState, setInitialState } = useModel('@@initialState');

  const fetchUserInfo = async () => {
    const userInfo = await initialState?.fetchUserInfo?.();
    if (userInfo) {
      await setInitialState((s) => ({
        ...s,
        currentUser: userInfo,
      }));
    }
  };

  const handleSubmit = async (values: API.LoginParams) => {
    try {
      setHandleSubmitting(true);
      const loginRes = await userLogin({
        loginType: 'byPhone',
        identify: values.userName,
        password: values.loginPassword,
        remember: values.remember,
      });
      if (loginRes?.userId) {
        const {
          userId,
          auth: { tokenType, token, refreshToken },
        } = loginRes;
        sessionStorage.setItem('tokenInfo', JSON.stringify({ userId, token: tokenType + token }));
        localStorage.setItem(
          'refreshToken',
          JSON.stringify({ userId, refreshToken: tokenType + refreshToken }),
        );
        await fetchUserInfo();
        /** 此方法会跳转到 redirect 参数所在的位置 */
        if (!history) return;
        const { query } = history.location;
        const { redirect } = query as { redirect: string };
        history.push(redirect || '/welcome');
        return;
      }
      setloginError(true);
    } catch (error) {
      message.error(error || '登陆失败');
    }
    setHandleSubmitting(false);
  };

  const handleSuccessResult = async () => {
    history.push('/welcome');
  };

  const isDisabledBtn =
    !formRef.current?.getFieldValue('phone') ||
    !/^1\d{10}$/.test(formRef.current?.getFieldValue('phone')) ||
    (!isReset && registed);

  const isDisabledLoginBtn =
    !formRef.current?.getFieldValue('userName') || !formRef.current?.getFieldValue('loginPassword');

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/">
          <img alt="logo" className={styles.logo} src={logo} />
        </Link>
        <div className={styles.lang}>
          <SelectLang />
        </div>
      </div>
      <div className={styles.content}>
        <div className={styles.left} />
        <div className={styles.right}>
          <ProForm
            initialValues={{
              remember: false,
              phone: '',
              password: '',
            }}
            preserve={true}
            formRef={formRef}
            submitter={{
              render: (_props, doms) => {
                if (type === 'accountLogin') {
                  return [doms.pop()];
                }

                if (type === 'registerGetcode') {
                  // const isDisabledBtn =
                  //   !_props.form?.isFieldsTouched(true) ||
                  //   !!_props.form.getFieldsError().filter(({ errors }) => errors.length).length;
                  return [
                    <Button
                      key="login"
                      type="primary"
                      disabled={isDisabledBtn}
                      loading={getRegisterSmscodeLoading}
                      style={{
                        width: '100%',
                        backgroundColor: '#00D2B2',
                        borderColor: '#00D2B2',
                        color: 'white',
                        opacity: isDisabledBtn ? 0.2 : 1,
                      }}
                      onClick={() =>
                        _props.form
                          ?.validateFields()
                          .then(async (values) => {
                            setGetRegisterSmscodeLoading(true);
                            const getRes = await getRegisterSmscode({
                              appName: 'web',
                              phone: values?.phone,
                              smsType: isReset ? 'resetPasswordByPhone' : 'register',
                            });
                            setGetRegisterSmscodeLoading(false);
                            if (getRes?.status === 'success') {
                              // message.info('验证码获取成功');
                              setType('registerValidateCode');
                              setCountDown(60);
                            }
                          })
                          .catch((errorInfo) => {
                            message.error(errorInfo);
                          })
                      }
                    >
                      发送验证码
                    </Button>,
                  ];
                }

                if (type === 'registerUserInfo') {
                  return [
                    <Button
                      key="login"
                      type="primary"
                      style={{
                        width: '100%',
                        backgroundColor: '#00D2B2',
                        borderColor: '#00D2B2',
                      }}
                      onClick={() => {
                        _props.form?.validateFields().then(async (values: API.LoginParams) => {
                          if (isReset) {
                            const resetRes = await resetPasswordByPhone({
                              phone: _props.form?.getFieldValue('phone'),
                              password: values.password,
                            });
                            if (resetRes?.userId) {
                              const {
                                userId,
                                auth: { tokenType, token, refreshToken },
                              } = resetRes;
                              sessionStorage.setItem(
                                'tokenInfo',
                                JSON.stringify({ userId, token: tokenType + token }),
                              );
                              localStorage.setItem(
                                'refreshToken',
                                JSON.stringify({ userId, refreshToken: tokenType + refreshToken }),
                              );
                              // message.info('用户重置密码成功');
                              setType('registerSuccess');
                            }
                          } else {
                            const registerRes = await userRegister({
                              phone: _props.form?.getFieldValue('phone'),
                              name: values.name,
                              password: values.password,
                            });
                            if (registerRes?.userId) {
                              const {
                                userId,
                                auth: { tokenType, token, refreshToken },
                              } = registerRes;
                              sessionStorage.setItem(
                                'tokenInfo',
                                JSON.stringify({ userId, token: tokenType + token }),
                              );
                              localStorage.setItem(
                                'refreshToken',
                                JSON.stringify({ userId, refreshToken: tokenType + refreshToken }),
                              );
                              // message.info('用户注册成功');
                              setType('registerSuccess');
                            }
                          }
                        });
                      }}
                    >
                      {isReset ? '提交' : '注册'}
                    </Button>,
                  ];
                }
                // 默认没有按钮
                return [];
              },
              searchConfig: {
                submitText: '登录',
              },
              submitButtonProps: {
                loading: handleSubmitting,
                disabled: isDisabledLoginBtn,
                size: 'large',
                style: {
                  width: '100%',
                  backgroundColor: '#00D2B2',
                  borderColor: '#00D2B2',
                  color: 'white',
                  opacity: isDisabledLoginBtn ? 0.2 : 1,
                  // opacity: 0.2,
                },
              },
            }}
            onFinish={(values) => {
              handleSubmit(values as API.LoginParams);
              return Promise.resolve();
            }}
            onValuesChange={async (changedValues: API.LoginParams) => {
              forceUpdate({});
              setloginError(false);
              if (changedValues.hasOwnProperty('password'))
                setPassword(changedValues.password ?? '');
              // 手机号是否已注册验证
              // if (changedValues?.phone?.length === 11) {
              //   runRegisterMobileVerify(changedValues.phone);
              // }
            }}
          >
            {type === 'accountLogin' && (
              <>
                <Row>
                  <span className="text1">你好</span>
                  <span className="text2">&nbsp;请登录</span>
                </Row>
                <Row className="row2">
                  <span className="text3">没有账号？&nbsp;点击</span>
                  <span
                    className="text4"
                    onClick={() => {
                      formRef?.current?.resetFields();
                      setRegisted(true);
                      setType('registerGetcode');
                      setIsReset(false);
                    }}
                  >
                    注册
                  </span>
                </Row>

                <div
                  style={{
                    visibility:
                      loginError && type === 'accountLogin' && !handleSubmitting
                        ? 'visible'
                        : 'hidden',
                  }}
                >
                  <LoginMessage content="账户或密码错误" />
                </div>

                <ProFormText
                  name="userName"
                  // validateTrigger="onBlur"
                  fieldProps={{
                    size: 'large',
                    // onBlur: () => setloginError(false),
                    // prefix: <UserOutlined className={styles.prefixIcon} />,
                  }}
                  placeholder="账号 / 手机号"
                  rules={[
                    {
                      required: true,
                      message: '请输入账号/手机号',
                    },
                    // {
                    //   pattern: /^1\d{10}$/,
                    //   message: '请输入正确的账号/手机号',
                    // },
                  ]}
                />
                <ProFormText.Password
                  name="loginPassword"
                  // validateTrigger="onBlur"
                  fieldProps={{
                    // onBlur: () => setloginError(false),
                    size: 'large',
                    allowClear: true,
                    // prefix: <LockOutlined className={styles.prefixIcon} />,
                  }}
                  placeholder="密码"
                  rules={[
                    {
                      required: true,
                      message: '请输入密码',
                    },
                  ]}
                />

                <div
                  style={{
                    marginBottom: 88,
                  }}
                >
                  <ProFormCheckbox noStyle name="remember">
                    15天内自动登录
                  </ProFormCheckbox>
                  <a
                    onClick={() => {
                      setIsReset(true);
                      formRef.current?.resetFields();
                      setType('registerGetcode');
                    }}
                    style={{
                      float: 'right',
                    }}
                  >
                    忘记密码
                  </a>
                </div>
              </>
            )}
            {type === 'registerGetcode' && (
              <>
                <Row style={{ marginBottom: 152 }} className="flex-jc-ai-between">
                  <Typography.Title className="mb0">
                    {isReset ? '找回密码' : '注册'}
                  </Typography.Title>
                  <Typography.Link onClick={() => setType('accountLogin')}>返回</Typography.Link>
                </Row>
                <ProFormText
                  fieldProps={{
                    size: 'large',
                    // prefix: <MobileOutlined />,
                    addonBefore: '+86',
                    maxLength: 11,
                  }}
                  name="phone"
                  // validateTrigger="onBlur"
                  placeholder="11位手机号"
                  rules={[
                    {
                      required: true,
                      message: '请输入11位手机号',
                    },
                    {
                      pattern: /^1\d{10}$/,
                      message: '请输入正确的手机号',
                    },
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    ({ getFieldValue }) => ({
                      validator: async (rule, value) => {
                        if (value.length !== 11) {
                          return Promise.resolve();
                        }
                        const resRegister = await registerMobileVerify({
                          phone: value,
                        });
                        forceUpdate({});
                        setRegisted(resRegister.registed);
                        if (!isReset && resRegister?.registed) {
                          return Promise.reject(new Error('该手机号已经注册'));
                        }
                        if (isReset && !resRegister?.registed) {
                          return Promise.reject(new Error('该手机号未注册'));
                        }
                        return Promise.resolve();
                      },
                    }),
                  ]}
                />
              </>
            )}
            {type === 'registerValidateCode' && (
              <>
                <Row style={{ marginBottom: 152 }} className="flex-jc-ai-between">
                  <span className="text5">{isReset ? '找回密码' : '注册'}</span>
                  <span onClick={() => setType('accountLogin')} className="text6 cursor-pointer">
                    返回
                  </span>
                </Row>
                <div className="text7">输入6位验证码</div>
                <div className="text8">{`验证码已发送至${formRef?.current?.getFieldValue(
                  'phone',
                )}`}</div>
                <InputGroup
                  ref={inputGroupRef}
                  getValue={async (values: string) => {
                    // 验证注册手机验证码是否正确
                    if (values?.length === 6) {
                      const resVerify = await verifyRegisterSmscode({
                        phone: formRef.current?.getFieldValue('phone'),
                        smsCode: values,
                        smsType: isReset ? 'resetPasswordByPhone' : 'register',
                      });

                      if (resVerify?.status === 'success') {
                        // message.info('恭喜你验证码通过');
                        setType('registerUserInfo');
                      } else {
                        inputGroupRef.current.textChange(defautlSmsCode);
                        message.info('验证码错误，请重新输入');
                      }
                    }
                  }}
                  length={6}
                  type={'box'}
                />
                {countDown ? (
                  <div className="text9">{`${countDown}秒后重新获取`}</div>
                ) : (
                  <div className="text9">
                    没收到验证码？
                    <Typography.Link
                      disabled={getRegisterSmscodeLoading}
                      onClick={async () => {
                        setGetRegisterSmscodeLoading(true);
                        const getRes = await getRegisterSmscode({
                          appName: 'web',
                          phone: formRef.current?.getFieldValue('phone'),
                          smsType: isReset ? 'resetPasswordByPhone' : 'register',
                        });
                        setGetRegisterSmscodeLoading(false);
                        if (getRes?.status === 'success') {
                          // message.info('验证码获取成功');
                          setType('registerValidateCode');
                          setCountDown(60);
                        }
                      }}
                      href="#"
                    >
                      重新获取
                    </Typography.Link>
                  </div>
                )}
              </>
            )}
            {type === 'registerUserInfo' && (
              <>
                <Row style={{ marginBottom: 152 }} className="flex-jc-ai-between">
                  <Typography.Title>{isReset ? '找回密码' : '注册'}</Typography.Title>
                  <Typography.Link onClick={() => setType('accountLogin')}>返回</Typography.Link>
                </Row>
                {!isReset && (
                  <ProFormText
                    name="name"
                    fieldProps={{
                      size: 'large',
                      maxLength: 50,
                      minLength: 1,
                    }}
                    placeholder="真实姓名"
                    rules={[
                      {
                        required: true,
                        message: '请输入真实姓名',
                      },
                      {
                        pattern: /^[^\s]*$/,
                        message: '禁止输入空格',
                      },
                    ]}
                  />
                )}
                <ProFormText.Password
                  name="password"
                  fieldProps={{
                    size: 'large',
                    maxLength: 12,
                    autoComplete: 'off',
                    allowClear: true,
                  }}
                  placeholder="6-12位数字与字母组合，区分大小写"
                  rules={[
                    {
                      required: true,
                      message: '请输入6-12位数字与字母组合，区分大小写',
                    },
                    {
                      pattern: /^(?![0-9]+$)(?![a-zA-Z]+$)[0-9A-Za-z]{6,12}$/,
                      message: '密码需为6-12位数字与字母组合',
                    },
                  ]}
                />
                <Row style={{ marginBottom: 72 }} className="flex-jc-ai-start">
                  <div className="text11">
                    {password.length >= 6 && password.length <= 12 ? (
                      <IconFont type="icon-duigou1" style={{ fontSize: '16px' }} />
                    ) : (
                      <IconFont type="icon-duigou" style={{ fontSize: '16px' }} />
                    )}
                    &nbsp;6 - 12位
                  </div>
                  <div className="text11">
                    {/[0-9]+/.test(password) ? (
                      <IconFont type="icon-duigou1" style={{ fontSize: '16px' }} />
                    ) : (
                      <IconFont type="icon-duigou" style={{ fontSize: '16px' }} />
                    )}
                    &nbsp;数字
                  </div>
                  <div className="text11">
                    {/([a-z]|[A-Z])+/.test(password) ? (
                      <IconFont type="icon-duigou1" style={{ fontSize: '16px' }} />
                    ) : (
                      <IconFont type="icon-duigou" style={{ fontSize: '16px' }} />
                    )}
                    &nbsp;字母
                  </div>
                </Row>
              </>
            )}
            {type === 'registerSuccess' && (
              <>
                <Row style={{ marginBottom: 20 }} className="flex-jc-ai-between">
                  <span className="text5">{isReset ? '找回密码' : '注册'}</span>
                  <span onClick={() => setType('accountLogin')} className="text6 cursor-pointer">
                    返回
                  </span>
                </Row>
                <Result
                  status="success"
                  title={
                    <div className="text10">{`您的账号：${formRef?.current?.getFieldValue(
                      'phone',
                    )} ${isReset ? '重置' : '注册'}成功`}</div>
                  }
                  // title={`您的账号：${formRef?.current?.getFieldValue('phone')} ${
                  //   isReset ? '重置' : '注册'
                  // }成功`}
                  subTitle="立即开启您的智能建设工作体验"
                  extra={[
                    <Button
                      key="registerSuccess"
                      type="primary"
                      style={{
                        width: '100%',
                        backgroundColor: '#00D2B2',
                        borderColor: '#00D2B2',
                      }}
                      onClick={() => handleSuccessResult()}
                    >
                      开始使用
                    </Button>,
                  ]}
                />
              </>
            )}
          </ProForm>
        </div>
        {/* <Space className={styles.other}>
            <FormattedMessage id="pages.login.loginWith" defaultMessage="其他登录方式" />
            <AlipayCircleOutlined className={styles.icon} />
            <TaobaoCircleOutlined className={styles.icon} />
            <WeiboCircleOutlined className={styles.icon} />
          </Space> */}
      </div>
      <div className={styles.footer}>
        <Footer />
      </div>
    </div>
  );
};

export default Login;
