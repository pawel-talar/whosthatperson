import { mkdir, copyFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const source = join(root, ".assetsignore");
const distDir = join(root, "dist");
const target = join(distDir, ".assetsignore");

const ensureAssetsIgnore = async () => {
  if (!existsSync(source)) {
    return;
  }

  await mkdir(distDir, { recursive: true });
  await copyFile(source, target);
};

ensureAssetsIgnore();
