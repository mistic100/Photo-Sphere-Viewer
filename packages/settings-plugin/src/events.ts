import { TypedEvent } from '@photo-sphere-viewer/core';
import type { SettingsPlugin } from './SettingsPlugin';

export class SettingChangedEvent extends TypedEvent<SettingsPlugin> {
    static override readonly type = 'setting-changed';
    override type: 'setting-changed';

    constructor(
        public readonly settingId: string,
        public readonly settingValue: boolean | string
    ) {
        super(SettingChangedEvent.type);
    }
}

export type SettingsPluginEvents = SettingChangedEvent;
