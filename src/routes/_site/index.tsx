import { createFileRoute } from "@tanstack/react-router";

import { Blocks } from "@/components/site/Blocks";
import { cmsHead, loadCmsPage } from "@/lib/cms-page";
import { getSiteData } from "@/lib/data";

export const Route = createFileRoute("/_site/")({
  loader: async () => ({
    ...(await loadCmsPage("home")),
    defaultOg: (await getSiteData()).settings.seo.defaultOgImage,
  }),
  head: ({ loaderData }) => (loaderData ? cmsHead(loaderData.page, "/", loaderData.defaultOg) : {}),
  component: Home,
});

function Home() {
  const { page, products, documents } = Route.useLoaderData();
  return <Blocks blocks={page.sections} ctx={{ products, documents }} />;
}
