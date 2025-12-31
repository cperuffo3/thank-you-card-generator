import BaseLayout from "@/layouts/base-layout";
import { Outlet, createRootRoute } from "@tanstack/react-router";
import { SessionProvider } from "@/context/session-context";
/* import { TanStackRouterDevtools } from '@tanstack/react-router-devtools' */

/*
 * Uncomment the code in this file to enable the router devtools.
 */

function Root() {
  return (
    <SessionProvider>
      <BaseLayout>
        <Outlet />
        {/* Uncomment the following line to enable the router devtools */}
        {/* <TanStackRouterDevtools /> */}
      </BaseLayout>
    </SessionProvider>
  );
}

export const Route = createRootRoute({
  component: Root,
});
