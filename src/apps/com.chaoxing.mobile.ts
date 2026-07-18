import { defineGkdApp } from '@gkd-kit/define';

export default defineGkdApp({
  id: 'com.chaoxing.mobile',
  name: '学习通',
  groups: [
    {
      key: 1,
      name: '开屏广告',
      activityIds: 'com.chaoxing.mobile.activity.SplashActivity',
      fastQuery: true,
      matchTime: 10000,
      actionMaximum: 1,
      rules: '[vid="jump_view"][visibleToUser=true]',
    },
  ],
});
