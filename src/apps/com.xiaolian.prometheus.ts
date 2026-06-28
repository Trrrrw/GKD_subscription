import { defineGkdApp } from '@gkd-kit/define';

export default defineGkdApp({
  id: 'com.xiaolian.prometheus',
  name: '智慧笑联',
  groups: [
    {
      key: 1,
      name: '首页弹窗广告',
      activityIds: 'com.xiaolian.home.ui.HomeActivity',
      rules: {
        matches: ['[vid="save_image"][text="下载二维码"]', '[vid="close_img"]'],
      },
    },
    {
      key: 2,
      name: '开屏广告',
      activityIds: 'com.xiaolian.launch.ui.SplashActivity',
      rules: '[vid="count_donw_text"][text*="跳过"]',
    },
  ],
});
