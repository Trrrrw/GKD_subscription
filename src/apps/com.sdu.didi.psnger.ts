import { defineGkdApp } from '@gkd-kit/define';

export default defineGkdApp({
  id: 'com.sdu.didi.psnger',
  name: '滴滴',
  groups: [
    {
      key: 1,
      name: '首页弹窗广告',
      activityIds: 'com.didi.sdk.app.MainActivity',
      fastQuery: true,
      matchTime: 10000,
      actionMaximum: 1,
      rules: {
        matches: [
          '[vid="webview_layout"][desc="广告弹窗"]',
          '[vid="close_dialog"][visibleToUser=true]',
        ],
      },
    },
  ],
});
