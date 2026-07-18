import { defineGkdApp } from '@gkd-kit/define';

export default defineGkdApp({
  id: 'com.mihoyo.hyperion',
  name: '米游社',
  groups: [
    {
      key: 1,
      name: '开屏广告',
      activityIds: 'com.mihoyo.hyperion.splash.SplashActivity',
      fastQuery: true,
      matchTime: 10000,
      actionMaximum: 1,
      rules: '[vid="mSplashBtJump"][text^="跳过"][visibleToUser=true]',
    },
  ],
});
