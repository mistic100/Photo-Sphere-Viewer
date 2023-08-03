import { TypedEvent, TypedEventTarget } from '../lib/TypedEventTarget';
import { ConfigParser, logWarn } from '../utils';
import type { Viewer } from '../Viewer';

/**
 * Base class for plugins
 * @template TEvents union of dispatched events
 */
export abstract class AbstractPlugin<
    TEvents extends TypedEvent<AbstractPlugin> = never,
> extends TypedEventTarget<TEvents> {
    /**
     * Unique identifier of the plugin
     */
    static readonly id: string;

    constructor(protected viewer: Viewer) {
        super();
    }

    /**
     * Initializes the plugin
     */
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    init() {}

    /**
     * Destroys the plugin
     */
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    destroy() {}
}

/**
 * Base class for plugins with updatable configuration
 * The implementation must have a static `configParser` property which is the result of {@link utils.getConfigParser}
 *
 * @template TConfig type of input config
 * @template TParsedConfig type of config after parsing
 * @template TUpdatableConfig type of config that can be updated
 * @template TEvents union of dispatched events
 */
export abstract class AbstractConfigurablePlugin<
    TConfig extends Record<string, any>,
    TParsedConfig extends TConfig = TConfig,
    TUpdatableConfig extends TConfig = TConfig,
    TEvents extends TypedEvent<AbstractPlugin> = never,
> extends AbstractPlugin<TEvents> {
    static configParser: ConfigParser<any, any>;
    static readonlyOptions: string[] = [];

    readonly config: TParsedConfig;

    constructor(viewer: Viewer, config: TConfig) {
        super(viewer);

        this.config = (this.constructor as typeof AbstractConfigurablePlugin).configParser(config) as TParsedConfig;
    }

    /**
     * Update options
     */
    setOption<T extends keyof TUpdatableConfig>(option: T, value: TUpdatableConfig[T]) {
        // @ts-ignore
        this.setOptions({ [option]: value });
    }

    /**
     * Update options
     */
    setOptions(options: Partial<TUpdatableConfig>) {
        const rawConfig: TConfig = {
            ...this.config,
            ...options,
        };

        const ctor = this.constructor as typeof AbstractConfigurablePlugin;
        const parser: ConfigParser<TConfig, TParsedConfig> = ctor.configParser as any;
        const readonly = ctor.readonlyOptions;
        const id = ctor.id;

        for (let [key, value] of Object.entries(options) as Array<[keyof TConfig, any]>) {
            if (!(key in parser.defaults)) {
                logWarn(`${id}: Unknown option "${key as string}"`);
                continue;
            }

            if (readonly.includes(key as string)) {
                logWarn(`${id}: Option "${key as string}" cannot be updated`);
                continue;
            }

            if (key in parser.parsers) {
                value = parser.parsers[key](value, {
                    rawConfig: rawConfig,
                    defValue: parser.defaults[key],
                });
            }

            this.config[key] = value;
        }
    }
}

export type PluginConstructor = new (viewer: Viewer, config?: any) => AbstractPlugin<any>;

/**
 * Returns the plugin constructor from the imported object
 * @internal
 */
export function pluginInterop(plugin: any): PluginConstructor & typeof AbstractPlugin {
    if (plugin) {
        for (const [, p] of [['_', plugin], ...Object.entries(plugin)]) {
            if (p.prototype instanceof AbstractPlugin) {
                return p;
            }
        }
    }
    return null;
}
