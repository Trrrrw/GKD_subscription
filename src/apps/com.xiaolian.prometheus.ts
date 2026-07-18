import { defineGkdApp } from '@gkd-kit/define';

export default defineGkdApp({
  id: 'com.xiaolian.prometheus',
  name: '智慧笑联',
  groups: [
    {
      key: 1,
      name: '首页弹窗广告',
      activityIds: 'com.xiaolian.home.ui.HomeActivity',
      fastQuery: true,
      matchTime: 10000,
      actionMaximum: 1,
      rules: {
        matches: [
          '[vid="save_image"][text="下载二维码"]',
          '[vid="close_img"][visibleToUser=true]',
        ],
      },
    },
    {
      key: 2,
      name: '开屏广告',
      activityIds: 'com.xiaolian.launch.ui.SplashActivity',
      fastQuery: true,
      matchTime: 10000,
      actionMaximum: 1,
      rules: '[vid="count_donw_text"][text*="跳过"][visibleToUser=true]',
    },
  ],
});
