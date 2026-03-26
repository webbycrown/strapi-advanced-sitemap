"use strict";
var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// server/src/register.js
var require_register = __commonJS({
  "server/src/register.js"(exports2, module2) {
    "use strict";
    module2.exports = async ({ strapi: strapi2 }) => {
      strapi2.log.info("Registering strapi-advanced-sitemap plugin...");
    };
  }
});

// server/src/utils/check-sitemap-permission.js
var require_check_sitemap_permission = __commonJS({
  "server/src/utils/check-sitemap-permission.js"(exports2, module2) {
    "use strict";
    var ACTIONS = {
      root: "plugin::strapi-advanced-sitemap.controller.serveRootSitemap",
      manualIndex: "plugin::strapi-advanced-sitemap.controller.serveManualSitemapIndex",
      manualFile: "plugin::strapi-advanced-sitemap.controller.serveManualSitemapFile",
      collectionFile: "plugin::strapi-advanced-sitemap.controller.serveCollectionSitemapFile"
    };
    var SITEMAP_PERMISSION_DEFINITIONS = [
      { controller: "controller", action: "serveRootSitemap", uid: ACTIONS.root },
      { controller: "controller", action: "serveManualSitemapIndex", uid: ACTIONS.manualIndex },
      { controller: "controller", action: "serveManualSitemapFile", uid: ACTIONS.manualFile },
      { controller: "controller", action: "serveCollectionSitemapFile", uid: ACTIONS.collectionFile }
    ];
    var PATCHED_FLAG = Symbol("strapi-advanced-sitemap-permissions-patched");
    var patchUsersPermissionsGetActions = (usersPermissionsService) => {
      if (!usersPermissionsService || usersPermissionsService[PATCHED_FLAG]) {
        return;
      }
      const originalGetActions = usersPermissionsService.getActions.bind(usersPermissionsService);
      usersPermissionsService.getActions = (options = {}) => {
        const result = originalGetActions(options) || {};
        const defaultEnable = options?.defaultEnable ?? false;
        const namespace = "plugin::strapi-advanced-sitemap";
        const currentControllers = result[namespace]?.controllers || {};
        const patchedControllers = { ...currentControllers };
        SITEMAP_PERMISSION_DEFINITIONS.forEach(({ controller, action }) => {
          const controllerActions = patchedControllers[controller] ? { ...patchedControllers[controller] } : {};
          if (!controllerActions[action]) {
            controllerActions[action] = { enabled: defaultEnable, policy: "" };
          }
          patchedControllers[controller] = controllerActions;
        });
        result[namespace] = {
          controllers: patchedControllers
        };
        return result;
      };
      usersPermissionsService[PATCHED_FLAG] = true;
    };
    var registerSitemapActions = async () => {
      const permissionsService = strapi.plugin("users-permissions")?.service("users-permissions");
      if (!permissionsService || typeof permissionsService.syncPermissions !== "function") {
        return;
      }
      patchUsersPermissionsGetActions(permissionsService);
      await permissionsService.syncPermissions();
    };
    var getRoleIdFromCtx = async (ctx) => {
      if (ctx.state?.user?.role?.id) {
        return ctx.state.user.role.id;
      }
      if (ctx.state?.auth?.credentials?.role?.id) {
        return ctx.state.auth.credentials.role.id;
      }
      if (ctx.state?.auth?.strategy?.name === "api-token") {
        return null;
      }
      const publicRole = await strapi.db.query("plugin::users-permissions.role").findOne({
        where: { type: "public" },
        select: ["id"]
      });
      return publicRole?.id || null;
    };
    var hasApiTokenPermission = (ctx, action) => {
      if (ctx.state?.auth?.strategy?.name !== "api-token") {
        return false;
      }
      const permissions = ctx.state?.auth?.credentials?.permissions;
      if (!Array.isArray(permissions)) {
        return false;
      }
      return permissions.includes(action);
    };
    var isActionEnabledForRole = (rolePermissions, action) => {
      if (!rolePermissions) {
        return false;
      }
      const [namespace, controller, actionName] = action.split(".").slice(-3);
      const controllerSet = rolePermissions?.[namespace]?.controllers?.[controller];
      return controllerSet?.[actionName]?.enabled === true;
    };
    var ensureSitemapPermission = async (ctx, actionKey) => {
      const action = ACTIONS[actionKey] || actionKey;
      if (hasApiTokenPermission(ctx, action)) {
        return true;
      }
      const roleId = await getRoleIdFromCtx(ctx);
      if (!roleId) {
        ctx.unauthorized();
        return false;
      }
      const roleService = strapi.plugin("users-permissions").service("role");
      const role = await roleService.findOne(roleId);
      if (isActionEnabledForRole(role.permissions, action)) {
        return true;
      }
      ctx.unauthorized();
      return false;
    };
    module2.exports = {
      ACTIONS,
      registerSitemapActions,
      ensureSitemapPermission
    };
  }
});

// server/src/bootstrap.js
var require_bootstrap = __commonJS({
  "server/src/bootstrap.js"(exports2, module2) {
    "use strict";
    var PLUGIN_ID = "strapi-advanced-sitemap";
    var trimSlashes = (value = "") => value.replace(/^\/+/, "").replace(/\/+$/, "");
    var { registerSitemapActions } = require_check_sitemap_permission();
    var getRequestOrigin = (ctx) => {
      if (ctx.origin) {
        return ctx.origin;
      }
      const protocol = ctx.request?.protocol || ctx.protocol || "http";
      const host = ctx.request?.header?.["x-forwarded-host"] || ctx.request?.header?.host || ctx.request?.hostname || ctx.hostname;
      return `${protocol}://${host}`;
    };
    module2.exports = async ({ strapi: strapi2 }) => {
      await registerSitemapActions();
      strapi2.server.use(async (ctx, next) => {
        try {
          if (ctx.method !== "GET") {
            return next();
          }
          const normalizedPath = trimSlashes(ctx.path || "");
          if (!normalizedPath || normalizedPath.startsWith("admin") || normalizedPath.startsWith("api/")) {
            return next();
          }
          const sitemapService = strapi2.plugin(PLUGIN_ID).service("service");
          if (normalizedPath === "sitemap.xml") {
            const [manualSitemaps2, collectionConfigs2, configuredBaseUrl2] = await Promise.all([
              sitemapService.getManualSitemaps(),
              sitemapService.getCollectionConfigs(),
              sitemapService.getConfiguredBaseUrl()
            ]);
            const origin2 = getRequestOrigin(ctx);
            const apiBaseUrl = `${origin2}/api/${PLUGIN_ID}`;
            const publicBaseUrl2 = sitemapService.resolveBaseUrl(configuredBaseUrl2, origin2);
            const xml2 = sitemapService.buildRootSitemap(manualSitemaps2, collectionConfigs2, {
              apiBaseUrl,
              publicBaseUrl: publicBaseUrl2
            });
            ctx.set("Content-Type", "application/xml; charset=utf-8");
            ctx.set("Cache-Control", "no-store");
            ctx.body = xml2;
            return void 0;
          }
          if (!normalizedPath.endsWith(".xml")) {
            return next();
          }
          const segments = normalizedPath.split("/");
          const filename = segments.pop();
          if (!filename) {
            return next();
          }
          const basePath = segments.join("/");
          const manualSitemaps = await sitemapService.getManualSitemaps();
          const target = manualSitemaps.find((item) => {
            const storedBase = trimSlashes(item.basePath || "");
            const storedFilename = trimSlashes(item.filename || "");
            return storedFilename === trimSlashes(filename) && storedBase === basePath;
          });
          const configuredBaseUrl = await sitemapService.getConfiguredBaseUrl();
          const origin = getRequestOrigin(ctx);
          const publicBaseUrl = sitemapService.resolveBaseUrl(configuredBaseUrl, origin);
          if (target) {
            const xml2 = sitemapService.buildManualSitemapFile(target, publicBaseUrl);
            ctx.set("Content-Type", "application/xml; charset=utf-8");
            ctx.set("Cache-Control", "no-store");
            ctx.body = xml2;
            return void 0;
          }
          const collectionConfigs = await sitemapService.getCollectionConfigs();
          const collectionTarget = collectionConfigs.find((config2) => {
            const storedBase = trimSlashes(config2.basePath || "");
            const storedFilename = trimSlashes(config2.filename || "");
            return storedFilename === trimSlashes(filename) && storedBase === basePath;
          });
          if (!collectionTarget) {
            return next();
          }
          const xml = await sitemapService.buildCollectionSitemapFile(collectionTarget, publicBaseUrl);
          ctx.set("Content-Type", "application/xml; charset=utf-8");
          ctx.set("Cache-Control", "no-store");
          ctx.body = xml;
          return void 0;
        } catch (error) {
          strapi2.log.error(`[${PLUGIN_ID}] Failed to serve sitemap: ${error?.message || error}`);
          return next();
        }
      });
    };
  }
});

// server/src/destroy.js
var require_destroy = __commonJS({
  "server/src/destroy.js"(exports2, module2) {
    "use strict";
    module2.exports = ({ strapi: strapi2 }) => {
      strapi2.log.info("Destroying strapi-advanced-sitemap plugin...");
    };
  }
});

// server/src/config/index.js
var require_config = __commonJS({
  "server/src/config/index.js"(exports2, module2) {
    "use strict";
    module2.exports = {
      default: {},
      validator: () => {
      }
    };
  }
});

// server/src/content-types/option/schema.json
var require_schema = __commonJS({
  "server/src/content-types/option/schema.json"(exports2, module2) {
    module2.exports = {
      schema: {
        collectionName: "strapi_sitemap_options",
        info: {
          singularName: "strapi-advanced-sitemap-option",
          pluralName: "strapi-advanced-sitemap-options",
          displayName: "strapi-advanced-sitemap-option"
        },
        options: {
          draftAndPublish: false,
          comment: ""
        },
        pluginOptions: {
          "content-manager": { visible: false },
          "content-type-builder": { visible: false }
        },
        kind: "singleType",
        attributes: {
          baseUrl: { type: "string" }
        }
      }
    };
  }
});

// server/src/content-types/content-type/schema.json
var require_schema2 = __commonJS({
  "server/src/content-types/content-type/schema.json"(exports2, module2) {
    module2.exports = {
      schema: {
        collectionName: "strapi_sitemap_content_types",
        info: {
          singularName: "strapi-advanced-sitemap-content-type",
          pluralName: "strapi-advanced-sitemap-content-types",
          displayName: "strapi-advanced-sitemap-content-type"
        },
        options: {
          draftAndPublish: false,
          comment: ""
        },
        pluginOptions: {
          "content-manager": { visible: false },
          "content-type-builder": { visible: false }
        },
        attributes: {
          type: { type: "string" },
          subPath: { type: "string" },
          pattern: { type: "string" },
          priority: { type: "float" },
          frequency: { type: "string" },
          lastModified: { type: "string" },
          basePath: { type: "string" },
          filename: { type: "string" }
        }
      }
    };
  }
});

// server/src/content-types/single-url/schema.json
var require_schema3 = __commonJS({
  "server/src/content-types/single-url/schema.json"(exports2, module2) {
    module2.exports = {
      schema: {
        collectionName: "strapi_sitemap_single_urls",
        info: {
          singularName: "strapi-advanced-sitemap-single-url",
          pluralName: "strapi-advanced-sitemap-single-urls",
          displayName: "strapi-advanced-sitemap-single-url"
        },
        options: {
          draftAndPublish: false,
          comment: ""
        },
        pluginOptions: {
          "content-manager": { visible: false },
          "content-type-builder": { visible: false }
        },
        attributes: {
          slug: { type: "string" },
          priority: { type: "float" },
          frequency: { type: "string" }
        }
      }
    };
  }
});

// server/src/content-types/index.js
var require_content_types = __commonJS({
  "server/src/content-types/index.js"(exports2, module2) {
    "use strict";
    module2.exports = {
      "strapi-advanced-sitemap-option": require_schema(),
      "strapi-advanced-sitemap-content-type": require_schema2(),
      "strapi-advanced-sitemap-single-url": require_schema3()
    };
  }
});

// server/src/controllers/controller.js
var require_controller = __commonJS({
  "server/src/controllers/controller.js"(exports2, module2) {
    "use strict";
    var PLUGIN_ID = "strapi-advanced-sitemap";
    var getManualSitemapService = () => strapi.plugin(PLUGIN_ID).service("service");
    var getRequestOrigin = (ctx) => {
      if (ctx.origin) {
        return ctx.origin;
      }
      const protocol = ctx.request.protocol || "http";
      const host = ctx.request.header["x-forwarded-host"] || ctx.request.header.host || (ctx.request.hostname ? `${ctx.request.hostname}` : "localhost");
      return `${protocol}://${host}`;
    };
    module2.exports = {
      async getOptions(ctx) {
        const data = await strapi.entityService.findMany(`plugin::${PLUGIN_ID}.strapi-advanced-sitemap-option`);
        const single = Array.isArray(data) ? data[0] : data;
        ctx.body = single || {};
      },
      async putOptions(ctx) {
        const body = ctx.request.body || {};
        const data = await strapi.entityService.findMany(`plugin::${PLUGIN_ID}.strapi-advanced-sitemap-option`);
        const single = Array.isArray(data) ? data[0] : data;
        if (single && single.id) {
          await strapi.entityService.update(`plugin::${PLUGIN_ID}.strapi-advanced-sitemap-option`, single.id, { data: body });
        } else {
          await strapi.entityService.create(`plugin::${PLUGIN_ID}.strapi-advanced-sitemap-option`, { data: body });
        }
        ctx.body = { ok: true };
      },
      async getManualSitemaps(ctx) {
        const sitemaps = await getManualSitemapService().getManualSitemaps();
        ctx.body = { sitemaps };
      },
      async putManualSitemaps(ctx) {
        const payload = ctx.request.body || {};
        const { sitemaps } = payload;
        if (!Array.isArray(sitemaps)) {
          ctx.throw(400, 'Invalid payload. Expected "sitemaps" to be an array.');
        }
        await getManualSitemapService().setManualSitemaps(sitemaps);
        ctx.body = { ok: true };
      },
      async serveRootSitemap(ctx) {
        const service = getManualSitemapService();
        const [manualSitemaps, collectionConfigs, configuredBaseUrl] = await Promise.all([
          service.getManualSitemaps(),
          service.getCollectionConfigs(),
          service.getConfiguredBaseUrl()
        ]);
        const origin = getRequestOrigin(ctx);
        const apiBaseUrl = `${origin}/api/${PLUGIN_ID}`;
        const publicBaseUrl = service.resolveBaseUrl(configuredBaseUrl, origin);
        const xml = service.buildRootSitemap(manualSitemaps, collectionConfigs, {
          apiBaseUrl,
          publicBaseUrl
        });
        ctx.set("Content-Type", "application/xml; charset=utf-8");
        ctx.set("Cache-Control", "no-store");
        ctx.body = xml;
      },
      async serveManualSitemapIndex(ctx) {
        const service = getManualSitemapService();
        const [sitemaps, configuredBaseUrl] = await Promise.all([
          service.getManualSitemaps(),
          service.getConfiguredBaseUrl()
        ]);
        const origin = getRequestOrigin(ctx);
        const publicBaseUrl = service.resolveBaseUrl(configuredBaseUrl, origin);
        const xml = service.buildManualSitemapIndex(sitemaps, publicBaseUrl);
        ctx.set("Content-Type", "application/xml; charset=utf-8");
        ctx.set("Cache-Control", "no-store");
        ctx.body = xml;
      },
      async serveManualSitemapFile(ctx) {
        const filenameParam = ctx.params.filename;
        const filename = filenameParam ? decodeURIComponent(filenameParam) : "";
        const service = getManualSitemapService();
        const sitemaps = await service.getManualSitemaps();
        const target = sitemaps.find((item) => item.filename === filename);
        if (!target) {
          return ctx.notFound("Sitemap not found");
        }
        const configuredBaseUrl = await service.getConfiguredBaseUrl();
        const origin = getRequestOrigin(ctx);
        const baseUrl = service.resolveBaseUrl(configuredBaseUrl, origin);
        const xml = service.buildManualSitemapFile(target, baseUrl);
        ctx.set("Content-Type", "application/xml; charset=utf-8");
        ctx.set("Cache-Control", "no-store");
        ctx.body = xml;
      },
      async serveCollectionSitemapFile(ctx) {
        const filenameParam = ctx.params.filename;
        const filename = filenameParam ? decodeURIComponent(filenameParam) : "";
        const normalizedId = filename.replace(/\.xml$/i, "");
        const service = getManualSitemapService();
        const [configs, configuredBaseUrl] = await Promise.all([
          service.getCollectionConfigs(),
          service.getConfiguredBaseUrl()
        ]);
        const target = configs.find((item) => String(item.id) === normalizedId);
        if (!target) {
          return ctx.notFound("Sitemap not found");
        }
        const origin = getRequestOrigin(ctx);
        const baseUrl = service.resolveBaseUrl(configuredBaseUrl, origin);
        const xml = await service.buildCollectionSitemapFile(target, baseUrl);
        ctx.set("Content-Type", "application/xml; charset=utf-8");
        ctx.set("Cache-Control", "no-store");
        ctx.body = xml;
      },
      async listCollectionTypes(ctx) {
        const results = await strapi.entityService.findMany(`plugin::${PLUGIN_ID}.strapi-advanced-sitemap-content-type`, { sort: { id: "desc" } });
        ctx.body = { results };
      },
      async createOrUpdateCollectionType(ctx) {
        const { id, ...payload } = ctx.request.body || {};
        if (id) {
          await strapi.entityService.update(`plugin::${PLUGIN_ID}.strapi-advanced-sitemap-content-type`, id, { data: payload });
        } else {
          await strapi.entityService.create(`plugin::${PLUGIN_ID}.strapi-advanced-sitemap-content-type`, { data: payload });
        }
        ctx.body = { ok: true };
      },
      async deleteCollectionType(ctx) {
        const { id } = ctx.request.query;
        if (id) {
          await strapi.entityService.delete(`plugin::${PLUGIN_ID}.strapi-advanced-sitemap-content-type`, id);
        }
        ctx.body = { ok: true };
      },
      async listCustomUrls(ctx) {
        const results = await strapi.entityService.findMany(`plugin::${PLUGIN_ID}.strapi-advanced-sitemap-single-url`, { sort: { id: "desc" } });
        ctx.body = { results };
      },
      async createOrUpdateCustomUrl(ctx) {
        const { id, ...payload } = ctx.request.body || {};
        if (id) {
          await strapi.entityService.update(`plugin::${PLUGIN_ID}.strapi-advanced-sitemap-single-url`, id, { data: payload });
        } else {
          await strapi.entityService.create(`plugin::${PLUGIN_ID}.strapi-advanced-sitemap-single-url`, { data: payload });
        }
        ctx.body = { ok: true };
      },
      async deleteCustomUrl(ctx) {
        const { id } = ctx.request.query;
        if (id) {
          await strapi.entityService.delete(`plugin::${PLUGIN_ID}.strapi-advanced-sitemap-single-url`, id);
        }
        ctx.body = { ok: true };
      },
      async listContentTypes(ctx) {
        const apiTypes = Object.values(strapi.contentTypes).filter((t) => t.uid?.startsWith("api::")).map((t) => ({
          uid: t.uid,
          singularName: t.info?.singularName || t.uid,
          displayName: t.info?.displayName || t.uid,
          kind: t.kind || null
        }));
        const collectionTypes = apiTypes.filter((t) => t.kind === "collectionType");
        const singleTypes = apiTypes.filter((t) => t.kind === "singleType");
        ctx.body = { collectionTypes, singleTypes };
      },
      async listLocales(ctx) {
        try {
          const service = strapi.plugin("i18n")?.service("locales");
          const locales = service ? await service.list() : [];
          ctx.body = locales;
        } catch (e) {
          ctx.body = [];
        }
      }
    };
  }
});

// server/src/controllers/index.js
var require_controllers = __commonJS({
  "server/src/controllers/index.js"(exports2, module2) {
    "use strict";
    module2.exports = {
      controller: require_controller()
    };
  }
});

// server/src/routes/index.js
var require_routes = __commonJS({
  "server/src/routes/index.js"(exports2, module2) {
    "use strict";
    module2.exports = {
      admin: {
        routes: [
          { method: "GET", path: "/admin-get-options", handler: "controller.getOptions", config: { policies: [] } },
          { method: "POST", path: "/admin-put-options", handler: "controller.putOptions", config: { policies: [] } },
          { method: "GET", path: "/manual-sitemaps", handler: "controller.getManualSitemaps", config: { policies: [] } },
          { method: "POST", path: "/manual-sitemaps", handler: "controller.putManualSitemaps", config: { policies: [] } },
          { method: "GET", path: "/admin", handler: "controller.listCollectionTypes", config: { policies: [] } },
          { method: "POST", path: "/admin", handler: "controller.createOrUpdateCollectionType", config: { policies: [] } },
          { method: "DELETE", path: "/admin", handler: "controller.deleteCollectionType", config: { policies: [] } },
          { method: "GET", path: "/admin-custom-urls", handler: "controller.listCustomUrls", config: { policies: [] } },
          { method: "POST", path: "/admin-custom-urls", handler: "controller.createOrUpdateCustomUrl", config: { policies: [] } },
          { method: "DELETE", path: "/admin-custom-urls", handler: "controller.deleteCustomUrl", config: { policies: [] } },
          { method: "GET", path: "/admin-get-content-types", handler: "controller.listContentTypes", config: { policies: [] } },
          { method: "GET", path: "/admin-get-locales", handler: "controller.listLocales", config: { policies: [] } }
        ]
      },
      "content-api": {
        routes: [
          {
            method: "GET",
            path: "/sitemap.xml",
            handler: "controller.serveRootSitemap",
            info: { type: "content-api", pluginName: "strapi-advanced-sitemap", permissionAction: "root" },
            config: {
              auth: false,
              middlewares: [],
              policies: []
            }
          },
          {
            method: "GET",
            path: "/manual-sitemaps",
            handler: "controller.serveManualSitemapIndex",
            info: { type: "content-api", pluginName: "strapi-advanced-sitemap", permissionAction: "manualIndex" },
            config: {
              auth: false,
              middlewares: [],
              policies: []
            }
          },
          {
            method: "GET",
            path: "/manual-sitemaps/:filename",
            handler: "controller.serveManualSitemapFile",
            info: { type: "content-api", pluginName: "strapi-advanced-sitemap", permissionAction: "manualFile" },
            config: {
              auth: false,
              middlewares: [],
              policies: []
            }
          },
          {
            method: "GET",
            path: "/collection-sitemaps/:filename",
            handler: "controller.serveCollectionSitemapFile",
            info: { type: "content-api", pluginName: "strapi-advanced-sitemap", permissionAction: "collectionFile" },
            config: {
              auth: false,
              middlewares: [],
              policies: []
            }
          }
        ]
      }
    };
  }
});

// server/src/services/service.js
var require_service = __commonJS({
  "server/src/services/service.js"(exports2, module2) {
    "use strict";
    var XML_HEADER = '<?xml version="1.0" encoding="UTF-8"?>';
    var SITEMAP_NAMESPACE = "http://www.sitemaps.org/schemas/sitemap/0.9";
    var XHTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
    var IMAGE_NAMESPACE = "http://www.google.com/schemas/sitemap-image/1.1";
    var escapeXml = (value = "") => value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&apos;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    var toNumberOrNull = (value) => {
      if (typeof value === "number" && Number.isFinite(value)) {
        return value;
      }
      if (typeof value === "string" && value.trim() !== "") {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
      }
      return null;
    };
    var clampPriority = (value) => {
      if (value === null || value === void 0 || Number.isNaN(value)) {
        return null;
      }
      const numeric = Math.min(Math.max(Number(value), 0), 1);
      return Number(numeric.toFixed(3));
    };
    var formatPriority = (priority) => {
      if (priority === null || priority === void 0) {
        return null;
      }
      return priority % 1 === 0 ? priority.toString() : priority.toFixed(1).replace(/0+$/, "").replace(/\.$/, "");
    };
    var sanitizeManualSitemap = (input = {}) => {
      const kind = input.kind === "index" ? "index" : "single";
      return {
        name: typeof input.name === "string" ? input.name : "",
        kind,
        basePath: typeof input.basePath === "string" ? trimSlashes(input.basePath) : "",
        filename: typeof input.filename === "string" ? input.filename : "",
        urls: Array.isArray(input.urls) ? input.urls.map((url = {}) => ({
          loc: typeof url.loc === "string" ? url.loc : "",
          priority: kind === "single" ? clampPriority(toNumberOrNull(url.priority)) : null
        })) : []
      };
    };
    var sanitizeCollectionConfig = (strapi2, input = {}) => {
      let type = typeof input.type === "string" ? input.type : "";
      if (type && !type.includes("::")) {
        const match = Object.values(strapi2.contentTypes).find((ct) => ct.info?.singularName === type || ct.uid === type);
        if (match) {
          type = match.uid;
        }
      }
      const fallbackFrequency = "weekly";
      return {
        id: input.id,
        type,
        subPath: typeof input.subPath === "string" ? trimSlashes(input.subPath) : "",
        pattern: typeof input.pattern === "string" ? input.pattern : "",
        priority: clampPriority(toNumberOrNull(input.priority)),
        frequency: typeof input.frequency === "string" && input.frequency.trim() !== "" ? input.frequency : fallbackFrequency,
        lastModified: typeof input.lastModified === "string" ? input.lastModified : String(Boolean(input.lastModified)),
        basePath: typeof input.basePath === "string" ? trimSlashes(input.basePath) : "",
        filename: typeof input.filename === "string" ? trimSlashes(input.filename) : "",
        createdAt: input.createdAt || null
      };
    };
    var ensureLeadingSlash = (value = "") => value.startsWith("/") ? value : `/${value}`;
    var trimSlashes = (value = "") => value.replace(/^\/+/, "").replace(/\/+$/, "");
    var joinUrlSegments = (segments = []) => segments.filter(Boolean).join("/");
    var resolveManualSitemapPublicUrl = (baseUrl = "", sitemap = {}) => {
      const filename = trimSlashes(sitemap?.filename || "");
      if (!filename) {
        return null;
      }
      if (/^https?:\/\//i.test(filename)) {
        return filename;
      }
      const trimmedBaseUrl = baseUrl.replace(/\/+$/, "");
      if (!trimmedBaseUrl) {
        return null;
      }
      const basePath = trimSlashes(sitemap?.basePath || "");
      const path = joinUrlSegments([basePath, filename]);
      return `${trimmedBaseUrl}${ensureLeadingSlash(encodeURI(path))}`;
    };
    var resolveCollectionSitemapPublicUrl = (baseUrl = "", config2 = {}) => {
      const filename = trimSlashes(config2?.filename || "");
      if (!filename) {
        return null;
      }
      if (/^https?:\/\//i.test(filename)) {
        return filename;
      }
      const trimmedBaseUrl = baseUrl.replace(/\/+$/, "");
      if (!trimmedBaseUrl) {
        return null;
      }
      const basePath = trimSlashes(config2?.basePath || "");
      const path = joinUrlSegments([basePath, filename]);
      return `${trimmedBaseUrl}${ensureLeadingSlash(encodeURI(path))}`;
    };
    var extractTokens = (pattern = "") => {
      const matches = pattern.match(/\[[^\]]+]/g) || [];
      return matches.map((token) => token.slice(1, -1)).filter(Boolean);
    };
    var getDeepValue = (entry, path) => {
      if (!path) {
        return void 0;
      }
      return path.split(".").reduce((acc, key) => acc && acc[key] !== void 0 ? acc[key] : void 0, entry);
    };
    module2.exports = ({ strapi: strapi2 }) => {
      const manualSitemapsStore = () => strapi2.store({
        type: "plugin",
        name: "strapi-advanced-sitemap",
        key: "manual-sitemaps"
      });
      const collectionConfigUid = "plugin::strapi-advanced-sitemap.strapi-advanced-sitemap-content-type";
      const optionUid = "plugin::strapi-advanced-sitemap.strapi-advanced-sitemap-option";
      const fetchAllEntries = async (uid) => {
        if (!uid) {
          return [];
        }
        const pageSize = 500;
        let page = 1;
        const all = [];
        while (true) {
          const schema = strapi2.getModel(uid);
          const hasDraft = schema?.options?.draftAndPublish;
          const query = {
            publicationState: hasDraft ? "live" : void 0,
            pagination: { page, pageSize }
          };
          query.fields = void 0;
          const batch = await strapi2.entityService.findMany(uid, query);
          if (!Array.isArray(batch) || batch.length === 0) {
            break;
          }
          all.push(...batch);
          if (batch.length < pageSize) {
            break;
          }
          page += 1;
        }
        return all;
      };
      const resolveBaseUrl = (configured, fallback) => {
        if (configured && /^https?:\/\//i.test(configured)) {
          return configured.replace(/\/+$/, "");
        }
        return fallback.replace(/\/+$/, "");
      };
      return {
        async getManualSitemaps() {
          const stored = await manualSitemapsStore().get() || [];
          return stored.map(sanitizeManualSitemap);
        },
        async setManualSitemaps(sitemaps = []) {
          const sanitized = Array.isArray(sitemaps) ? sitemaps.map(sanitizeManualSitemap) : [];
          await manualSitemapsStore().set({ value: sanitized });
          return sanitized;
        },
        async getCollectionConfigs() {
          const results = await strapi2.entityService.findMany(collectionConfigUid, {
            sort: [{ createdAt: "asc" }, { id: "asc" }]
          });
          return Array.isArray(results) ? results.map((item) => sanitizeCollectionConfig(strapi2, item)) : [];
        },
        async getConfiguredBaseUrl() {
          const data = await strapi2.entityService.findMany(optionUid);
          const single = Array.isArray(data) ? data[0] : data;
          const baseUrl = single?.baseUrl;
          return typeof baseUrl === "string" && baseUrl.trim() !== "" ? baseUrl.trim() : null;
        },
        buildManualSitemapIndex(sitemaps = [], publicBaseUrl = "") {
          const entries = sitemaps.map((sitemap) => resolveManualSitemapPublicUrl(publicBaseUrl, sitemap)).filter(Boolean).map((loc) => `<sitemap><loc>${escapeXml(loc)}</loc></sitemap>`).join("");
          return `${XML_HEADER}<sitemapindex xmlns="${SITEMAP_NAMESPACE}">${entries}</sitemapindex>`;
        },
        buildManualSitemapFile(sitemap = {}, baseUrl = "") {
          const sanitized = sanitizeManualSitemap(sitemap);
          if (sanitized.kind === "index") {
            const entries = (sanitized.urls || []).filter((url) => typeof url.loc === "string" && url.loc.trim() !== "").map((url) => {
              if (/^https?:\/\//i.test(url.loc)) {
                return `<sitemap><loc>${escapeXml(url.loc)}</loc></sitemap>`;
              }
              const trimmedBase = baseUrl.replace(/\/+$/, "");
              const slug = trimSlashes(url.loc);
              const absoluteUrl = slug ? `${trimmedBase}${ensureLeadingSlash(slug)}` : trimmedBase;
              return `<sitemap><loc>${escapeXml(absoluteUrl)}</loc></sitemap>`;
            }).join("");
            return `${XML_HEADER}<sitemapindex xmlns="${SITEMAP_NAMESPACE}">${entries}</sitemapindex>`;
          }
          const urls = (sanitized.urls || []).filter((url) => typeof url.loc === "string" && url.loc.trim() !== "").map((url) => {
            if (/^https?:\/\//i.test(url.loc)) {
              const priority2 = formatPriority(url.priority);
              const priorityTag2 = priority2 ? `<priority>${escapeXml(priority2)}</priority>` : "";
              return `<url><loc>${escapeXml(url.loc)}</loc>${priorityTag2}</url>`;
            }
            const trimmedBase = baseUrl.replace(/\/+$/, "");
            const slug = trimSlashes(url.loc);
            const absoluteUrl = slug ? `${trimmedBase}${ensureLeadingSlash(slug)}` : trimmedBase;
            const priority = formatPriority(url.priority);
            const priorityTag = priority ? `<priority>${escapeXml(priority)}</priority>` : "";
            return `<url><loc>${escapeXml(absoluteUrl)}</loc>${priorityTag}</url>`;
          }).join("");
          return `${XML_HEADER}<urlset xmlns="${SITEMAP_NAMESPACE}" xmlns:xhtml="${XHTML_NAMESPACE}" xmlns:image="${IMAGE_NAMESPACE}">${urls}</urlset>`;
        },
        buildRootSitemap(manualSitemaps = [], collectionConfigs = [], { apiBaseUrl = "", publicBaseUrl = "" } = {}) {
          const trimmedApiBase = apiBaseUrl.replace(/\/+$/, "");
          const manualEntries = manualSitemaps.map((sitemap) => resolveManualSitemapPublicUrl(publicBaseUrl, sitemap)).filter(Boolean).map((loc) => `<sitemap><loc>${escapeXml(loc)}</loc></sitemap>`);
          const collectionEntries = collectionConfigs.map((config2) => {
            if (config2.id === void 0) {
              return null;
            }
            const publicUrl = resolveCollectionSitemapPublicUrl(publicBaseUrl, config2);
            if (publicUrl) {
              return `<sitemap><loc>${escapeXml(publicUrl)}</loc></sitemap>`;
            }
            return `<sitemap><loc>${escapeXml(`${trimmedApiBase}/collection-sitemaps/${encodeURIComponent(String(config2.id))}.xml`)}</loc></sitemap>`;
          }).filter(Boolean);
          const allEntries = [...manualEntries, ...collectionEntries].join("");
          return `${XML_HEADER}<sitemapindex xmlns="${SITEMAP_NAMESPACE}">${allEntries}</sitemapindex>`;
        },
        async buildCollectionSitemapFile(config2 = {}, baseUrl = "") {
          const sanitizedConfig = sanitizeCollectionConfig(strapi2, config2);
          if (!sanitizedConfig.type || !sanitizedConfig.pattern) {
            return `${XML_HEADER}<urlset xmlns="${SITEMAP_NAMESPACE}" xmlns:xhtml="${XHTML_NAMESPACE}" xmlns:image="${IMAGE_NAMESPACE}"></urlset>`;
          }
          const tokens = extractTokens(sanitizedConfig.pattern);
          const entries = await fetchAllEntries(sanitizedConfig.type);
          const trimmedBase = baseUrl.replace(/\/+$/, "");
          const urls = entries.map((entry) => {
            let resolvedPath = sanitizedConfig.pattern;
            for (const token of tokens) {
              const rawValue = getDeepValue(entry, token);
              if (rawValue === null || rawValue === void 0) {
                return null;
              }
              resolvedPath = resolvedPath.replace(`[${token}]`, String(rawValue));
            }
            if (resolvedPath.includes("[")) {
              return null;
            }
            if (!/^https?:\/\//i.test(resolvedPath)) {
              const joined = joinUrlSegments([sanitizedConfig.subPath, trimSlashes(resolvedPath)]);
              resolvedPath = `${trimmedBase}${ensureLeadingSlash(joined)}`;
            }
            const absoluteUrl = resolvedPath;
            const priorityValue = formatPriority(sanitizedConfig.priority);
            const priorityTag = priorityValue ? `<priority>${escapeXml(priorityValue)}</priority>` : "";
            const changeFreqTag = sanitizedConfig.frequency ? `<changefreq>${escapeXml(sanitizedConfig.frequency)}</changefreq>` : "";
            let lastModTag = "";
            if (String(sanitizedConfig.lastModified).toLowerCase() === "true") {
              const lastModSource = entry.updatedAt || entry.publishedAt || entry.createdAt;
              if (lastModSource) {
                const iso = new Date(lastModSource).toISOString();
                lastModTag = `<lastmod>${escapeXml(iso)}</lastmod>`;
              }
            }
            return `<url><loc>${escapeXml(absoluteUrl)}</loc>${lastModTag}${changeFreqTag}${priorityTag}</url>`;
          }).filter(Boolean).join("");
          return `${XML_HEADER}<urlset xmlns="${SITEMAP_NAMESPACE}" xmlns:xhtml="${XHTML_NAMESPACE}" xmlns:image="${IMAGE_NAMESPACE}">${urls}</urlset>`;
        },
        resolveBaseUrl,
        resolveManualSitemapPublicUrl,
        resolveCollectionSitemapPublicUrl
      };
    };
  }
});

// server/src/services/index.js
var require_services = __commonJS({
  "server/src/services/index.js"(exports2, module2) {
    "use strict";
    module2.exports = {
      service: require_service()
    };
  }
});

// server/src/middlewares/permission-check.js
var require_permission_check = __commonJS({
  "server/src/middlewares/permission-check.js"(exports2, module2) {
    "use strict";
    module2.exports = () => {
      return async (_ctx, next) => {
        return next();
      };
    };
  }
});

// server/src/middlewares/index.js
var require_middlewares = __commonJS({
  "server/src/middlewares/index.js"(exports2, module2) {
    "use strict";
    module2.exports = {
      "permission-check": require_permission_check()
    };
  }
});

// server/src/policies/index.js
var require_policies = __commonJS({
  "server/src/policies/index.js"(exports2, module2) {
    "use strict";
    module2.exports = {};
  }
});

// server/src/index.js
var register = require_register();
var bootstrap = require_bootstrap();
var destroy = require_destroy();
var config = require_config();
var contentTypes = require_content_types();
var controllers = require_controllers();
var routes = require_routes();
var services = require_services();
var middlewares = require_middlewares();
var policies = require_policies();
module.exports = {
  register,
  bootstrap,
  destroy,
  config,
  controllers,
  contentTypes,
  policies,
  middlewares,
  routes,
  services
};
