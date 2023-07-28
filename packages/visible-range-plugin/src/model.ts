export type Range = [number, number] | [string, string];

export type VisibleRangePluginConfig = {
    /**
     * horizontal range as two angles
     */
    horizontalRange?: Range;
    /**
     * vertical range as two angles
     */
    verticalRange?: Range;
    /**
     * use {@link ViewerConfig panoData} as visible range, you can also manually call {@link VisibleRangePlugin.setRangesFromPanoData}
     * @default false
     */
    usePanoData?: boolean;
};

export type UpdatableVisibleRangePluginConfig = Omit<VisibleRangePluginConfig, 'horizontalRange' | 'verticalRange'>;
