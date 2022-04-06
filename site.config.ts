export const config = {
  siteMeta: {
    title: "Team Blog Hub Notion API",
    teamName: "Notion Labs, Inc.",
    description: "RSS based blog starter kit for teams. Powered by Notion API",
  },
  siteRoot:
    process.env.NODE_ENV === "production"
      ? "https://team-blog-hub.vercel.app"
      : "http://localhost:3000",
  headerLinks: [
    {
      title: "About",
      href: "/about",
    },
    {
      title: "Notion",
      href:
        "https://yutakobayashi.notion.site/47bcd8cd498a4d3880a2ce793625b29d?v=bb2dc06f629c464e81e74692087d250f",
    },
    {
      title: "GitHub",
      href: "https://github.com/yutakobayashidev/team-blog-hub-notion-api",
    },
  ],
};
