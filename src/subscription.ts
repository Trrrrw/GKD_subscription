import { defineGkdSubscription } from '@gkd-kit/define';
import { batchImportApps } from '@gkd-kit/tools';
import categories from './categories';
import globalGroups from './globalGroups';

export default defineGkdSubscription({
  id: 54883026,
  name: "Trrrrw's Subscription",
  version: 0,
  author: 'Trrrrw',
  checkUpdateUrl: './gkd.version.json5',
  supportUri: 'https://github.com/Trrrrw/GKD_subscription',
  categories,
  globalGroups,
  apps: await batchImportApps(`${import.meta.dirname}/apps`),
});
