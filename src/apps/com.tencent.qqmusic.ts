import { defineGkdApp } from '@gkd-kit/define';

export default defineGkdApp({
  id: 'com.tencent.qqmusic',
  name: 'QQ音乐',
  groups: [
    {
      key: 1,
      name: '开屏广告',
      activityIds: 'com.tencent.qqmusic.activity.AppStarterActivity',
      fastQuery: true,
      matchTime: 10000,
      actionMaximum: 1,
      rules: {
        matches: [
          '[vid="km1"][text*="广告"]',
          '[text="跳过"][visibleToUser=true]',
        ],
      },
    },
  ],
});
