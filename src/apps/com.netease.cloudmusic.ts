import { defineGkdApp } from '@gkd-kit/define';

export default defineGkdApp({
  id: 'com.netease.cloudmusic',
  name: '网易云音乐',
  groups: [
    {
      key: 1,
      name: '开屏广告',
      activityIds: 'com.netease.cloudmusic.activity.MainActivity',
      rules: '[vid="skipBtn"][text*="跳过"]',
    },
  ],
});
