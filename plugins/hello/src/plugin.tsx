import {
  createFrontendPlugin,
  PageBlueprint,
} from '@backstage/frontend-plugin-api';

import { rootRouteRef } from './routes';

export const page = PageBlueprint.make({
  params: {
    path: '/hello',
    routeRef: rootRouteRef,
    loader: () => import('./components/TodoPage').then(m => <m.TodoPage />),
  },
});

export const helloPlugin = createFrontendPlugin({
  pluginId: 'hello',
  extensions: [page],
  routes: {
    root: rootRouteRef,
  },
});
