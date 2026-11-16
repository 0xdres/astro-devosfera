import { SITE } from "@/config";
import type { ContentEntry } from "./contentEntry";

const postFilter = ({ data }: ContentEntry) => {
  if (data.draft) return false;

  const pubTime = new Date(data.pubDatetime).getTime();
  const isPublishTimePassed = Date.now() > pubTime - SITE.scheduledPostMargin;

  return Boolean(import.meta.env?.DEV) || isPublishTimePassed;
};

export default postFilter;
