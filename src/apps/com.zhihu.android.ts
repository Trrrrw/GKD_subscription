import { defineGkdApp } from '@gkd-kit/define';

export default defineGkdApp({
  id: 'com.zhihu.android',
  name: '知乎',
  groups: [
    {
      key: 1,
      name: '开屏广告',
      activityIds: 'com.zhihu.android.app.ui.activity.LauncherActivity',
      rules: '[vid="btn_skip"][text*="跳过"]',
    },
  ],
});
