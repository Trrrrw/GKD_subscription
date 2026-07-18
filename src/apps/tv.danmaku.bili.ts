import { defineGkdApp } from '@gkd-kit/define';

export default defineGkdApp({
  id: 'tv.danmaku.bili',
  name: '哔哩哔哩',
  groups: [
    {
      key: 1,
      name: '开屏广告',
      activityIds: 'tv.danmaku.bili.MainActivityV2',
      fastQuery: true,
      matchTime: 10000,
      actionMaximum: 1,
      rules: '[vid="count_down"][text*="跳过"][visibleToUser=true]',
    },
  ],
});
