import type { CustomPaintProps, SkEnum } from "../processors";
import { useFrame } from "../processors";
import type { IPoint } from "../../../skia";
import { PointMode } from "../../../skia";
import { enumKey } from "../processors/Paint";
import { materialize } from "../processors/Animations/Animations";

export interface PointsProps extends CustomPaintProps {
  points: IPoint[];
  mode: SkEnum<typeof PointMode>;
}

export const Points = (props: PointsProps) => {
  const onDraw = useFrame(
    (ctx) => {
      const { canvas, paint } = ctx;
      const { points, mode } = materialize(ctx, props);
      const pointMode = PointMode[enumKey(mode)];
      canvas.drawPoints(pointMode, points, paint);
    },
    [props]
  );
  return <skDrawing onDraw={onDraw} {...props} />;
};
