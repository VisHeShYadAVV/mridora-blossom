import { createFileRoute } from "@tanstack/react-router";

import { Blocks } from "@/components/site/Blocks";
import { cmsHead, loadCmsPage } from "@/lib/cms-page";
import { getSiteData } from "@/lib/data";

// Every editable page (About, Quality, legal pages, new landing pages) renders through here.
export const Route = createFileRoute("/_site/$page")({
  loader: async ({ params }) => ({
    ...(await loadCmsPage(params.page)),
    defaultOg: (await getSiteData()).settings.seo.defaultOgImage,
  }),
  head: ({ loaderData, params }) =>
    loaderData ? cmsHead(loaderData.page, `/${params.page}`, loaderData.defaultOg) : {},
  component: Page,
});

function Page() {
  const { page, products, documents } = Route.useLoaderData();
  return <Blocks blocks={page.sections} ctx={{ products, documents }} />;
}
