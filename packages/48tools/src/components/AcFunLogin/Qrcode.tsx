import { CancelableRequest, Response as GotResponse } from 'got';
import { useState, useEffect, useMemo, ReactElement, Dispatch as D, SetStateAction as S, MouseEvent } from 'react';
import * as PropTypes from 'prop-types';
import { Button, Empty, message } from 'antd';
import * as dayjs from 'dayjs';
import style from './qrcode.sass';
import { requestPcDirectQr, requestPcDirectScanResult, requestPcDirectAcceptResult } from './services/acfunLogin';
import type { PcDirectQr, ScanResult, AcceptResult } from './services/interface';

export const ACFUN_COOKIE_KEY: string = 'ACFUN_COOKIE';
let scanResultRequest: CancelableRequest<GotResponse<ScanResult>> | null = null,
  acceptResultRequest: CancelableRequest<GotResponse<AcceptResult>> | null = null;
let resetCreateQrcodeTimer: NodeJS.Timeout | null = null;

export interface AcFunCookie {
  time: string;
  cookie: string;
}

function clearData(): void {
  if (scanResultRequest) {
    scanResultRequest.cancel();
    scanResultRequest = null;
  }

  if (acceptResultRequest) {
    acceptResultRequest.cancel();
    acceptResultRequest = null;
  }

  if (resetCreateQrcodeTimer) {
    clearTimeout(resetCreateQrcodeTimer);
    resetCreateQrcodeTimer = null;
  }
}

/* 生成A站二维码 */
function Qrcode(props: { onCancel: Function }): ReactElement {
  const [imageData, setImageData]: [string | undefined, D<S<string | undefined>>] = useState(undefined); // 二维码
  const acFunCookie: AcFunCookie | null = useMemo(function(): AcFunCookie | null {
    const info: string | null = localStorage.getItem(ACFUN_COOKIE_KEY);

    return info ? JSON.parse(info) : null;
  }, []);

  // 清除cookie
  function handleClearAcFunCookieClick(event: MouseEvent<HTMLButtonElement>): void {
    localStorage.removeItem(ACFUN_COOKIE_KEY);
    message.warn('A站Cookie已清除，请重新登陆。');
  }

  // 生成二维码
  async function createQrcode(): Promise<void> {
    clearData();
    resetCreateQrcodeTimer = setTimeout(createQrcode, 90_000); // 刷新二维码

    // 获取二维码图片
    const resQr: PcDirectQr = await requestPcDirectQr();

    setImageData(`data:image/png;base64,${ resQr.imageData }`);

    // 等待二维码扫描确认
    scanResultRequest = requestPcDirectScanResult(resQr.qrLoginToken, resQr.qrLoginSignature);

    const resScanResult: ScanResult = (await scanResultRequest).body;

    scanResultRequest = null;

    if (resScanResult.result !== 0) {
      return message.error('登陆失败！请刷新后重新登陆！');
    }

    // 扫描登陆成功
    acceptResultRequest = requestPcDirectAcceptResult(resQr.qrLoginToken, resScanResult.qrLoginSignature);

    const resAcceptResult: GotResponse<AcceptResult> = await acceptResultRequest;

    acceptResultRequest = null;

    if (resAcceptResult.body.result === 0) {
      const time: string = dayjs().format('YYYY-MM-DD HH:mm:ss');
      const cookie: string = resAcceptResult.headers['set-cookie']!
        .map((o: string): string => o.split(/;\s*/)[0]).join('; ');

      localStorage.setItem(ACFUN_COOKIE_KEY, JSON.stringify({ time, cookie }));
      message.success('登陆成功！');
      props.onCancel();
    } else {
      message.error('登陆失败！请刷新后重新登陆！');
    }
  }

  // 重新生成二维码
  function handleResetCreateQrcodeClick(event: MouseEvent<HTMLButtonElement>): void {
    createQrcode();
  }

  useEffect(function(): () => void {
    createQrcode();

    return function(): void {
      clearData();
    };
  }, []);

  return (
    <div className={ style.qrcodeContent }>
      <div className={ style.qrcodeBox }>
        { imageData ? <img src={ imageData } /> : <Empty description={ false } /> }
      </div>
      <div className={ style.tools }>
        <Button type="text" danger={ true } onClick={ handleClearAcFunCookieClick }>清除Cookie</Button>
        <Button className={ style.resetBtn } type="text" onClick={ handleResetCreateQrcodeClick }>刷新二维码</Button>
        <p className={ style.time }>上次登陆时间：{ acFunCookie?.time ?? '无' }</p>
      </div>
    </div>
  );
}

Qrcode.propTypes = {
  onCancel: PropTypes.func
};

export default Qrcode;