import { defineGkdApp } from '@gkd-kit/define';

export default defineGkdApp({
  id: 'com.cainiao.wireless',
  name: '菜鸟',
  groups: [
    {
      key: 1,
      name: '开屏广告',
      activityIds: 'com.cainiao.wireless.homepage.view.activity.AdsActivity',
      rules: {
        matches: ['[vid="homesplash"]', '[text="跳过"]'],
      },
    },
  ],
});
