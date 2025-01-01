import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import { h } from 'vue';
import { createVuetify } from 'vuetify';
import {
    VBtn,
    VBtnToggle,
    VCard,
    VCardActions,
    VCardText,
    VCardTitle,
    VCheckbox,
    VCol,
    VColorPicker,
    VDialog,
    VField,
    VFileInput,
    VIcon,
    VMenu,
    VRangeSlider,
    VRow,
    VSelect,
    VSlider,
    VSnackbar,
    VTab,
    VTabs,
    VTabsWindow,
    VTabsWindowItem,
    VTextarea,
    VTextField,
    VThemeProvider,
} from 'vuetify/components';
import { Tooltip } from 'vuetify/directives';
import { aliases, mdi } from 'vuetify/iconsets/mdi';
import { VNumberInput } from 'vuetify/labs/VNumberInput';
import colors from 'vuetify/util/colors';

import Announcements from '../components/Announcements.vue';
import ApiButton from '../components/ApiButton.vue';
import Badges from '../components/Badges.vue';
import HomeBackground from '../components/HomeBackground.vue';
import ThemeProvider from '../components/ThemeProvider.vue';
import VersionBanner from '../components/VersionBanner.vue';
import codeDemo from '../plugins/code-demo/enhanceApp';
import dialog from '../plugins/dialog/enhanceApp';
import gallery from '../plugins/gallery/enhanceApp';
import tabs from '../plugins/tabs/enhanceApp';

import './style.scss';

const vuetify = createVuetify({
    ssr: true,
    components: {
        VBtn,
        VBtnToggle,
        VCard,
        VCardActions,
        VCardText,
        VCardTitle,
        VCheckbox,
        VCol,
        VColorPicker,
        VDialog,
        VFileInput,
        VField,
        VIcon,
        VMenu,
        VNumberInput,
        VRangeSlider,
        VRow,
        VSelect,
        VSlider,
        VSnackbar,
        VTab,
        VTabs,
        VTabsWindow,
        VTabsWindowItem,
        VTextarea,
        VTextField,
        VThemeProvider,
    },
    directives: {
        Tooltip,
    },
    icons: {
        defaultSet: 'mdi',
        aliases,
        sets: { mdi },
    },
    defaults: {
        VBtnToggle: {
            density: 'compact',
            variant: 'outlined',
        },
        VTextField: {
            density: 'compact',
        },
        VFileInput: {
            density: 'compact',
        },
        VField: {
            density: 'compact',
        },
        VCheckbox: {
            density: 'compact',
        },
        VNumberInput: {
            density: 'compact',
        },
        VSelect: {
            density: 'compact',
        },
        VSlider: {
            showTicks: 'always',
            thumbLabel: true,
        },
        VRangeSlider: {
            showTicks: 'always',
            thumbLabel: true,
        },
    },
    theme: {
        themes: {
            light: {
                dark: false,
                colors: {
                    primary: colors.lightBlue.darken1, // #039BE5
                },
            },
            dark: {
                dark: true,
                colors: {
                    primary: colors.lightBlue.darken3, // #0277BD
                },
            },
        },
    },
});

export default {
    extends: DefaultTheme,
    Layout: () => {
        return h(ThemeProvider, h(DefaultTheme.Layout, null, {
            'home-hero-before': () => h(HomeBackground),
            'home-features-after': () => h(Announcements),
            'layout-bottom': () => h(VersionBanner),
        }));
    },
    enhanceApp({ app }) {
        app.use(vuetify);
        app.component('Badges', Badges);
        app.component('ApiButton', ApiButton);
        codeDemo(app);
        dialog(app);
        gallery(app);
        tabs(app);
    },
} satisfies Theme;
