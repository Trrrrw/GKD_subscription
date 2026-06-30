import { defineGkdApp } from '@gkd-kit/define';

export default defineGkdApp({
  id: 'com.cmbchina.ccd.pluto.cmbActivity',
  name: '掌上生活',
  groups: [
    {
      key: 1,
      name: '首页弹窗广告',
      activityIds: 'com.cmbchina.ccd.pluto.cmbActivity.CMBRootActivityV2',
      rules: {
        matches: [
          '[vid="tv_ad_label"][text="广告"]',
          '[vid="img_cf_view_close"]',
        ],
      },
    },
  ],
});
