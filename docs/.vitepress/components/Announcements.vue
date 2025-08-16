<template>
    <div class="container">
        <div class="items">
            <div class="item" v-for="entry in announcements">
                <div class="custom-block">
                    <p class="custom-block-title">
                        <Badge text="NEW" /> {{ entry.title }}
                        <small>({{ entry.date }})</small>
                    </p>
                    <p v-html="entry.body"></p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';

type Announcement = {
    title: string;
    date: string;
    body: string;
};

const dateFormat = new Intl.DateTimeFormat('en-US', { dateStyle: 'long' });

const announcements = ref<Announcement[]>([]);

onMounted(async () => {
    const result = await fetchAnnouncements();
    const { marked } = await import('marked');
    announcements.value = result.map(r => formatAnnouncement(r, marked));
});

async function fetchAnnouncements(): Promise<any[]> {
    const cache = localStorage.announcementsCache;
    const cacheDate = localStorage.announcementsCacheDate;

    if (cache && cacheDate && (Date.now() - new Date(cacheDate).getTime() < 1000 * 3600)) {
        return JSON.parse(cache);
    } else {
        const response = await fetch('/.netlify/functions/announcements');
        if (response.ok) {
            const data = await response.json();
            localStorage.announcementsCacheDate = new Date().toISOString();
            localStorage.announcementsCache = JSON.stringify(data);
            return data;
        } else {
            throw new Error(response.statusText);
        }
    }
}

function formatAnnouncement(announcement: any, marked: any): Announcement {
    let body = marked.parseInline(announcement.body.split('\r\n')[0], { breaks: true });
    body += ` <a href="${announcement.url}">Read more.</a>`;

    return {
        title: announcement.title,
        date: dateFormat.format(new Date(announcement.createdAt)),
        body: body,
    };
}
</script>

<style lang="scss" scoped>
.container {
    opacity: 0.8;
    padding: 0 24px;
    margin: 20px auto;

    @media (min-width: 640px) {
        padding: 0 48px;
    }

    @media (min-width: 960px) {
        padding: 0 64px;
        max-width: 1280px;
    }

    @media (min-height: 890px) {
        min-height: calc(100vh - 700px);
    }

    @media (min-width: 960px) and (min-height: 960px) {
        margin-top: 100px;
        min-height: calc(100vh - 780px);
    }
}

.items {
    display: flex;
    flex-wrap: wrap;
    margin: -8px;
}

.item {
    padding: 8px;

    @media (min-width: 960px) {
        width: 50%;
    }
}

.custom-block {
    background: var(--vp-c-bg-alt);
    border-color: var(--vp-c-border);
}
</style>
