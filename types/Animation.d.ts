export type AnimationOptions = {
  properties: { [K: string]: { start: number, end: number } };
  duration: number;
  delay?: number;
  easing?: string | ((progress: number) => number);
  onTick: (properties: { [K: string]: number }, progress: number) => void;
};

/**
 * @summary Interpolation helper for animations
 * @description
 * Implements the Promise API with an additional "cancel" and "finally" methods.
 * The promise is resolved when the animation is complete and rejected if the animation is cancelled.
 */
export class Animation implements Promise<void> {

  constructor(options: AnimationOptions);

  // @ts-ignore
  then(onFulfilled?: (() => void | Animation | PromiseLike<void>) | undefined | null, onRejected?: (() => void | Animation | PromiseLike<void>) | undefined | null): Animation;

  // @ts-ignore
  catch(onRejected?: (() => void | Animation | PromiseLike<void>) | undefined | null): Animation;

  // @ts-ignore
  finally(onFinally?: (() => void | Animation | PromiseLike<void>) | undefined | null): Animation;

  cancel();

  /**
   * @summary Returns a resolved animation promise
   */
  static resolve(): Animation;

}
