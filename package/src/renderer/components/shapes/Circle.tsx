import type { CustomPaintProps, Vector, AnimatedProps } from "../../processors";
import { useDrawing } from "../../nodes/Drawing";
import { vec } from "../../processors/math/Vector";

export interface CircleProps extends CustomPaintProps {
  r: number;
  c: Vector;
}

export const Circle = (props: AnimatedProps<CircleProps>) => {
  const onDraw = useDrawing(props, ({ canvas, paint }, { c, r }) => {
    canvas.drawCircle(c.x, c.y, r, paint);
  });
  return <skDrawing onDraw={onDraw} {...props} />;
};

Circle.defaultProps = {
  c: vec(),
};
