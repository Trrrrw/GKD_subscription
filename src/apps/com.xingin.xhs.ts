import { defineGkdApp } from '@gkd-kit/define';

export default defineGkdApp({
  id: 'com.xingin.xhs',
  name: '小红书',
  groups: [
    {
      key: 1,
      name: '开屏广告',
      activityIds: 'com.xingin.xhs.index.v2.IndexActivityV2',
      rules: '[text*="跳过广告"]',
    },
  ],
});
