"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * admin.ts - admin management routes.
 */
const express_1 = __importDefault(require("express"));
const { v4: uuidv4 } = require("uuid");
const db_1 = __importDefault(require("./db"));
const admin_auth_1 = require("./admin-auth");
const smtp_1 = require("./smtp");
const router = express_1.default.Router();
function generateApiKey() {
    const hex = [...Array(40)]
        .map(() => Math.floor(Math.random() * 16).toString(16))
        .join("");
    return `email_${hex}`;
}
function normalizeDomain(domain) {
    return domain.replace(/\/$/, "");
}
function getErrorMessage(err) {
    return err instanceof Error ? err.message : String(err);
}
function readRequiredString(value) {
    if (typeof value !== "string") {
        return null;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}
function readOptionalString(value) {
    if (typeof value !== "string") {
        return null;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}
function toDbActive(value) {
    if (db_1.default.driver === "postgres") {
        return value;
    }
    return value ? 1 : 0;
}
function tokenPayload(tokens) {
    return {
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        access_expires_at: tokens.accessExpiresAt,
        refresh_expires_at: tokens.refreshExpiresAt,
    };
}
function stripToken(site) {
    const { api_key, ...rest } = site;
    return rest;
}
function stripPass(site) {
    const { smtp_pass, ...rest } = site;
    return rest;
}
router.post("/auth/login", async (req, res) => {
    try {
        const secret = readRequiredString(req.body?.secret) ?? "";
        if (!(0, admin_auth_1.verifyAdminSecret)(secret)) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const tokens = await (0, admin_auth_1.issueTokenPair)();
        return res.json(tokenPayload(tokens));
    }
    catch (err) {
        console.error("Admin login failed:", err);
        return res.status(500).json({ error: getErrorMessage(err) });
    }
});
router.post("/auth/refresh", async (req, res) => {
    try {
        const refreshToken = readRequiredString(req.body?.refresh_token) ?? "";
        if (!refreshToken) {
            return res.status(400).json({ error: "refresh_token is required" });
        }
        const tokens = await (0, admin_auth_1.rotateRefreshToken)(refreshToken);
        if (!tokens) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        return res.json(tokenPayload(tokens));
    }
    catch (err) {
        console.error("Token refresh failed:", err);
        return res.status(500).json({ error: getErrorMessage(err) });
    }
});
router.post("/auth/logout", async (req, res) => {
    try {
        const refreshToken = readRequiredString(req.body?.refresh_token) ?? "";
        if (!refreshToken) {
            return res.status(400).json({ error: "refresh_token is required" });
        }
        await (0, admin_auth_1.logoutWithRefreshToken)(refreshToken);
        return res.json({ ok: true });
    }
    catch (err) {
        console.error("Logout failed:", err);
        return res.status(500).json({ error: getErrorMessage(err) });
    }
});
router.get("/auth/me", admin_auth_1.requireAccessToken, (req, res) => {
    if (!req.adminAuth) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    return res.json({
        authenticated: true,
        access_expires_at: req.adminAuth.accessExpiresAt,
    });
});
router.use(admin_auth_1.requireAccessToken);
router.post("/sites", async (req, res) => {
    try {
        const name = readRequiredString(req.body?.name);
        const domain = readRequiredString(req.body?.domain);
        const smtpHost = readOptionalString(req.body?.smtp_host);
        const smtpPortRaw = req.body?.smtp_port;
        const smtpUser = readOptionalString(req.body?.smtp_user);
        const smtpPass = readOptionalString(req.body?.smtp_pass);
        const smtpSecureRaw = req.body?.smtp_secure;
        const smtpName = readOptionalString(req.body?.smtp_name);
        const smtpFrom = readOptionalString(req.body?.smtp_from);
        const emailTo = readOptionalString(req.body?.email_to);
        const note = readOptionalString(req.body?.note);
        if (!name ||
            !domain ||
            (smtpPortRaw !== undefined && typeof smtpPortRaw !== "number") ||
            (smtpSecureRaw !== undefined && typeof smtpSecureRaw !== "boolean")) {
            return res.status(400).json({ error: "Invalid input data" });
        }
        const smtpPort = typeof smtpPortRaw === "number" ? smtpPortRaw : null;
        const smtpSecure = typeof smtpSecureRaw === "boolean" ? toDbActive(smtpSecureRaw) : null;
        const id = uuidv4();
        const apiKey = generateApiKey();
        await db_1.default.run(`INSERT INTO sites (id, name, domain, api_key, smtp_host, smtp_port, smtp_user, smtp_pass, smtp_secure, smtp_name, smtp_from, email_to, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            id,
            name,
            normalizeDomain(domain),
            apiKey,
            smtpHost,
            smtpPort,
            smtpUser,
            smtpPass,
            smtpSecure,
            smtpName,
            smtpFrom,
            emailTo,
            note,
        ]);
        return res.status(201).json({
            id,
            name,
            domain: normalizeDomain(domain),
            api_key: apiKey,
            smtp_host: smtpHost,
            smtp_port: smtpPort,
            smtp_user: smtpUser,
            smtp_pass: smtpPass,
            smtp_secure: smtpSecure,
            smtp_name: smtpName,
            smtp_from: smtpFrom,
            email_to: emailTo,
            note,
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: getErrorMessage(err) });
    }
});
router.get("/sites", async (_req, res) => {
    try {
        const sites = await db_1.default.all("SELECT * FROM sites ORDER BY created_at DESC", []);
        return res.json(sites.map((site) => stripPass(site)));
    }
    catch (err) {
        return res.status(500).json({ error: getErrorMessage(err) });
    }
});
router.get("/sites/:id", async (req, res) => {
    try {
        const site = await db_1.default.get("SELECT * FROM sites WHERE id = ?", [
            req.params.id,
        ]);
        if (!site) {
            return res.status(404).json({ error: "Not found" });
        }
        return res.json(stripPass(site));
    }
    catch (err) {
        return res.status(500).json({ error: getErrorMessage(err) });
    }
});
router.patch("/sites/:id", async (req, res) => {
    try {
        const updates = [];
        const values = [];
        const fields = [
            "name",
            "domain",
            "smtp_host",
            "smtp_port",
            "smtp_user",
            "smtp_pass",
            "smtp_secure",
            "smtp_name",
            "smtp_from",
            "email_to",
            "active",
            "note",
        ];
        for (const key of fields) {
            const raw = req.body?.[key];
            if (raw === undefined) {
                continue;
            }
            if (key === "active") {
                if (typeof raw !== "boolean") {
                    return res.status(400).json({ error: "active must be a boolean" });
                }
                updates.push("active = ?");
                values.push(toDbActive(raw));
                continue;
            }
            if (key === "note") {
                if (raw !== null && typeof raw !== "string") {
                    return res
                        .status(400)
                        .json({ error: "note must be a string or null" });
                }
                const note = typeof raw === "string" ? raw.trim() || null : null;
                updates.push("note = ?");
                values.push(note);
                continue;
            }
            if (key === "smtp_port") {
                if (typeof raw !== "number" || !Number.isFinite(raw)) {
                    return res.status(400).json({ error: "smtp_port must be a number" });
                }
                updates.push("smtp_port = ?");
                values.push(raw);
                continue;
            }
            if (key === "smtp_secure") {
                if (typeof raw !== "boolean") {
                    return res
                        .status(400)
                        .json({ error: "smtp_secure must be a boolean" });
                }
                updates.push("smtp_secure = ?");
                values.push(toDbActive(raw));
                continue;
            }
            if (typeof raw !== "string") {
                return res.status(400).json({ error: `${key} must be a string` });
            }
            const value = raw.trim();
            if (!value) {
                return res.status(400).json({ error: `${key} must not be empty` });
            }
            updates.push(`${key} = ?`);
            values.push(key === "domain" ? normalizeDomain(value) : value);
        }
        if (updates.length === 0) {
            return res.status(400).json({ error: "No valid fields to update" });
        }
        values.push(req.params.id);
        const result = await db_1.default.run(`UPDATE sites SET ${updates.join(", ")} WHERE id = ?`, values);
        if (result.changes === 0) {
            return res.status(404).json({ error: "Not found" });
        }
        return res.json({ updated: true });
    }
    catch (err) {
        return res.status(500).json({ error: getErrorMessage(err) });
    }
});
router.delete("/sites/:id", async (req, res) => {
    try {
        const result = await db_1.default.run("DELETE FROM sites WHERE id = ?", [
            req.params.id,
        ]);
        if (result.changes === 0) {
            return res.status(404).json({ error: "Not found" });
        }
        return res.json({ deleted: true });
    }
    catch (err) {
        return res.status(500).json({ error: getErrorMessage(err) });
    }
});
router.post("/sites/:id/rotate", async (req, res) => {
    try {
        const newKey = generateApiKey();
        const result = await db_1.default.run("UPDATE sites SET api_key = ? WHERE id = ?", [
            newKey,
            req.params.id,
        ]);
        if (result.changes === 0) {
            return res.status(404).json({ error: "Not found" });
        }
        return res.json({ api_key: newKey });
    }
    catch (err) {
        return res.status(500).json({ error: getErrorMessage(err) });
    }
});
router.get("/sites/:id/stats", async (req, res) => {
    try {
        const requestedLimit = Number.parseInt(req.query.limit ?? "", 10);
        const limit = Math.min(Number.isFinite(requestedLimit) ? requestedLimit : 50, 500);
        const cursor = req.query.cursor;
        let rows;
        if (cursor) {
            rows = await db_1.default.all(`SELECT * FROM email_log WHERE site_id = ? AND id < ? ORDER BY id DESC LIMIT ?`, [req.params.id, cursor, limit]);
        }
        else {
            rows = await db_1.default.all(`SELECT * FROM email_log WHERE site_id = ? ORDER BY id DESC LIMIT ?`, [req.params.id, limit]);
        }
        const countResult = await db_1.default.get(`SELECT COUNT(*) as count FROM email_log WHERE site_id = ?`, [req.params.id]);
        const totalCount = countResult?.count ?? 0;
        return res.json({ rows, totalCount });
    }
    catch (err) {
        return res.status(500).json({ error: getErrorMessage(err) });
    }
});
router.post("/sites/:id/test-email", async (req, res) => {
    try {
        const site = await db_1.default.get("SELECT * FROM sites WHERE id = ?", [
            req.params.id,
        ]);
        if (!site) {
            return res.status(404).json({ error: "Not found" });
        }
        const smtpConfig = (0, smtp_1.getSmtpConfig)(site);
        if (!smtpConfig.ok) {
            return res.status(400).json({ error: smtpConfig.error });
        }
        const toAddress = readRequiredString(site.email_to);
        if (!toAddress) {
            return res.status(400).json({
                error: "email_to is required to send a test email",
            });
        }
        const fromAddress = (0, smtp_1.formatFromAddress)(smtpConfig.config);
        const transport = (0, smtp_1.createSmtpTransport)(smtpConfig.config, {
            connectionTimeout: 8000,
            greetingTimeout: 8000,
            socketTimeout: 10000,
        });
        const sentAt = new Date().toISOString();
        const subject = "Test email from Email Proxy";
        const text = "This is a test email sent at " +
            sentAt +
            " to verify your SMTP settings.";
        const html = "<p>This is a test email sent at <strong>" +
            sentAt +
            "</strong> to verify your SMTP settings.</p>";
        let error = null;
        let messageId = null;
        try {
            const info = await transport.sendMail({
                from: fromAddress,
                to: toAddress,
                subject,
                text,
                html,
            });
            if (typeof info?.messageId === "string") {
                messageId = info.messageId;
            }
        }
        catch (err) {
            error = getErrorMessage(err);
        }
        try {
            const ip = typeof req.ip === "string" && req.ip.trim() ? req.ip : null;
            await db_1.default.run(`INSERT INTO email_log (site_id, from_email, to_email, subject, body_text, body_html, error, ip)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
                site.id,
                smtpConfig.config.from,
                toAddress,
                subject,
                text,
                html,
                error,
                ip,
            ]);
        }
        catch (logErr) {
            console.error("Log write failed:", logErr);
        }
        if (typeof transport.close === "function") {
            try {
                transport.close();
            }
            catch (closeErr) {
                console.warn("Failed to close SMTP transport:", closeErr);
            }
        }
        if (error) {
            return res.status(502).json({ error });
        }
        return res.json({
            ok: true,
            ...(messageId ? { message_id: messageId } : {}),
        });
    }
    catch (err) {
        console.error("Failed to send test email:", err);
        return res.status(500).json({ error: getErrorMessage(err) });
    }
});
router.post("/sites/:id/test-connection", async (req, res) => {
    try {
        const site = await db_1.default.get("SELECT * FROM sites WHERE id = ?", [
            req.params.id,
        ]);
        if (!site) {
            return res.status(404).json({ error: "Not found" });
        }
        const smtpConfig = (0, smtp_1.getSmtpConfig)(site);
        if (!smtpConfig.ok) {
            return res.status(400).json({ error: smtpConfig.error });
        }
        const transport = (0, smtp_1.createSmtpTransport)(smtpConfig.config, {
            connectionTimeout: 8000,
            greetingTimeout: 8000,
            socketTimeout: 10000,
        });
        const startedAt = Date.now();
        try {
            await transport.verify();
        }
        catch (err) {
            const error = getErrorMessage(err);
            return res.status(502).json({ error });
        }
        finally {
            if (typeof transport.close === "function") {
                try {
                    transport.close();
                }
                catch (closeErr) {
                    console.warn("Failed to close SMTP transport:", closeErr);
                }
            }
        }
        return res.json({
            ok: true,
            latency_ms: Date.now() - startedAt,
        });
    }
    catch (err) {
        console.error("Failed to test SMTP connection:", err);
        return res.status(500).json({ error: getErrorMessage(err) });
    }
});
exports.default = router;
