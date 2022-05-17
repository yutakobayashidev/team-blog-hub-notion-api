import fs from "fs-extra";
import Parser from "rss-parser";
import { PostItem, Member } from "../types";
import dotenv from "dotenv";

dotenv.config();

export default {};

type FeedItem = {
  title: string;
  link: string;
  contentSnippet?: string;
  isoDate?: string;
  dateMiliSeconds: number;
};

const parser = new Parser();
let allPostItems: PostItem[] = [];

async function fetchFeedItems(url: string) {
  const feed = await parser.parseURL(url);
  if (!feed?.items?.length) return [];

  // return item which has title and link
  return feed.items
    .map(({ title, contentSnippet, link, isoDate }) => {
      return {
        title,
        contentSnippet: contentSnippet?.replace(/\n/g, ""),
        link,
        isoDate,
        dateMiliSeconds: isoDate ? new Date(isoDate).getTime() : 0,
      };
    })
    .filter(({ title, link }) => title && link) as FeedItem[];
}

async function getFeedItemsFromSources(sources: undefined | string[]) {
  if (!sources?.length) return [];
  let feedItems: FeedItem[] = [];
  for (const url of sources) {
    const items = await fetchFeedItems(url);
    if (items) feedItems = [...feedItems, ...items];
  }
  return feedItems;
}

async function getMemberFeedItems(member: Member): Promise<PostItem[]> {
  const { id, sources, name, includeUrlRegex, excludeUrlRegex } = member;
  const feedItems = await getFeedItemsFromSources(sources);
  if (!feedItems) return [];

  let postItems = feedItems.map((item) => {
    return {
      ...item,
      authorName: name,
      authorId: id,
    };
  });
  // remove items which not matches includeUrlRegex
  if (includeUrlRegex) {
    postItems = postItems.filter((item) => {
      return item.link.match(new RegExp(includeUrlRegex));
    });
  }
  // remove items which matches excludeUrlRegex
  if (excludeUrlRegex) {
    postItems = postItems.filter((item) => {
      return !item.link.match(new RegExp(excludeUrlRegex));
    });
  }

  return postItems;
}

(async function () {
  const { Client } = require("@notionhq/client");

  const notion = new Client({
    auth: process.env.NOTION_TOKEN,
  });

  const data = await notion.databases.query({
    database_id: process.env.NOTION_DATABASE_ID,
    filter: {
      and: [
        {
          property: "Name",
          title: {
            is_not_empty: true,
          },
        },
        {
          property: "id",
          rich_text: {
            is_not_empty: true,
          },
        },
      ],
    },
  });

  const members = data.results
    .map((_: any) => _.properties)
    .map((_: any) => {
      return {
        id: _.id.rich_text[0].plain_text,
        name: _.Name.title[0].plain_text,
        role: _.role.rich_text[0].plain_text,
        bio: _.bio.rich_text[0].plain_text,
        avatarSrc: _.avatarSrc.url,
        twitterUsername: _.twitterUsername.rich_text[0].plain_text,
        githubUsername: _.githubUsername.rich_text[0].plain_text,
        websiteUrl: _.websiteUrl.url,
        sources: [_.sources.url],
      };
    });

  fs.ensureDirSync(".contents");
  fs.writeJsonSync(".contents/members.json", members);

  for (const member of (members as unknown) as Member[]) {
    const items = await getMemberFeedItems(member);
    if (items) allPostItems = [...allPostItems, ...items];
  }
  allPostItems.sort((a, b) => b.dateMiliSeconds - a.dateMiliSeconds);
  fs.writeJsonSync(".contents/posts.json", allPostItems);
})();
