import type { ForgeConfig } from "@electron-forge/shared-types";
import { MakerWix } from "@electron-forge/maker-wix";
import { MakerZIP } from "@electron-forge/maker-zip";
import { MakerDeb } from "@electron-forge/maker-deb";
import { MakerRpm } from "@electron-forge/maker-rpm";
import { VitePlugin } from "@electron-forge/plugin-vite";
import { FusesPlugin } from "@electron-forge/plugin-fuses";
import { FuseV1Options, FuseVersion } from "@electron/fuses";
import path from "path";

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    icon: "./images/icon", // No file extension - Forge adds .ico/.icns automatically
    // macOS file association configuration
    extendInfo: {
      CFBundleDocumentTypes: [
        {
          CFBundleTypeName: "Thank You Card File",
          CFBundleTypeRole: "Editor",
          LSHandlerRank: "Owner",
          LSItemContentTypes: ["com.thank-you-cards.card"],
          CFBundleTypeIconFile: "icon.icns",
          CFBundleTypeExtensions: ["card"],
        },
      ],
      UTExportedTypeDeclarations: [
        {
          UTTypeIdentifier: "com.thank-you-cards.card",
          UTTypeDescription: "Thank You Card File",
          UTTypeConformsTo: ["public.data"],
          UTTypeTagSpecification: {
            "public.filename-extension": ["card"],
          },
        },
      ],
    },
  },
  rebuildConfig: {},
  makers: [
    new MakerWix({
      icon: path.join(process.cwd(), "images", "icon.ico"),
      // File association for .card files - WiX handles registry automatically
      associateExtensions: "card",
    }),
    new MakerZIP({}, ["darwin"]),
    new MakerRpm({
      options: {
        icon: "./images/icon.png",
      },
    }),
    new MakerDeb({
      options: {
        icon: "./images/icon.png",
      },
    }),
  ],
  publishers: [
    {
      /*
       * Publish release on GitHub as draft.
       * Remember to manually publish it on GitHub website after verifying everything is correct.
       */
      name: "@electron-forge/publisher-github",
      config: {
        repository: {
          owner: "cperuffo3",
          name: "thank-you-card-generator",
        },
        draft: true,
        prerelease: false,
      },
    },
  ],
  plugins: [
    new VitePlugin({
      build: [
        {
          entry: "src/main.ts",
          config: "vite.main.config.mts",
          target: "main",
        },
        {
          entry: "src/preload.ts",
          config: "vite.preload.config.mts",
          target: "preload",
        },
      ],
      renderer: [
        {
          name: "main_window",
          config: "vite.renderer.config.mts",
        },
      ],
    }),

    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;
