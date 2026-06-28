import { defineGkdApp } from '@gkd-kit/define';

export default defineGkdApp({
  id: 'com.mihoyo.hyperion',
  name: '米游社',
  groups: [
    {
      key: 1,
      name: '开屏广告',
      activityIds: 'com.mihoyo.hyperion.splash.SplashActivity',
      rules: '[vid="mSplashBtJump"][text^="跳过"]',
    },
  ],
});
