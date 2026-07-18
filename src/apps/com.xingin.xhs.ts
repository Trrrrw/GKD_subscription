import { defineGkdApp } from '@gkd-kit/define';

export default defineGkdApp({
  id: 'com.xingin.xhs',
  name: '小红书',
  groups: [
    {
      key: 1,
      name: '开屏广告',
      activityIds: 'com.xingin.xhs.index.v2.IndexActivityV2',
      fastQuery: true,
      matchTime: 10000,
      actionMaximum: 1,
      rules: '[text*="跳过广告"][visibleToUser=true]',
    },
    {
      key: 2,
      name: '后台返回广告',
      activityIds: 'com.xingin.advert.intersitial.ui2.view.SplashAdActivity',
      fastQuery: true,
      matchTime: 10000,
      actionMaximum: 1,
      rules: '[text*="跳过广告"][visibleToUser=true]',
    },
  ],
});
