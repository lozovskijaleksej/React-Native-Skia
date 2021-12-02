import { peekDrawingContext } from "../renderer/CanvasProvider";

import type { AnimationFunction, AnimationValue } from "./types";

/**
 * Creates a shared value that can be used in animations and
 * drawing in the Canvas children.
 * @param initialValue
 * @returns A shared value
 */
export const createValue = <T = number>(initialValue: T): AnimationValue<T> => {
  return new AnimationValueImpl<T>(initialValue);
};

class AnimationValueImpl<T = number> implements AnimationValue<T> {
  constructor(initialValue: T) {
    this._value = initialValue;
    this._animationFunction = undefined;
    this._animationDone = undefined;
  }

  _value: T;
  _animationFunction: AnimationFunction | undefined;
  _animationDone: (() => void) | undefined;

  public startAnimation(fn: AnimationFunction, onAnimationDone?: () => void) {
    this._animationFunction = fn;
    this._animationDone = onAnimationDone;
  }

  public endAnimation(fn: AnimationFunction) {
    if (this._animationFunction && fn === this._animationFunction) {
      this._animationFunction = undefined;
      this._animationDone?.();
      this._animationDone = undefined;
    }
  }

  public toString() {
    return `${this._value}`;
  }

  public get value(): T {
    if (typeof this._value === "number") {
      // Check the drawing context list to see if we are inside a drawing function
      const drawingContext = peekDrawingContext();
      if (drawingContext !== undefined) {
        // Check if we have an ongoing animation
        if (this._animationFunction) {
          // Make sure the skia view is aware that there are animations running
          drawingContext.skiaRef.current?.startAnimation(this);
          // Update value from the current animation - do not call the
          // value property since it will stop the animation
          this._value = this._animationFunction(
            drawingContext.timestamp
          ) as never as T;
        } else {
          // Stop the skia view from running animations
          drawingContext.skiaRef.current?.stopAnimation(this);
        }
      }
    }
    return this._value;
  }

  public set value(v: T) {
    this._value = v;
    // End any ongoing animations - if you are setting the value we know it
    // is done from the outside and we want the animation to be stopped.
    if (this._animationFunction) {
      this.endAnimation(this._animationFunction);
    }
  }
}
