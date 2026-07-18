import { defineGkdApp } from '@gkd-kit/define';

export default defineGkdApp({
  id: 'com.xingin.xhs',
  name: '小红书',
  groups: [
    {
      key: 1,
      name: '后台返回广告',
      activityIds: 'com.xingin.advert.intersitial.ui2.view.SplashAdActivity',
      rules: '[text*="跳过广告"]',
    },
  ],
});
