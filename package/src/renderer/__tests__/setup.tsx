/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from "fs";
import path from "path";

import React from "react";
import type { ReactNode } from "react";
import type { Server, WebSocket } from "ws";

import { DependencyManager } from "../DependencyManager";
import { ValueApi } from "../../values/web";
import { LoadSkiaWeb } from "../../web/LoadSkiaWeb";
import type * as SkiaExports from "../..";
import { JsiSkApi } from "../../skia/web/JsiSkia";
import type { Node } from "../../dom/nodes";
import { JsiSkDOM } from "../../dom/nodes";
import { Group } from "../components";
import type { SkImage, SkFont, Skia } from "../../skia/types";
import { isPath } from "../../skia/types";
import { E2E } from "../../__tests__/setup";
import { SkiaRoot } from "../Reconciler";
import { JsiDrawingContext } from "../../dom/types/DrawingContext";

jest.setTimeout(180 * 1000);

declare global {
  var testServer: Server;
  var testClient: WebSocket;
  var testOS: "ios" | "android" | "web";
}
export let surface: TestingSurface;
const assets = new Map<SkImage | SkFont, string>();
export let images: {
  oslo: SkImage;
  skiaLogoPng: SkImage;
  skiaLogoJpeg: SkImage;
  circle: SkImage;
};
export let fonts: {
  RobotoMedium: SkFont;
  NotoColorEmoji: SkFont;
  NotoSansSCRegular: SkFont;
};

beforeAll(async () => {
  await LoadSkiaWeb();
  const Skia = JsiSkApi(global.CanvasKit);
  global.SkiaApi = Skia;
  global.SkiaValueApi = ValueApi;
  surface = E2E ? new RemoteSurface() : new LocalSurface();
  const { fontSize } = surface;
  const NotoSansSCRegular = loadFont(
    "skia/__tests__/assets/NotoSansSC-Regular.otf",
    fontSize
  );
  const NotoColorEmoji = loadFont(
    "skia/__tests__/assets/NotoColorEmoji.ttf",
    fontSize
  );
  const RobotoMedium = loadFont(
    "skia/__tests__/assets/Roboto-Medium.ttf",
    fontSize
  );
  const oslo = loadImage("skia/__tests__/assets/oslo.jpg");
  const skiaLogoPng = loadImage("skia/__tests__/assets/skia_logo.png");
  const skiaLogoJpeg = loadImage("skia/__tests__/assets/skia_logo_jpeg.jpg");
  const data = Skia.Data.fromBase64(
    // eslint-disable-next-line max-len
    "iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAABHNCSVQICAgIfAhkiAAABJhJREFUeJzt3T2LVGcYx+H7GeJXCDjGtLurVep8i3W0swg2wSJdUDAgCAYMFlaKBgJ2gqSwEBIQBJM0gRRiQEEUDBqEFQQLwbhz7hR5ITHqHuM588zMua4PsPtv5seZM+elfH3r1wxa2bM6LrU3QJdGtQcskM3aA6BrAtDes9oDoGsC0N7T2gOgawLQVilPak+ArglAW5mPa0+ArglAe49qD4CuCUBbJR/WngBdE4CWMsuD2hugawLQ0qjEvdoboGsC0FKJ0d3aG6BrAtDS883mdu0N0DUBaCEjnuzbPf6l9g7omgC0UCJu1N4AfRCAVvJ67QXQBwFoISN+qr0B+iAALYya6Y+1N0AfBGBrG+u73v+59gjogwBsITO+q70B+iIAW8qrtRdAXwRgK6NypfYE6IsAvN7Nycr4Vu0R0BcBeI3MvFx7A/RJAF5jNNp2qfYG6JMAvEopd9ZX3v2+9gzokwC8Qom8WHsD9E0AXqm5UHsB9E0AXqbEtfWV99wAxNITgJfIzPO1N8AsCMB/bUxWd3xVewTMggC8ICPO1d4AsyIAL2jK9EztDTArAvAveXrfyk7P/2cwBOAfsmlO1d4AsyQAf8vTk107PfqbQRGAP02n5UTtDTBrAhARGXHcc/8ZIgGIuN9Mtx+rPQJqGHwAMvLovt3lt9o7oIahB+AbV/0xZIMOQCnN4doboKbBBqDJOOKOP4ZuqAG4undt/HntEVDbEAOwWZrNT2qPgHkwuACUEge96gv+MLQAnF1fGX9ZewTMiyEF4Ic9q+OPa4+AeTKUAGxkM/2o9giYN4MIQGbsd6cf/NfSByAjD0zWxt/W3gHz6J3aA/pVDk1Wxy71hVdY2iOAjDi+Z3X7F7V3wDxbygBk5snJ6viz2jtg3i1dADLz5GRtx6e1d8AiWKoAZMRxH35ob4lOApZDE9/54Y0sRQAy8oCz/fDmFj0AG5mxf7K2w+/88D8s8jmAH7KZfugiH/j/FvUI4Kwbe+DtLVoANkuJg27phW4s0leAq6XZ/MCHH7qzEEcATcYRz/CD7s17AL4ppTm8d9XTe6EP8xqA+xl51Es7oF9zF4CMON5Mtx/zui7o3xwFIE9Pp+WEt/TC7MxBAPJ0Ns0pj+yC2asVgI2MONeU6Zl9KzsfVNoAgzfbAJS4lpnnndyD+dB/AEq5UyIvRjQXvIwT5ktfAbiZmZdHo22X1lfe/b6n/wG8pa4CsJEZ30Xk1RiVK5OV8a2O/i7QozcOQEY8KRE3IvJ6Rvw0aqY/etkmLKa/ArAZEc8i4mmU8iQyH0fEoyj5MLM8GJW4V2J09/lmc9vv9AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACy93wFAN/itW1l45QAAAABJRU5ErkJggg=="
  );
  const circle = Skia.Image.MakeImageFromEncoded(data)!;
  images = { oslo, skiaLogoPng, skiaLogoJpeg, circle };
  fonts = { RobotoMedium, NotoColorEmoji, NotoSansSCRegular };
  assets.set(oslo, "oslo");
  assets.set(RobotoMedium, "RobotoMedium");
  assets.set(NotoColorEmoji, "NotoColorEmoji");
  assets.set(NotoSansSCRegular, "NotoSansSCRegular");
  assets.set(skiaLogoPng, "skiaLogoPng");
  assets.set(skiaLogoJpeg, "skiaLogoJpeg");
  assets.set(circle, "circle");
});

export const wait = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const resolveFile = (uri: string) =>
  fs.readFileSync(path.resolve(__dirname, `../../${uri}`));

(global as any).fetch = jest.fn((uri: string) =>
  Promise.resolve({
    arrayBuffer: () => Promise.resolve(resolveFile(uri)),
  })
);

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface EmptyProps {}

jest.mock("react-native", () => ({
  PixelRatio: {
    get(): number {
      return 1;
    },
  },
  Platform: { OS: "web" },
  Image: {
    resolveAssetSource: jest.fn,
  },
  requireNativeComponent: jest.fn,
}));

export const loadImage = (uri: string) => {
  const Skia = global.SkiaApi;
  const image = Skia.Image.MakeImageFromEncoded(
    Skia.Data.fromBytes(resolveFile(uri))
  );
  expect(image).toBeTruthy();
  return image!;
};

export const loadFont = (uri: string, ftSize?: number) => {
  const Skia = global.SkiaApi;
  const tf = Skia.Typeface.MakeFreeTypeFaceFromData(
    Skia.Data.fromBytes(resolveFile(uri))
  );
  expect(tf).toBeTruthy();
  return Skia.Font(tf!, ftSize ?? fontSize);
};

export const importSkia = (): typeof SkiaExports => require("../..");
export const getSkDOM = () => {
  const { Skia } = importSkia();
  const depMgr = new DependencyManager(() => () => {});
  return new JsiSkDOM({ Skia, depMgr });
};

export const PIXEL_RATIO = 3;
export const fontSize = 32 * PIXEL_RATIO;
export const width = 256 * PIXEL_RATIO;
export const height = 256 * PIXEL_RATIO;
export const center = { x: width / 2, y: height / 2 };

export const drawOnNode = (element: ReactNode) => {
  const { surface: ckSurface, draw } = mountCanvas(element);
  draw();
  return ckSurface;
};

export const mountCanvas = (element: ReactNode) => {
  const Skia = global.SkiaApi;
  expect(Skia).toBeDefined();
  const ckSurface = Skia.Surface.Make(width, height)!;
  expect(ckSurface).toBeDefined();
  const canvas = ckSurface.getCanvas();

  const root = new SkiaRoot(Skia);
  root.render(element);
  return {
    surface: ckSurface,
    root: root.dom,
    draw: () => {
      const ctx = new JsiDrawingContext(Skia, canvas);
      root.dom.render(ctx);
    },
  };
};

export const serialize = (element: ReactNode) => {
  const { root } = mountCanvas(element);
  const serialized = serializeNode(root);
  return JSON.stringify(serialized);
};

interface SerializedProps {
  [key: string]: any;
}

interface SerializedNode {
  type: string;
  props: SerializedProps;
  children: SerializedNode[];
}

const serializeSkOjects = (obj: any): any => {
  if (typeof obj === "function") {
    return { __typename__: "Function", source: `${obj.toString()}` };
  } else if (Array.isArray(obj)) {
    return obj.map((item) => serializeSkOjects(item));
  } else if (obj && typeof obj === "object" && "__typename__" in obj) {
    if (obj.__typename__ === "Point") {
      return { __typename__: "Point", x: obj.x, y: obj.y };
    } else if (obj.__typename__ === "Rect") {
      return {
        __typename__: "Rect",
        x: obj.x,
        y: obj.y,
        width: obj.width,
        height: obj.height,
      };
    } else if (obj.__typename__ === "RRect") {
      return {
        __typename__: "RRect",
        x: obj.rect.x,
        y: obj.rect.y,
        width: obj.rect.width,
        height: obj.rect.height,
        rx: obj.rx,
        ry: obj.ry,
      };
    } else if (isPath(obj)) {
      return {
        __typename__: "Path",
        cmds: obj.toCmds(),
      };
    } else if (obj.__typename__ === "Image") {
      return {
        __typename__: "Image",
        name: assets.get(obj)!,
      };
    } else if (obj.__typename__ === "Font") {
      return {
        __typename__: "Font",
        size: obj.getSize(),
        name: assets.get(obj)!,
      };
    } else if (obj.__typename__ === "RuntimeEffect") {
      return {
        __typename__: "RuntimeEffect",
        source: obj.source(),
      };
    }
  }
  return obj;
};

const serializeNode = (node: Node<any>): SerializedNode => {
  const props: any = {};
  const ogProps = node.getProps();
  if (ogProps) {
    Object.keys(ogProps)
      .filter((key) => key !== "children")
      .forEach((key) => {
        props[key] = serializeSkOjects(ogProps[key]);
      });
  }
  return {
    type: node.type,
    props,
    children: node.children().map((child) => serializeNode(child)),
  };
};

type EvalContext = Record<string, any>;

interface TestingSurface {
  eval<Ctx extends EvalContext, R>(
    fn: (Skia: Skia, ctx: Ctx) => R,
    ctx?: Ctx
  ): Promise<R>;
  draw(node: ReactNode): Promise<SkImage>;
  width: number;
  height: number;
  fontSize: number;
  OS: string;
}

class LocalSurface implements TestingSurface {
  readonly width = 256;
  readonly height = 256;
  readonly fontSize = 32;
  readonly OS = "node";

  eval<Ctx extends EvalContext, R>(
    fn: (Skia: Skia, ctx: Ctx) => R,
    ctx?: Ctx
  ): Promise<R> {
    return Promise.resolve(fn(global.SkiaApi, ctx ?? ({} as any)));
  }

  draw(node: ReactNode): Promise<SkImage> {
    const { surface: ckSurface, draw } = mountCanvas(
      <Group transform={[{ scale: PIXEL_RATIO }]}>{node}</Group>
    );
    draw();
    return Promise.resolve(ckSurface.makeImageSnapshot());
  }
}

class RemoteSurface implements TestingSurface {
  readonly width = 256;
  readonly height = 256;
  readonly fontSize = 32;
  readonly OS = global.testOS;

  private get client() {
    if (global.testClient === null) {
      throw new Error("Client is not connected. Did you call init?");
    }
    return global.testClient!;
  }

  eval<Ctx extends EvalContext, R>(
    fn: (Skia: Skia, ctx: Ctx) => any,
    context?: Ctx
  ): Promise<R> {
    return new Promise((resolve) => {
      this.client.once("message", (raw: Buffer) => {
        resolve(JSON.parse(raw.toString()));
      });
      const ctx: EvalContext = {};
      if (context) {
        Object.keys(context).forEach((key) => {
          ctx[key] = serializeSkOjects(context[key]);
        });
      }
      this.client.send(JSON.stringify({ code: fn.toString(), ctx }));
    });
  }

  draw(node: ReactNode): Promise<SkImage> {
    return new Promise((resolve) => {
      this.client.once("message", (raw: Buffer) => {
        const Skia = global.SkiaApi;
        const data = Skia.Data.fromBytes(new Uint8Array(raw));
        const image = Skia.Image.MakeImageFromEncoded(data);
        if (image === null) {
          throw new Error("Unable to decode image");
        }
        resolve(image);
      });
      this.client!.send(serialize(node));
    });
  }
}
