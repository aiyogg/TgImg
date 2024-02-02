import { getSelectedFinderItems, Toast, showToast, showHUD, Clipboard } from "@raycast/api";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import FormData from "form-data";

const telegraphHost = "https://telegra.ph";
const allowFileExtNames = [".png", ".jpg", ".jpeg", ".gif", ".webp"];

export default async function main () {
  let filePaths: string[];
  try {
    filePaths = (await getSelectedFinderItems()).map((f) => f.path);
  } catch (e) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Error",
      message: e instanceof Error ? e.message : "Could not get the selected Finder items",
    });
    return;
  }
  const toast = await showToast({
    style: Toast.Style.Animated,
    title: "Uploading images...",
  });

  const form = new FormData();
  filePaths.filter((filePath) => allowFileExtNames.includes(path.extname(filePath).toLowerCase())).forEach(
    (filePath, index) => {
      form.append(`file${index}`, fs.createReadStream(filePath));
    }
  );
  const result = await fetch(`${telegraphHost}/upload`, {
    method: 'POST',
    body: form,
  }).then(res => res.json());

  if (typeof result === 'object' && result !== null && 'error' in result && result.error) {
    toast.style = Toast.Style.Failure;
    toast.title = "Failed to upload images";
    toast.message = result.error as string;
    return;
  }
  if (Array.isArray(result) && result.length > 0) {
    console.log(result);
    const fileURLs = result.reduce((acc, cur) => {
      acc += `![img](${telegraphHost}${cur.src})\n`;
      return acc;
    }, '');
    Clipboard.copy(fileURLs);
    return showHUD("🎉 Success and copied");
  }
}
