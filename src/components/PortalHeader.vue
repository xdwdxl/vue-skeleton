<template>
  <header class="portal-header">
    <div v-if="showBrand" class="portal-header__brand">CIDS Portal</div>
    <nav class="portal-header__nav">
      <template v-if="isAuthenticated">
        <router-link
          to="/portal"
          class="portal-header__link"
          @click="handleDashboardClick"
        >
          {{ $t("shell.dashboard") }}
        </router-link>
        <el-dropdown
          v-if="showAppsMenu"
          trigger="hover"
          @command="handleExternalAppCommand"
          popper-class="portal-header__apps-popper"
        >
          <div class="portal-header__link btn-text portal-header__apps-btn">
            <span class="portal-header__dropdown-trigger">Apps</span>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                v-for="item in externalApps"
                :key="item.key"
                :command="item.key"
                :disabled="!externalAppUrls[item.key]"
              >
                {{ item.label }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <router-link
          v-if="isPermAdmin"
          to="/portal/admin/perm"
          class="portal-header__link"
        >
          {{ $t("shell.permissions") }}
        </router-link>

        <el-dropdown
          trigger="hover"
          @command="handleUserCommand"
          popper-class="portal-header__user-popper"

        >
          <span class="portal-header__user portal-header__dropdown-trigger">
            {{ displayName }}
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="logout">{{
                $t("shell.logout")
              }}</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </template>
      <template v-else>
        <el-button class="portal-header__link btn-text login-btn" @click="login">
          {{ $t("shell.login") }}
        </el-button>
      </template>
      <div class="options">
        <NotifyCenter v-if="isAuthenticated" class="portal-header__notify" />
        <el-dropdown
          v-if="showLangSwitch"
          trigger="click"
          @command="handleLangCommand"
        >
          <el-button type="primary" class="portal-header__lang">
            <div
              :class="['fi', currentLangFlag, 'portal-lang-flag']"
              aria-hidden="true"
            />
            <div class="portal-header__lang-text">{{ i18n.locale }}</div>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="en-US">
                <span class="fi fi-us portal-lang-option-flag"></span> English
                (US)
              </el-dropdown-item>
              <el-dropdown-item command="de-DE">
                <span class="fi fi-de portal-lang-option-flag"></span> Deutsch
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </nav>
  </header>
</template>

<script setup lang="ts">
import {
  computed,
  onMounted,
  onBeforeUnmount,
  ref,
  inject,
  getCurrentInstance,
} from "vue";
import { useRouter } from "vue-router";
import { useI18n, I18nManager } from "../i18n";
import deDeMessages from "../i18n/locales/de-DE-portal.json";
import enUsMessages from "../i18n/locales/en-US-portal.json";
import { API } from "../api";
import { unwrapBffData } from "../http/api";
import NotifyCenter from "../notify/NotifyCenter.vue";
import { isAdminGroup, normalizeStringList } from "../perm/utils";
import bus from "../bus";
import {
  ElDropdown,
  ElDropdownMenu,
  ElDropdownItem,
  ElButton,
} from "element-plus";
import "element-plus/theme-chalk/el-dropdown.css";
import "element-plus/theme-chalk/el-dropdown-menu.css";
import "element-plus/theme-chalk/el-dropdown-item.css";
import "element-plus/theme-chalk/el-button.css";
import "element-plus/theme-chalk/el-popper.css";

function handleDashboardClick() {
  window.dispatchEvent(
    new CustomEvent("portal:navigate", { detail: { path: "/" } }),
  );
}

const PORTAL_RELAY_CONFIG = {
  dataId: "portal.relay.json",
  group: "PORTAL_GROUP",
} as const;

const props = defineProps({
  showBrand: {
    type: Boolean,
    default: true,
  },
  showLangSwitch: {
    type: Boolean,
    default: true,
  },
});

// Try to inject i18n, fallback to host app's i18n or new instance
let i18n: any;
try {
  i18n = useI18n();
} catch {
  // Fallback for remote execution (e.g. in Haiberg)
  // Use local I18nManager with bundled messages to ensure Portal keys exist
  const messages: Record<string, any> = {
    "de-DE": deDeMessages,
    "en-US": enUsMessages,
  };

  i18n = new I18nManager({
    loadMessages: async (locale) => messages[locale] || messages["en-US"],
  });

  // Sync initial locale from host if available
  const instance = getCurrentInstance();
  const proxy = instance?.proxy as any;

  if (proxy && (proxy.$i18n || proxy.$t)) {
    try {
      const val = proxy.$i18n?.locale;
      const hostLocale =
        val && typeof val === "object" && "value" in val
          ? val.value
          : val || "en-US";
      i18n.setLocale(hostLocale);
    } catch {
      /* ignore */
    }
  }
}

// Ensure template uses our i18n instance
const $t = (key: string, params?: any) => i18n.t(key, params);

const router = useRouter();
const isAuthenticated = ref(false);
const isPermAdmin = ref(false);
const userEmail = ref("");
const userName = ref("");
const userGroups = ref<string[]>([]);

const DEVELOPER_GROUP = "/developer";

function isDeveloperGroup(groups: string[]): boolean {
  for (const g of groups) {
    const s = String(g || "").trim();
    if (!s) continue;
    if (s === DEVELOPER_GROUP) return true;
    if (s.endsWith(DEVELOPER_GROUP)) return true;
  }
  return false;
}

const showAppsMenu = computed(() => {
  if (isPermAdmin.value) return true;
  return isDeveloperGroup(userGroups.value);
});

const EXTERNAL_APP_KEYS = {
  wiki: "wiki",
  youtrack: "youtrack",
  erpnext: "erpnext",
} as const;

type ExternalAppKey = (typeof EXTERNAL_APP_KEYS)[keyof typeof EXTERNAL_APP_KEYS];

const externalApps = [
  { key: EXTERNAL_APP_KEYS.wiki, label: "Wiki" },
  { key: EXTERNAL_APP_KEYS.youtrack, label: "YouTrack" },
  { key: EXTERNAL_APP_KEYS.erpnext, label: "ERPNext" },
] as const satisfies ReadonlyArray<{ key: ExternalAppKey; label: string }>;

const externalAppUrls = ref<Record<ExternalAppKey, string>>({
  [EXTERNAL_APP_KEYS.wiki]: "",
  [EXTERNAL_APP_KEYS.youtrack]: "",
  [EXTERNAL_APP_KEYS.erpnext]: "",
});

const displayName = computed(() =>
  buildDisplayName(userName.value, userEmail.value),
);

const langMap: Record<string, string> = {
  "en-US": "fi-us",
  "de-DE": "fi-de",
};

const currentLangFlag = computed(() => langMap[i18n.locale] || "fi-us");

/**
 * Build display name for header
 * @author Lorin Luo
 * @param {string} name - User name (optional)
 * @param {string} email - User email (optional)
 * @returns {string} - Returns display name
 */
function buildDisplayName(name: string, email: string): string {
  const trimmedName = String(name || "").trim();
  if (trimmedName) return trimmedName;

  const addr = String(email || "").trim();
  if (!addr) return "";

  const local = addr.split("@")[0] || "";
  const parts = local
    .split(/[._-]+/g)
    .map((p) => p.trim())
    .filter(Boolean);
  if (!parts.length) return addr;
  return parts.map((p) => (p ? p[0].toUpperCase() + p.slice(1) : "")).join(" ");
}

function login() {
  const redirectUri = `${window.location.origin}${window.location.pathname}`;
  window.location.href = API.AuthLoginUrl({ redirectUri });
}

type PortalRelayTarget = { base_url?: string; baseUrl?: string; baseURL?: string } & Record<string, unknown>;
type PortalRelayConfig = { targets?: Record<string, PortalRelayTarget> } & Record<string, unknown>;

function safeUrl(value: unknown): string {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    const u = new URL(raw, window.location.origin);
    return u.toString();
  } catch {
    return "";
  }
}

function pickRelayBaseUrl(target: PortalRelayTarget | undefined): string {
  if (!target) return "";
  return safeUrl(target.base_url ?? target.baseUrl ?? target.baseURL);
}

/**
 * Load external app entry URLs from Nacos config
 * @author Lorin Luo
 * @returns {Promise<void>} - Updates externalAppUrls
 */
async function loadPortalRelayConfig(): Promise<void> {
  try {
    const res = await API.GetConfig({
      dataId: PORTAL_RELAY_CONFIG.dataId,
      group: PORTAL_RELAY_CONFIG.group,
    });
    const cfg = unwrapBffData<PortalRelayConfig>(res) ?? (res as any)?.data ?? res;
    const targets = (cfg?.targets && typeof cfg.targets === "object") ? (cfg.targets as Record<string, PortalRelayTarget>) : {};
    externalAppUrls.value = {
      [EXTERNAL_APP_KEYS.wiki]: pickRelayBaseUrl(targets[EXTERNAL_APP_KEYS.wiki]),
      [EXTERNAL_APP_KEYS.youtrack]: pickRelayBaseUrl(targets[EXTERNAL_APP_KEYS.youtrack]),
      [EXTERNAL_APP_KEYS.erpnext]: pickRelayBaseUrl(targets[EXTERNAL_APP_KEYS.erpnext]),
    };
  } catch {
    externalAppUrls.value = {
      [EXTERNAL_APP_KEYS.wiki]: "",
      [EXTERNAL_APP_KEYS.youtrack]: "",
      [EXTERNAL_APP_KEYS.erpnext]: "",
    };
  }
}

/**
 * Open external app by key
 * @author Lorin Luo
 * @param {string} key - External app key
 * @returns {void}
 */
function handleExternalAppCommand(key: string): void {
  const appKey = String(key || "").trim() as ExternalAppKey;
  const url = externalAppUrls.value[appKey];
  if (!url) return;
  try {
    window.open(url, "_blank", "noopener,noreferrer");
    // if (!win) window.location.href = url;
  } catch {
    // window.location.href = url;
  }
}

async function handleUserCommand(command: string) {
  if (command === "logout") {
    const postLogoutRedirectUri = `${window.location.origin}${window.location.pathname}`;
    const u = await API.AuthLogoutFlow({ postLogoutRedirectUri });
    window.location.href = u || postLogoutRedirectUri;
    return;
  }
}

function handleLangCommand(command: string) {
  i18n.setLocale(command);
}

// Listen to external sync events (e.g. from Haiberg)
let unsub: (() => void) | undefined;
let themeUnsub: (() => void) | undefined;

onMounted(async () => {
  // Check for OIDC code in URL
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");

  if (code) {
    const redirectUri = `${window.location.origin}${window.location.pathname}`;
    isAuthenticated.value = await API.AuthHandleCallback({ code, redirectUri });

    // Clean up URL if exchange successful
    if (isAuthenticated.value) {
      const url = new URL(window.location.href);
      url.searchParams.delete("code");
      url.searchParams.delete("state");
      url.searchParams.delete("session_state");
      url.searchParams.delete("iss");
      window.history.replaceState({}, "", url.toString());
    }
  }

  if (!isAuthenticated.value) {
    isAuthenticated.value = await API.AuthInit();
  }

  if (isAuthenticated.value) {
    userEmail.value = API.AuthEmail();

    // Fetch detailed user info if needed
    try {
      const u = (await API.AuthMe()) as any;
      const data = unwrapBffData<any>(u) ?? u?.data ?? u;
      if (data) {
        if (data.name) userName.value = data.name;
        if (data.email) userEmail.value = data.email;

        // Check admin perms
        let groups = data.groups;
        if (!groups) {
          try {
            const p = await API.PermMe();
            groups = unwrapBffData<any>(p)?.groups;
          } catch {
            /* ignore */
          }
        }
        userGroups.value = normalizeStringList(groups);
        isPermAdmin.value = isAdminGroup(userGroups.value);
      }
    } catch (e) {
      console.warn("[PortalHeader] Failed to fetch user data", e);
    }

    await loadPortalRelayConfig();
  }

  // Subscribe to locale sync
  unsub = bus.subscribe("i18n.locale.sync", (msg) => {
    const payload = msg.payload as { locale?: string };
    if (payload?.locale && payload.locale !== i18n.locale) {
      i18n.setLocale(payload.locale);
    }
  });

});

onBeforeUnmount(() => {
  if (unsub) unsub();
});
</script>

<style scoped>
.portal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%; /* Parent controls height */
  padding: 0; /* Parent controls padding */
  background-color: transparent;
  border-bottom: none;
}

.portal-header__brand {
  margin-left: var(--layout-brand-offset-x);
  font-family: var(--font-family-bold);
  font-size: var(--portal-brand-font-size);
  font-weight: 700;
  color: var(--portal-header-fg);
}

.portal-header__nav {
  display: flex;
  align-items: center;
  gap: var(--portal-header-gap);
}

.portal-header__link {
  text-transform: uppercase;
  font-weight: 600;
  color: var(--portal-header-fg);
  text-decoration: none;
  font-size: var(--portal-link-font-size);
}

.portal-header__notify {
  margin-left: var(--layout-notify-margin-left);
  margin-top: -7px;
}

.portal-header__user {
  font-weight: 600;
  min-width: var(--portal-user-min-width);
  text-align: left;
  font-size: var(--portal-link-font-size);
  color: var(--portal-header-fg);
  cursor: pointer;
}



.portal-header__lang {
  display: flex;
  align-items: center;
  gap: var(--layout-lang-gap);
  margin-left: var(--layout-lang-margin-left);
  padding: var(--portal-lang-padding-y) var(--portal-lang-padding-x);

  border: none;
  background-color: var(--portal-lang-bg);
  color: var(--portal-header-fg);
  font-size: var(--font-size-small);
  cursor: pointer;
}
.el-button.portal-header__lang {
  border-radius: 20px !important;
  border: none;
}
.portal-header__lang:hover {
  border: none;
  background-color: var(--portal-lang-bg-hover);
}

.options {
  display: flex;
}

.btn-text {
  background: none;
  border: none;
  font-family: inherit;
  font-size: inherit;
  cursor: pointer;
  padding: 0;
}
.btn-text:hover {
  opacity: 0.8;
}

.portal-lang-flag {
  width: var(--layout-lang-icon-width);
  height: var(--layout-lang-icon-height);
}

.portal-lang-option-flag {
  margin-right: var(--spacing-sm);
}

.portal-header__apps-btn {
  display: inline-flex;
  align-items: center;
}

.portal-header__dropdown-trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.portal-header__apps-btn,
.portal-header__user,
.portal-header__dropdown-trigger {
  outline: none;
  box-shadow: none;
  border: none;
}

.portal-header__apps-btn:focus,
.portal-header__apps-btn:focus-visible,
.portal-header__apps-btn:active,
.portal-header__user:focus,
.portal-header__user:focus-visible,
.portal-header__user:active,
.portal-header__dropdown-trigger:focus,
.portal-header__dropdown-trigger:focus-visible,
.portal-header__dropdown-trigger:active {
  outline: none !important;
  box-shadow: none !important;
  border: none !important;
}

.portal-header__dropdown-trigger::after {
  content: "";
  display: inline-block;
  width: 6px;
  height: 6px;
  border-right: 2px solid currentColor;
  border-bottom: 2px solid currentColor;
  transform: rotate(45deg) translateY(-1px);
  opacity: 0.9;
}

:global(.portal-header__apps-popper.el-popper),
:global(.portal-header__user-popper.el-popper) {
  --portal-dropdown-bg: #1f2a33;
  --portal-dropdown-bg-hover: #30424f;
  --portal-dropdown-fg: #ffffff;
  --portal-dropdown-radius: 4px;
  --portal-dropdown-item-h: 37px;
  --portal-dropdown-item-px: 16px;

  --el-bg-color-overlay: var(--portal-dropdown-bg);
  --el-fill-color-blank: var(--portal-dropdown-bg);
  --el-dropdown-menuItem-hover-fill: var(--portal-dropdown-bg-hover);
  --el-dropdown-menuItem-hover-color: var(--portal-dropdown-fg);
  --el-dropdown-menuItem-text-color: var(--portal-dropdown-fg);
  --el-text-color-primary: var(--portal-dropdown-fg);
  --el-border-color-light: transparent;

  padding: 0;
  border: none;
  border-radius: var(--portal-dropdown-radius);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
}

:global(.portal-header__apps-popper.el-popper .el-popper__arrow::before),
:global(.portal-header__user-popper.el-popper .el-popper__arrow::before) {
  background: var(--portal-dropdown-bg);
  border: none;
}

:global(.portal-header__apps-popper .el-dropdown-menu),
:global(.portal-header__user-popper .el-dropdown-menu) {
  padding: 8px 0;
  margin: 0;
  border-radius: var(--portal-dropdown-radius);
  background: transparent;
}

:global(.portal-header__apps-popper .el-dropdown-menu__item),
:global(.portal-header__user-popper .el-dropdown-menu__item) {
  min-height: var(--portal-dropdown-item-h);
  height: 37px;
  padding: 0px;
  line-height: 1.2;
  display: flex;
  align-items: center;
  color: var(--portal-dropdown-fg);
  font-family: "StainlessCompBlack" !important;
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  transition: background-color 120ms ease-in-out;
}
:global(.portal-header__apps-popper),
:global(.portal-header__user-popper){
  width: 176px !important;
  border: none !important;
}
:global(.portal-header__apps-popper .el-dropdown-menu__item:hover),
:global(.portal-header__user-popper .el-dropdown-menu__item:hover),
:global(.portal-header__apps-popper .el-dropdown-menu__item:focus),
:global(.portal-header__user-popper .el-dropdown-menu__item:focus) {
  color: #99a1af;
  background-color: unset !important;
}

:global(.el-dropdown-menu__item:hover::before) {
    display: block;
    content: "";
    width: 8px;
    height: 37px;
    background: #fff;
    margin-left: 0px;
    margin-right: 16px;
}
:global(.el-dropdown-menu__item::before) {
    display: block;
    content: "";
    margin-left: 0px;
    margin-right: 16px;
}
.login-btn{
  border: 2px solid #fff;
  border-radius: 5px;
  padding: 2px 10px;
}

</style>
